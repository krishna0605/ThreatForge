"""Unit Tests — FileAnalyzer Service"""
import os
import math
import hashlib
import tempfile
import pytest
from app.services.file_analyzer import FileAnalyzer


class TestCalculateEntropy:
    """Tests for Shannon entropy calculation."""

    def test_entropy_empty_bytes(self):
        assert FileAnalyzer.calculate_entropy(b'') == 0.0

    def test_entropy_single_byte_repeated(self):
        assert FileAnalyzer.calculate_entropy(b'\x00' * 1000) == 0.0

    def test_entropy_uniform_distribution(self):
        data = bytes(range(256))
        entropy = FileAnalyzer.calculate_entropy(data)
        assert 7.99 <= entropy <= 8.0

    def test_entropy_realistic_binary(self):
        data = b'MZ\x90\x00\x03\x00\x00\x00' * 50
        entropy = FileAnalyzer.calculate_entropy(data)
        assert 0 < entropy < 8.0

    def test_entropy_two_unique_bytes(self):
        data = b'\x00\xff' * 500
        entropy = FileAnalyzer.calculate_entropy(data)
        assert abs(entropy - 1.0) < 0.01


class TestCalculateFileHash:
    """Tests for SHA-256 hashing."""

    def test_file_hash_known_content(self, tmp_path):
        f = tmp_path / "test.bin"
        content = b'Hello, ThreatForge!'
        f.write_bytes(content)
        expected = hashlib.sha256(content).hexdigest()
        assert FileAnalyzer.calculate_file_hash(str(f)) == expected

    def test_file_hash_empty_file(self, tmp_path):
        f = tmp_path / "empty.bin"
        f.write_bytes(b'')
        expected = hashlib.sha256(b'').hexdigest()
        assert FileAnalyzer.calculate_file_hash(str(f)) == expected


class TestGetFileMetadata:
    """Tests for file metadata extraction."""

    def test_file_metadata_basic_keys(self, tmp_path):
        f = tmp_path / "sample.txt"
        f.write_text("test content")
        result = FileAnalyzer.get_file_metadata(str(f))
        assert 'filename' in result
        assert 'size' in result
        assert 'mime_type' in result
        assert result['filename'] == 'sample.txt'
        assert result['size'] > 0

    def test_file_metadata_size_accuracy(self, tmp_path):
        content = b'A' * 1024
        f = tmp_path / "exact.bin"
        f.write_bytes(content)
        result = FileAnalyzer.get_file_metadata(str(f))
        assert result['size'] == 1024


class TestParsePeHeaders:
    """Tests for PE header parsing."""

    def test_pe_headers_non_pe_file(self, tmp_path):
        f = tmp_path / "notpe.txt"
        f.write_text("This is not a PE file")
        result = FileAnalyzer.parse_pe_headers(str(f))
        assert result['is_pe'] is False

    def test_pe_headers_returns_dict(self, tmp_path):
        f = tmp_path / "fake.exe"
        f.write_bytes(b'MZ' + b'\x00' * 200)
        result = FileAnalyzer.parse_pe_headers(str(f))
        assert isinstance(result, dict)
        assert 'is_pe' in result


class TestExtractStrings:
    """Tests for string extraction from binaries."""

    def test_extract_strings_finds_ascii(self):
        data = b'\x00\x00This is a test string embedded here\x00\x00'
        result = FileAnalyzer.extract_strings(data, min_length=6)
        assert result['total_strings'] > 0

    def test_extract_strings_finds_urls(self):
        data = b'\x00\x00https://malicious-domain.com/payload\x00\x00'
        result = FileAnalyzer.extract_strings(data, min_length=6)
        assert len(result['urls']) > 0
        assert 'malicious-domain.com' in result['urls'][0]

    def test_extract_strings_empty_data(self):
        result = FileAnalyzer.extract_strings(b'', min_length=6)
        assert result['total_strings'] == 0
        assert result['suspicious_strings'] == []


class TestExtractFeaturesForML:
    """Tests for ML feature vector extraction."""

    def test_feature_vector_length(self):
        metadata = {'size': 1024}
        pe_info = {'is_pe': True, 'number_of_sections': 3, 'imports': [], 'sections': [], 'entry_point': '0x1000'}
        features = FileAnalyzer.extract_features_for_ml("fake", metadata, 5.5, pe_info)
        assert len(features) == 8

    def test_feature_vector_values(self):
        metadata = {'size': 2048}
        pe_info = {'is_pe': False, 'number_of_sections': 0, 'imports': [], 'sections': [], 'entry_point': '0x0'}
        features = FileAnalyzer.extract_features_for_ml("fake", metadata, 3.0, pe_info)
        assert features[0] == 2048    # file_size
        assert features[1] == 3.0      # entropy
        assert features[2] == 0        # is_pe (False)
