"""File Analyzer Service"""
import os
import math
import hashlib
from typing import Dict, Any


class FileAnalyzer:
    """Analyze files for metadata, entropy, and PE headers."""

    @staticmethod
    def calculate_entropy(data: bytes) -> float:
        """Calculate Shannon entropy of data."""
        if not data:
            return 0.0
        byte_counts = [0] * 256
        for byte in data:
            byte_counts[byte] += 1
        length = len(data)
        entropy = 0.0
        for count in byte_counts:
            if count > 0:
                probability = count / length
                entropy -= probability * math.log2(probability)
        return round(entropy, 4)

    @staticmethod
    def calculate_file_hash(file_path: str) -> str:
        """Calculate SHA-256 hash of a file."""
        sha256 = hashlib.sha256()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                sha256.update(chunk)
        return sha256.hexdigest()

    @staticmethod
    def get_file_metadata(file_path: str) -> Dict[str, Any]:
        """Extract file metadata using python-magic and os.stat."""
        try:
            import magic  # python-magic-bin

            stat = os.stat(file_path)

            # Create magic instance for MIME type
            mime = magic.Magic(mime=True)
            mime_type = mime.from_file(file_path)

            # Create magic instance for description
            magic_desc = magic.Magic()
            description = magic_desc.from_file(file_path)

            return {
                'filename': os.path.basename(file_path),
                'size': stat.st_size,
                'mime_type': mime_type,
                'magic_description': description,
            }
        except ImportError:
            # Fallback if magic is not installed
            stat = os.stat(file_path)
            return {
                'filename': os.path.basename(file_path),
                'size': stat.st_size,
                'mime_type': 'application/octet-stream',
                'magic_description': 'Unknown (magic not installed)',
            }
        except Exception as e:
            return {
                'filename': os.path.basename(file_path),
                'size': 0,
                'mime_type': 'application/octet-stream',
                'magic_description': f'Error: {str(e)}',
            }

    @staticmethod
    def parse_pe_headers(file_path: str) -> Dict[str, Any]:
        """Parse PE headers from executable files using pefile."""
        try:
            import pefile
        except ImportError:
            return {'is_pe': False, 'error': 'pefile not installed'}

        try:
            pe = pefile.PE(file_path)
            sections = []
            for section in pe.sections:
                sections.append({
                    'name': section.Name.decode('utf-8', errors='replace').strip('\x00'),
                    'virtual_size': section.Misc_VirtualSize,
                    'raw_size': section.SizeOfRawData,
                    'entropy': round(section.get_entropy(), 4),
                })
            imports = []
            if hasattr(pe, 'DIRECTORY_ENTRY_IMPORT'):
                for entry in pe.DIRECTORY_ENTRY_IMPORT:
                    dll_name = entry.dll.decode('utf-8', errors='replace')
                    funcs = [imp.name.decode('utf-8', errors='replace') for imp in entry.imports if imp.name]
                    imports.append({'dll': dll_name, 'functions': funcs[:20]})

            return {
                'is_pe': True,
                'sections': sections,
                'imports': imports,
                'entry_point': hex(pe.OPTIONAL_HEADER.AddressOfEntryPoint),
                'image_base': hex(pe.OPTIONAL_HEADER.ImageBase),
                'number_of_sections': len(sections),
            }
        except pefile.PEFormatError:
            return {'is_pe': False, 'sections': [], 'imports': [], 'entry_point': None}
        except Exception as e:
            return {'is_pe': False, 'error': str(e)}

    @staticmethod
    def extract_features_for_ml(file_path: str, metadata: Dict, entropy: float, pe_info: Dict) -> list:
        """
        Extract a numeric feature vector for the ML malware classifier.
        Features: [file_size, entropy, is_pe, num_sections, num_imports,
                   has_suspicious_section_name, max_section_entropy, entry_point_int]
        """
        file_size = metadata.get('size', 0)
        is_pe = 1 if pe_info.get('is_pe') else 0
        num_sections = pe_info.get('number_of_sections', 0)
        num_imports = sum(len(imp.get('functions', [])) for imp in pe_info.get('imports', []))

        suspicious_names = ['.rsrc', '.reloc', 'UPX', '.packed']
        has_suspicious = 0
        max_section_entropy = 0.0
        for sec in pe_info.get('sections', []):
            if any(s in sec.get('name', '') for s in suspicious_names):
                has_suspicious = 1
            max_section_entropy = max(max_section_entropy, sec.get('entropy', 0))

        entry_point = 0
        ep_str = pe_info.get('entry_point', '0x0')
        if ep_str:
            try:
                entry_point = int(ep_str, 16)
            except (ValueError, TypeError):
                entry_point = 0

        return [file_size, entropy, is_pe, num_sections, num_imports,
                has_suspicious, max_section_entropy, entry_point]

    @staticmethod
    def extract_strings(data: bytes, min_length: int = 6) -> Dict[str, Any]:
        """
        Extract ASCII and Unicode strings from file data and identify suspicious patterns.

        Returns:
            Dict with all_strings, suspicious_strings, and categorized IOCs.
        """
        import re

        # Extract ASCII strings
        ascii_strings = re.findall(rb'[\x20-\x7e]{' + str(min_length).encode() + rb',}', data)
        decoded_strings = [s.decode('ascii', errors='ignore') for s in ascii_strings]

        # Extract wide (UTF-16 LE) strings
        wide_pattern = rb'(?:[\x20-\x7e]\x00){' + str(min_length).encode() + rb',}'
        wide_strings = re.findall(wide_pattern, data)
        decoded_wide = [s.decode('utf-16-le', errors='ignore') for s in wide_strings]

        all_strings = list(set(decoded_strings + decoded_wide))

        # Classify suspicious strings
        suspicious = []
        urls = []
        ips = []
        emails = []
        registry_keys = []

        url_pattern = re.compile(r'https?://[\w\-._~:/?#\[\]@!$&\'()*+,;=%]+', re.IGNORECASE)
        ip_pattern = re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b')
        email_pattern = re.compile(r'[\w.+-]+@[\w-]+\.[\w.]+')
        registry_pattern = re.compile(r'HKEY_[\w\\]+', re.IGNORECASE)
        exec_pattern = re.compile(
            r'(?:cmd\.exe|powershell|wscript|cscript|mshta|rundll32|regsvr32|certutil)',
            re.IGNORECASE)
        b64_pattern = re.compile(r'[A-Za-z0-9+/]{40,}={0,2}')

        for s in all_strings:
            found_url = url_pattern.findall(s)
            found_ip = ip_pattern.findall(s)
            found_email = email_pattern.findall(s)
            found_reg = registry_pattern.findall(s)
            found_exec = exec_pattern.findall(s)
            found_b64 = b64_pattern.findall(s)

            urls.extend(found_url)
            ips.extend(found_ip)
            emails.extend(found_email)
            registry_keys.extend(found_reg)

            if found_url or found_ip or found_email or found_reg or found_exec or found_b64:
                suspicious.append(s[:200])

        # Deduplicate and limit
        return {
            'total_strings': len(all_strings),
            'suspicious_strings': list(set(suspicious))[:50],
            'urls': list(set(urls))[:20],
            'ips': list(set(ips))[:20],
            'emails': list(set(emails))[:10],
            'registry_keys': list(set(registry_keys))[:10],
        }
