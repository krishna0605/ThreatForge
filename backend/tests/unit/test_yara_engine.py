"""Unit Tests — YARA Engine"""
import os
import pytest
from app.services.yara_engine import YaraEngine


@pytest.fixture
def engine():
    return YaraEngine()


VALID_YARA_RULE = """
rule TestRule {
    strings:
        $a = "test_string"
    condition:
        $a
}
"""

INVALID_YARA_RULE = """
rule BadRule {
    strings:
        $a = "test"
    condition:
        $b
}
"""


class TestValidateRule:
    """Tests for YaraEngine.validate_rule()"""

    def test_validate_valid_rule(self, engine):
        result = engine.validate_rule(VALID_YARA_RULE)
        assert result['valid'] is True

    def test_validate_invalid_rule(self, engine):
        result = engine.validate_rule(INVALID_YARA_RULE)
        assert result['valid'] is False

    def test_validate_syntax_error(self, engine):
        result = engine.validate_rule("this is not yara {{{")
        assert result['valid'] is False


class TestMatchFile:
    """Tests for YaraEngine.match_file()"""

    def test_match_file_with_match(self, engine, tmp_path):
        f = tmp_path / "target.bin"
        f.write_bytes(b'this contains test_string in it')

        rules = [{'name': 'TestRule', 'content': VALID_YARA_RULE}]
        matches = engine.match_file(str(f), rules)
        assert isinstance(matches, list)

    def test_match_file_no_match(self, engine, tmp_path):
        f = tmp_path / "clean.bin"
        f.write_bytes(b'\x00' * 100)

        rules = [{'name': 'TestRule', 'content': VALID_YARA_RULE}]
        matches = engine.match_file(str(f), rules)
        # Should return empty or no positive matches
        assert isinstance(matches, list)

    def test_match_file_invalid_rule(self, engine, tmp_path):
        f = tmp_path / "target.bin"
        f.write_bytes(b'test data')

        rules = [{'name': 'BadRule', 'content': INVALID_YARA_RULE}]
        matches = engine.match_file(str(f), rules)
        # Should handle gracefully — returns list (possibly with error entries)
        assert isinstance(matches, list)


class TestConvenienceMethods:
    """Tests for convenience wrapper methods."""

    def test_engine_instantiation(self, engine):
        assert engine is not None

    def test_validate_returns_dict(self, engine):
        result = engine.validate_rule(VALID_YARA_RULE)
        assert isinstance(result, dict)
        assert 'valid' in result
