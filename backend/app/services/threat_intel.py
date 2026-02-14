"""Threat Intelligence Service"""

from typing import List, Dict, Any
import random
import hashlib
from datetime import datetime, timezone


class ThreatIntelService:
    """Integration with external threat intelligence APIs."""

    def __init__(self):
        # Simulation mode: In a real deployment, API keys would be loaded from env
        self.sources = {
            'abuseipdb': 'https://api.abuseipdb.com/api/v2',
            'otx': 'https://otx.alienvault.com/api/v1',
        }
        self.simulated_mode = True

    def get_feed(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get aggregated threat intelligence feed."""
        if self.simulated_mode:
            return self._generate_mock_feed(limit)

        # Real implementation would aggregate from configured sources
        return []

    def lookup_ip(self, ip_address: str) -> Dict[str, Any]:
        """Look up threat intel for an IP address."""
        if self.simulated_mode:
            is_malicious = random.random() < 0.2  # 20% chance of being malicious in simulation
            return {
                'ip': ip_address,
                'is_malicious': is_malicious,
                'reputation_score': random.randint(0, 100) if is_malicious else 0,
                'reports': [
                    {'source': 'Simulation', 'detected_at': datetime.now(timezone.utc).isoformat(), 'category': 'Brute Force'}
                ] if is_malicious else [],
                'last_seen': datetime.now(timezone.utc).isoformat() if is_malicious else None
            }
        return {'ip': ip_address, 'reports': []}

    def lookup_hash(self, file_hash: str) -> Dict[str, Any]:
        """Look up threat intel for a file hash."""
        if self.simulated_mode:
            is_malicious = random.random() < 0.1
            return {
                'hash': file_hash,
                'is_malicious': is_malicious,
                'malware_family': random.choice(['Emotet', 'TrickBot', 'CobaltStrike', 'None']) if is_malicious else None,
                'reports': [
                    {'source': 'Simulation', 'detected_at': datetime.now(timezone.utc).isoformat()}
                ] if is_malicious else []
            }
        return {'hash': file_hash, 'reports': []}

    def get_geo_threats(self) -> List[Dict[str, Any]]:
        """Get geo-located threat data for map visualization."""
        if self.simulated_mode:
            threats = []
            for _ in range(20):
                threats.append({
                    'id': hashlib.md5(str(random.random()).encode()).hexdigest(),
                    'lat': random.uniform(-90, 90),
                    'lon': random.uniform(-180, 180),
                    'type': random.choice(['ddos', 'malware', 'phishing', 'botnet']),
                    'severity': random.choice(['low', 'medium', 'high', 'critical']),
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
            return threats
        return []

    def _generate_mock_feed(self, limit: int) -> List[Dict[str, Any]]:
        """Generate mock threat feed data."""
        feed = []
        types = ['IP', 'Domain', 'Hash', 'URL']
        threats = ['Botnet C2', 'Phishing', 'Malware Distribution', 'Scanner']
        for _ in range(limit):
            feed.append({
                'id': hashlib.md5(str(random.random()).encode()).hexdigest(),
                'indicator': f'192.168.1.{random.randint(1, 255)}',
                'type': random.choice(types),
                'threat': random.choice(threats),
                'confidence': random.randint(50, 100),
                'source': 'Simulated Feed',
                'detected_at': datetime.now(timezone.utc).isoformat()
            })
        return feed
