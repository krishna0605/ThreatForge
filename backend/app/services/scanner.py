"""Scan Orchestrator Service"""
import os
import time
import requests
from typing import Dict, Any, List

import logging

from .file_analyzer import FileAnalyzer
from .yara_engine import YaraEngine
from .ml_client import MLClient

logger = logging.getLogger(__name__)


class ScanOrchestrator:
    """Orchestrates the complete scan workflow for a single file."""

    def __init__(self):
        self.file_analyzer = FileAnalyzer()
        self.yara_engine = YaraEngine()

    def run_scan(self, file_path: str, options: Dict[str, Any],
                 yara_rules: List[Dict[str, str]] = None,
                 ml_service_url: str = None) -> Dict[str, Any]:
        """
        Execute a full scan on a file.

        Steps (each gated by its option flag):
        1. Extract file metadata (always runs)
        2. Calculate entropy (if enable_entropy)
        3. Parse PE headers (if enable_pe)
        4. Run YARA rules (if enable_yara)
        5. Send to ML models (if enable_ml)
        6. Steganography analysis (if enable_stego)
        7. Network/PCAP analysis (if enable_pcap)
        8. String extraction (always runs for enrichment)
        9. Combine results and determine severity
        """
        start_time = time.time()
        findings = []

        # Step 1: File metadata (always runs)
        metadata = self.file_analyzer.get_file_metadata(file_path)
        file_hash = self.file_analyzer.calculate_file_hash(file_path)

        with open(file_path, 'rb') as f:
            file_data = f.read()

        # Step 2: Entropy Analysis
        entropy = 0.0
        if options.get('enable_entropy', True):
            entropy = self.file_analyzer.calculate_entropy(file_data)
            if entropy > 7.5:
                findings.append({
                    'finding_type': 'entropy',
                    'severity': 'medium',
                    'title': f'High entropy detected ({entropy})',
                    'description': f'File has entropy of {entropy}/8.0, suggesting packed or encrypted content.',
                    'confidence': min(entropy / 8.0, 1.0),
                    'details': {'entropy': entropy, 'threshold': 7.5},
                    'remediation': 'Investigate if the file is packed '
                    'with UPX or similar. High entropy alone is not malicious.',
                })
        else:
            # Still calculate for metadata but don't flag
            entropy = self.file_analyzer.calculate_entropy(file_data)

        # Step 3: PE Header Inspection
        pe_info = {'is_pe': False}
        if options.get('enable_pe', True):
            pe_info = self.file_analyzer.parse_pe_headers(file_path)
            if pe_info.get('is_pe'):
                # Flag suspicious sections
                for section in pe_info.get('sections', []):
                    if section.get('entropy', 0) > 7.2:
                        findings.append({
                            'finding_type': 'pe_header',
                            'severity': 'high',
                            'title': f'Suspicious PE section: {section["name"]}',
                            'description': (
                                f'Section {section["name"]} has entropy '
                                f'{section["entropy"]}, likely packed.'
                            ),
                            'confidence': 0.75,
                            'details': {'section': section},
                            'remediation': 'Unpack the executable and re-analyze.',
                        })
                # Check for suspicious imports
                suspicious_imports = self._check_suspicious_imports(pe_info)
                if suspicious_imports:
                    findings.append({
                        'finding_type': 'pe_header',
                        'severity': 'medium',
                        'title': 'Suspicious API imports detected',
                        'description': f'File imports {len(suspicious_imports)} potentially dangerous APIs.',
                        'confidence': 0.65,
                        'details': {'suspicious_apis': suspicious_imports},
                        'remediation': 'Review the imported APIs for potentially malicious behavior.',
                    })

        # Step 4: YARA Rules
        yara_matches = []
        if options.get('enable_yara', True) and yara_rules:
            yara_matches = self.yara_engine.match_file(file_path, yara_rules)
            for match in yara_matches:
                if 'error' in match:
                    continue
                findings.append({
                    'finding_type': 'yara',
                    'severity': 'high',
                    'title': f'YARA match: {match["rule_name"]}',
                    'description': f'File matched YARA rule "{match["rule_name"]}".',
                    'confidence': 0.9,
                    'details': {'match': match},
                    'remediation': 'Review the matched rule and quarantine if necessary.',
                })

        # Step 5: ML Malware Detection
        ml_prediction = None
        logger.info(f"ML Check: enable_ml={options.get('enable_ml')}, url={ml_service_url}")
        if options.get('enable_ml', True) and ml_service_url:
            ml_prediction = self._run_ml_analysis(file_path, ml_service_url, findings)
            logger.info(f"ML Result: {ml_prediction}")

        # Step 6: Steganography Analysis
        stego_result = None
        if options.get('enable_stego', False) and ml_service_url:
            stego_result = self._run_stego_analysis(file_path, ml_service_url, findings)

        # Step 7: Network/PCAP Analysis
        network_result = None
        if options.get('enable_pcap', False) and ml_service_url:
            network_result = self._run_network_analysis(file_path, ml_service_url, findings)

        # Step 8: String Extraction (enrichment — stored as finding for display)
        strings_result = self.file_analyzer.extract_strings(file_data)
        if strings_result.get('suspicious_strings'):
            findings.append({
                'finding_type': 'entropy',  # Using 'entropy' type (allowed by DB) for string analysis
                'severity': 'low',
                'title': f'Suspicious strings found ({len(strings_result["suspicious_strings"])})',
                'description': 'File contains strings that may indicate malicious behavior (URLs, IPs, registry keys).',
                'confidence': 0.5,
                'details': {'strings': strings_result},
                'remediation': 'Review the extracted strings for indicators of compromise.',
            })

        # Step 9: Calculate overall threat score
        duration = round(time.time() - start_time, 2)
        threat_score = self._calculate_threat_score(findings)

        return {
            'metadata': {**metadata, 'sha256': file_hash},
            'entropy': entropy,
            'pe_info': pe_info,
            'yara_matches': yara_matches,
            'ml_prediction': ml_prediction,
            'stego_result': stego_result,
            'network_result': network_result,
            'strings_result': strings_result,
            'findings': findings,
            'threat_score': threat_score,
            'duration_seconds': duration,
        }

    def _run_ml_analysis(self, file_path: str, ml_service_url: str, findings: list) -> dict:
        """Run ML malware prediction."""
        try:
            ml_client = MLClient(base_url=ml_service_url)
            # Skip explicit health check to catch connection errors in predict_file
            prediction = ml_client.predict_file(file_path)
            if prediction and not prediction.get('error'):
                score = prediction.get('score', 0)
                label = prediction.get('label', 'unknown')
                if label in ('malicious', 'suspicious') or score > 50:
                    severity = 'critical' if label == 'malicious' else 'high'
                    findings.append({
                        'finding_type': 'malware',
                        'severity': severity,
                        'title': f'ML Detection: {label.capitalize()} (Score: {score})',
                        'description': f'ML model classified this file as {label} with a threat score of {score}.',
                        'confidence': score / 100.0,
                        'details': {'ml_response': prediction},
                        'remediation': 'Quarantine immediately. Do not execute this file.',
                    })
            elif prediction and prediction.get('error'):
                logger.warning(f"ML Prediction failed: {prediction.get('error')}")
            return prediction

        except Exception as e:
            logger.error(f"ML analysis error: {str(e)}")
            return {'error': f'ML service unreachable: {str(e)}'}
        return None

    def _run_stego_analysis(self, file_path: str, ml_service_url: str, findings: list) -> dict:
        """Run steganography detection on image files."""
        # Check if file is an image type
        ext = os.path.splitext(file_path)[1].lower()
        image_exts = {'.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.webp'}
        if ext not in image_exts:
            return {'skipped': True, 'reason': f'Not an image file ({ext})'}

        try:
            ml_api_key = os.environ.get('ML_API_KEY', '')
            headers = {'X-API-Key': ml_api_key} if ml_api_key else {}
            with open(file_path, 'rb') as f:
                response = requests.post(
                    f'{ml_service_url}/analyze/stego',
                    files={'file': (os.path.basename(file_path), f)},
                    headers=headers,
                    timeout=60
                )
            if response.status_code == 200:
                result = response.json()
                if result.get('has_hidden_data'):
                    confidence = result.get('confidence', 0.5)
                    findings.append({
                        'finding_type': 'steganography',
                        'severity': 'high' if confidence > 0.8 else 'medium',
                        'title': 'Hidden data detected in image',
                        'description': (
                            f'Steganographic analysis detected hidden data '
                            f'with {confidence*100:.0f}% confidence.'
                        ),
                        'confidence': confidence,
                        'details': {'stego_analysis': result},
                        'remediation': 'Extract and analyze the hidden payload. '
                        'The image may be used for data exfiltration.',
                    })
                return result
            else:
                return {'error': f'Stego endpoint returned {response.status_code}'}
        except requests.RequestException as e:
            return {'error': f'Stego service unreachable: {str(e)}'}

    def _run_network_analysis(self, file_path: str, ml_service_url: str, findings: list) -> dict:
        """Run network traffic analysis on PCAP files."""
        ext = os.path.splitext(file_path)[1].lower()
        pcap_exts = {'.pcap', '.pcapng', '.cap'}
        if ext not in pcap_exts:
            return {'skipped': True, 'reason': f'Not a PCAP file ({ext})'}

        try:
            ml_api_key = os.environ.get('ML_API_KEY', '')
            headers = {'X-API-Key': ml_api_key} if ml_api_key else {}
            with open(file_path, 'rb') as f:
                response = requests.post(
                    f'{ml_service_url}/analyze/network',
                    files={'file': (os.path.basename(file_path), f)},
                    headers=headers,
                    timeout=120
                )
            if response.status_code == 200:
                result = response.json()
                # Flag anomalies
                if result.get('is_anomalous'):
                    findings.append({
                        'finding_type': 'network',
                        'severity': 'high',
                        'title': 'Network anomaly detected in PCAP',
                        'description': f'Anomalous traffic patterns found. Score: {result.get("anomaly_score", 0):.2f}',
                        'confidence': min(abs(result.get('anomaly_score', 0)) / 10, 1.0),
                        'details': {'network_analysis': result},
                        'remediation': 'Investigate the flagged network flows '
                        'for potential C2 communication or data exfiltration.',
                    })
                # Flag suspicious DNS queries
                suspicious_dns = result.get('suspicious_dns', [])
                if suspicious_dns:
                    findings.append({
                        'finding_type': 'network',
                        'severity': 'medium',
                        'title': f'Suspicious DNS queries ({len(suspicious_dns)})',
                        'description': 'PCAP contains queries to '
                        'potentially malicious domains.',
                        'confidence': 0.7,
                        'details': {'suspicious_domains': suspicious_dns},
                        'remediation': 'Block the listed domains and investigate affected hosts.',
                    })
                # Flag IOCs
                iocs = result.get('iocs_found', [])
                if iocs:
                    findings.append({
                        'finding_type': 'network',
                        'severity': 'critical',
                        'title': f'Known IOCs detected ({len(iocs)})',
                        'description': f'Traffic to known malicious indicators: {", ".join(iocs[:5])}',
                        'confidence': 0.95,
                        'details': {'iocs': iocs},
                        'remediation': 'Immediately isolate the affected system and perform incident response.',
                    })
                return result
            else:
                return {'error': f'Network endpoint returned {response.status_code}'}
        except requests.RequestException as e:
            return {'error': f'Network service unreachable: {str(e)}'}

    @staticmethod
    def _check_suspicious_imports(pe_info: dict) -> list:
        """Check PE imports for potentially dangerous APIs."""
        suspicious_apis = {
            'VirtualAlloc', 'VirtualProtect', 'WriteProcessMemory',
            'CreateRemoteThread', 'NtUnmapViewOfSection', 'QueueUserAPC',
            'SetWindowsHookEx', 'URLDownloadToFile', 'WinExec',
            'ShellExecute', 'CreateProcessA', 'CreateProcessW',
            'RegSetValueEx', 'CryptEncrypt', 'InternetOpen',
            'HttpSendRequest', 'IsDebuggerPresent', 'GetTickCount',
        }
        found = []
        for imp in pe_info.get('imports', []):
            for func in imp.get('functions', []):
                if func in suspicious_apis:
                    found.append(f'{imp["dll"]}::{func}')
        return found

    @staticmethod
    def _calculate_threat_score(findings: List[Dict]) -> int:
        """0-100 threat score based on findings."""
        if not findings:
            return 0
        severity_weights = {'critical': 40, 'high': 25, 'medium': 10, 'low': 3, 'info': 1}
        score = 0
        for f in findings:
            weight = severity_weights.get(f.get('severity', 'info'), 1)
            confidence = f.get('confidence', 0.5)
            score += weight * confidence
        return min(int(score), 100)
