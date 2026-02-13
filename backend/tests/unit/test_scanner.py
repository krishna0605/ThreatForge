"""Unit Tests — ScanOrchestrator"""
import os
import pytest
from unittest.mock import patch, MagicMock


@pytest.fixture
def scanner():
    from app.services.scanner import ScanOrchestrator
    return ScanOrchestrator()


@pytest.fixture
def sample_file(tmp_path):
    f = tmp_path / "test.bin"
    f.write_bytes(b'\x00' * 256)
    return str(f)


class TestRunScan:
    """Tests for ScanOrchestrator.run_scan()"""

    def test_run_scan_basic(self, scanner, sample_file):
        options = {'enable_yara': False, 'enable_ml': False, 'enable_stego': False, 'enable_pcap': False}
        results = scanner.run_scan(sample_file, options)
        assert 'metadata' in results
        assert 'threat_score' in results
        assert 'findings' in results

    def test_run_scan_returns_duration(self, scanner, sample_file):
        options = {'enable_yara': False, 'enable_ml': False, 'enable_stego': False, 'enable_pcap': False}
        results = scanner.run_scan(sample_file, options)
        # Actual key is 'duration_seconds'
        assert 'duration_seconds' in results
        assert isinstance(results['duration_seconds'], float)

    def test_run_scan_includes_threat_score(self, scanner, sample_file):
        options = {'enable_yara': False, 'enable_ml': False}
        results = scanner.run_scan(sample_file, options)
        assert 0 <= results['threat_score'] <= 100

    def test_run_scan_with_ml_disabled(self, scanner, sample_file):
        options = {'enable_ml': False, 'enable_yara': False, 'enable_stego': False, 'enable_pcap': False}
        results = scanner.run_scan(sample_file, options)
        assert results['ml_prediction'] is None

    def test_run_scan_with_yara_disabled(self, scanner, sample_file):
        options = {'enable_yara': False, 'enable_ml': False, 'enable_stego': False, 'enable_pcap': False}
        results = scanner.run_scan(sample_file, options)
        assert results['yara_matches'] == []

    def test_run_scan_with_yara_no_rules(self, scanner, sample_file):
        options = {'enable_yara': True, 'enable_ml': False, 'enable_stego': False, 'enable_pcap': False}
        results = scanner.run_scan(sample_file, options, yara_rules=None)
        assert results['yara_matches'] == []


class TestThreatScore:
    """Tests for threat score calculation."""

    def test_clean_file_low_score(self, scanner, sample_file):
        options = {'enable_yara': False, 'enable_ml': False, 'enable_stego': False, 'enable_pcap': False}
        results = scanner.run_scan(sample_file, options)
        # A file of all zero bytes with no YARA/ML should have low threat
        assert results['threat_score'] <= 30


class TestMetadata:
    """Tests for file metadata in scan results."""

    def test_metadata_includes_sha256(self, scanner, sample_file):
        options = {'enable_yara': False, 'enable_ml': False, 'enable_stego': False, 'enable_pcap': False}
        results = scanner.run_scan(sample_file, options)
        assert 'sha256' in results['metadata']

    def test_metadata_includes_filename(self, scanner, sample_file):
        options = {'enable_yara': False, 'enable_ml': False, 'enable_stego': False, 'enable_pcap': False}
        results = scanner.run_scan(sample_file, options)
        assert 'filename' in results['metadata']

    def test_entropy_at_top_level(self, scanner, tmp_path):
        f = tmp_path / "ent.bin"
        f.write_bytes(b'\x00' * 256)
        options = {'enable_yara': False, 'enable_ml': False, 'enable_stego': False, 'enable_pcap': False}
        results = scanner.run_scan(str(f), options)
        # 'entropy' is a top-level key, not inside metadata
        assert 'entropy' in results
        assert isinstance(results['entropy'], float)

    def test_results_structure(self, scanner, tmp_path):
        f = tmp_path / "struct.bin"
        f.write_bytes(os.urandom(256))
        options = {'enable_yara': False, 'enable_ml': False, 'enable_stego': False, 'enable_pcap': False}
        results = scanner.run_scan(str(f), options)
        # Match actual return keys from ScanOrchestrator.run_scan
        expected_keys = {'metadata', 'entropy', 'findings', 'threat_score', 'duration_seconds'}
        assert expected_keys.issubset(set(results.keys()))
