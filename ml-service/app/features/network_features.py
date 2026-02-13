"""Network Feature Extraction for PCAP Analysis"""
import io
import struct
from typing import Dict, Any, List
from collections import Counter


class NetworkFeatureExtractor:
    """Extract features from network traffic data (PCAP files)."""

    # Known suspicious TLDs
    SUSPICIOUS_TLDS = {
        '.xyz', '.top', '.tk', '.ml', '.ga', '.cf', '.gq', '.pw',
        '.cc', '.su', '.ru', '.cn', '.onion', '.bit',
    }

    # Known malicious IP ranges (example IOCs - expandable)
    KNOWN_MALICIOUS_IPS = {
        '185.220.101.',  # Tor exit nodes
        '45.33.32.',     # Known scanner IPs
        '198.51.100.',   # Documentation/test range
    }

    @staticmethod
    def extract(pcap_input: Any) -> Dict[str, Any]:
        """
        Extract features from PCAP input (bytes or file path).

        Features include:
        - Packet size statistics
        - Inter-arrival time estimates
        - Port distribution
        - Protocol distribution
        - DNS queries extraction
        - IOC detection
        """
        import mmap
        
        try:
            if isinstance(pcap_input, str):
                with open(pcap_input, "rb") as f:
                    # Use mmap for large file support
                    with mmap.mmap(f.fileno(), 0, access=mmap.ACCESS_READ) as mm:
                        packets = NetworkFeatureExtractor._parse_pcap(mm)
            elif isinstance(pcap_input, bytes):
                packets = NetworkFeatureExtractor._parse_pcap(pcap_input)
            else:
                 # Attempt to read if it's a file-like object
                 packets = NetworkFeatureExtractor._parse_pcap(pcap_input.read())

            if not packets:
                return {'error': 'No packets parsed from PCAP'}

            # Packet size stats
            sizes = [p['length'] for p in packets]
            avg_size = sum(sizes) / len(sizes) if sizes else 0
            std_size = (sum((s - avg_size) ** 2 for s in sizes) / len(sizes)) ** 0.5 if len(sizes) > 1 else 0

            # Port analysis
            src_ports = Counter(p.get('src_port', 0) for p in packets if p.get('src_port'))
            dst_ports = Counter(p.get('dst_port', 0) for p in packets if p.get('dst_port'))
            all_ports = set(src_ports.keys()) | set(dst_ports.keys())

            # Protocol analysis
            protocols = Counter(p.get('protocol', 'unknown') for p in packets)

            # IP analysis
            src_ips = Counter(p.get('src_ip', '') for p in packets if p.get('src_ip'))
            dst_ips = Counter(p.get('dst_ip', '') for p in packets if p.get('dst_ip'))

            # DNS queries
            dns_queries = [p.get('dns_query') for p in packets if p.get('dns_query')]
            unique_dns = list(set(dns_queries))

            # Detect suspicious DNS
            suspicious_dns = []
            for domain in unique_dns:
                if any(domain.endswith(tld) for tld in NetworkFeatureExtractor.SUSPICIOUS_TLDS):
                    suspicious_dns.append(domain)
                # Check for high entropy domains (DGA detection)
                if len(domain) > 15 and NetworkFeatureExtractor._domain_entropy(domain) > 3.5:
                    suspicious_dns.append(domain)

            # IOC detection
            iocs_found = []
            all_ips = set(src_ips.keys()) | set(dst_ips.keys())
            for ip in all_ips:
                for prefix in NetworkFeatureExtractor.KNOWN_MALICIOUS_IPS:
                    if ip.startswith(prefix):
                        iocs_found.append(ip)

            # Flow analysis (simplified)
            unique_flows = set()
            for p in packets:
                flow = (p.get('src_ip', ''), p.get('dst_ip', ''),
                        p.get('src_port', 0), p.get('dst_port', 0))
                unique_flows.add(flow)

            # Anomaly heuristics
            anomaly_score = 0.0
            # Many connections to different IPs = scanning behavior
            if len(dst_ips) > 50:
                anomaly_score += 3.0
            # Many DNS queries to suspicious domains
            if len(suspicious_dns) > 3:
                anomaly_score += 4.0
            # High ratio of outbound connections
            if len(dst_ports) > 0 and dst_ports.most_common(1)[0][1] > len(packets) * 0.5:
                anomaly_score += 2.0
            # Known IOCs
            if iocs_found:
                anomaly_score += 5.0

            return {
                'packet_count': len(packets),
                'avg_packet_size': round(avg_size, 2),
                'std_packet_size': round(std_size, 2),
                'unique_ports': len(all_ports),
                'unique_flows': len(unique_flows),
                'protocols': dict(protocols.most_common(10)),
                'top_dst_ports': dict(dst_ports.most_common(10)),
                'top_src_ips': dict(src_ips.most_common(10)),
                'top_dst_ips': dict(dst_ips.most_common(10)),
                'dns_queries': unique_dns[:50],
                'suspicious_dns': list(set(suspicious_dns))[:20],
                'iocs_found': list(set(iocs_found)),
                'anomaly_score': round(anomaly_score, 2),
                'is_anomalous': anomaly_score > 4.0,
            }
        except Exception as e:
            return {'error': str(e), 'packet_count': 0}

    @staticmethod
    def _parse_pcap(data: bytes) -> List[Dict]:
        """Parse PCAP file format (libpcap)."""
        packets = []
        offset = 0

        # PCAP global header: magic(4) + version(4) + tz(4) + sigfigs(4) + snaplen(4) + network(4) = 24 bytes
        if len(data) < 24:
            return packets

        magic = struct.unpack('<I', data[0:4])[0]
        if magic == 0xa1b2c3d4:
            endian = '<'
        elif magic == 0xd4c3b2a1:
            endian = '>'
        elif magic == 0x4d3c2b1a: # Nanosecond pcap (big endian)
             endian = '>'
        elif magic == 0x1a2b3c4d: # Nanosecond pcap (little endian)
             endian = '<'
        else:
            return packets  # Not a valid PCAP file

        link_type = struct.unpack(f'{endian}I', data[20:24])[0]
        offset = 24

        while offset + 16 <= len(data):
            # Packet header: ts_sec(4) + ts_usec(4) + incl_len(4) + orig_len(4)
            ts_sec, ts_usec, incl_len, orig_len = struct.unpack(
                f'{endian}IIII', data[offset:offset + 16]
            )
            offset += 16

            if offset + incl_len > len(data):
                break

            pkt_data = data[offset:offset + incl_len]
            offset += incl_len

            # Parse Ethernet frame (link_type 1)
            packet_info = {
                'length': orig_len,
                'timestamp': ts_sec + ts_usec / 1e6,
            }

            if link_type == 1 and len(pkt_data) >= 14:
                # Ethernet header: dst(6) + src(6) + type(2)
                eth_type = struct.unpack('!H', pkt_data[12:14])[0]

                if eth_type == 0x0800 and len(pkt_data) >= 34:  # IPv4
                    ip_data = pkt_data[14:]
                    ihl = (ip_data[0] & 0x0F) * 4
                    protocol = ip_data[9]

                    src_ip = '.'.join(str(b) for b in ip_data[12:16])
                    dst_ip = '.'.join(str(b) for b in ip_data[16:20])

                    packet_info['src_ip'] = src_ip
                    packet_info['dst_ip'] = dst_ip

                    if protocol == 6:  # TCP
                        packet_info['protocol'] = 'TCP'
                        if len(ip_data) >= ihl + 4:
                            src_port, dst_port = struct.unpack('!HH', ip_data[ihl:ihl + 4])
                            packet_info['src_port'] = src_port
                            packet_info['dst_port'] = dst_port
                    elif protocol == 17:  # UDP
                        packet_info['protocol'] = 'UDP'
                        if len(ip_data) >= ihl + 4:
                            src_port, dst_port = struct.unpack('!HH', ip_data[ihl:ihl + 4])
                            packet_info['src_port'] = src_port
                            packet_info['dst_port'] = dst_port
                            # Check for DNS (port 53)
                            if dst_port == 53 and len(ip_data) >= ihl + 12:
                                dns_name = NetworkFeatureExtractor._parse_dns_query(ip_data[ihl + 8:])
                                if dns_name:
                                    packet_info['dns_query'] = dns_name
                    elif protocol == 1:
                        packet_info['protocol'] = 'ICMP'
                    else:
                        packet_info['protocol'] = f'IP-{protocol}'

            packets.append(packet_info)

        return packets

    @staticmethod
    def _parse_dns_query(dns_data: bytes) -> str:
        """Parse DNS query name from UDP payload."""
        try:
            # Skip DNS header (12 bytes: ID + flags + counts)
            if len(dns_data) < 12:
                return None
            offset = 12
            labels = []
            while offset < len(dns_data):
                length = dns_data[offset]
                if length == 0:
                    break
                if length > 63:
                    break  # Pointer, skip
                offset += 1
                if offset + length > len(dns_data):
                    break
                labels.append(dns_data[offset:offset + length].decode('ascii', errors='ignore'))
                offset += length
            return '.'.join(labels) if labels else None
        except Exception:
            return None

    @staticmethod
    def _domain_entropy(domain: str) -> float:
        """Calculate Shannon entropy of a domain name (for DGA detection)."""
        import math
        # Strip TLD for analysis
        parts = domain.split('.')
        if len(parts) > 1:
            name = parts[-2]
        else:
            name = domain

        if not name:
            return 0.0
        freq = Counter(name)
        length = len(name)
        return -sum((c / length) * math.log2(c / length) for c in freq.values())
