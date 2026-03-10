"""Tests — Model Registry"""
import pytest
import json
import os
from unittest.mock import patch, mock_open
from app.services.model_registry import ModelRegistry


class TestModelRegistry:
    """Tests for the ModelRegistry class."""

    def setup_method(self):
        """Reset registry cache before each test."""
        ModelRegistry._manifest = None

    def test_load_manifest(self):
        """Verify model_registry.json loads correctly."""
        manifest = ModelRegistry.get_manifest()
        assert 'models' in manifest
        assert 'schema_version' in manifest

    def test_get_active_models(self):
        """Verify only active models returned."""
        models = ModelRegistry.get_active_models()
        assert isinstance(models, dict)
        # All models in our registry are active
        for name, info in models.items():
            assert info.get('active') is True

    def test_get_active_models_returns_expected(self):
        """Verify the 3 expected models exist."""
        models = ModelRegistry.get_active_models()
        expected = {'malware_rf_v1', 'stego_lr_v1', 'network_if_v1'}
        assert expected.issubset(set(models.keys()))

    def test_get_model_info_existing(self):
        """Verify metadata returned for known model."""
        info = ModelRegistry.get_model_info('malware_rf_v1')
        assert info.get('algorithm') == 'RandomForest'
        assert info.get('version') == '1.0.0'
        assert 'features' in info
        assert 'metrics' in info

    def test_get_model_info_missing(self):
        """Verify graceful handling of unknown model name."""
        info = ModelRegistry.get_model_info('nonexistent_model')
        assert info == {}

    def test_get_model_path(self):
        """Verify model path resolution."""
        path = ModelRegistry.get_model_path('malware_rf_v1')
        assert path.endswith('malware_rf_v1.joblib')
        assert 'ml' in path and 'models' in path

    def test_manifest_caching(self):
        """Verify manifest is loaded once and cached."""
        m1 = ModelRegistry.get_manifest()
        m2 = ModelRegistry.get_manifest()
        assert m1 is m2  # Same object reference = cached

    def test_reload(self):
        """Verify reload forces re-read from disk."""
        m1 = ModelRegistry.get_manifest()
        m2 = ModelRegistry.reload()
        assert m1 is not m2  # Different objects after reload

    def test_missing_registry_file(self, tmp_path, monkeypatch):
        """Verify graceful fallback when registry file doesn't exist."""
        ModelRegistry._manifest = None
        monkeypatch.setattr(
            'app.services.model_registry._REGISTRY_PATH',
            str(tmp_path / 'nonexistent.json')
        )
        manifest = ModelRegistry.get_manifest()
        assert manifest == {"schema_version": "1.0", "models": {}}

    def test_corrupt_registry_file(self, tmp_path, monkeypatch):
        """Verify graceful fallback when registry JSON is invalid."""
        ModelRegistry._manifest = None
        bad_file = tmp_path / 'bad_registry.json'
        bad_file.write_text('{invalid json!!!}')
        monkeypatch.setattr(
            'app.services.model_registry._REGISTRY_PATH',
            str(bad_file)
        )
        manifest = ModelRegistry.get_manifest()
        assert manifest == {"schema_version": "1.0", "models": {}}

    def test_model_metadata_fields(self):
        """Verify all models have required metadata fields."""
        models = ModelRegistry.get_active_models()
        required_fields = {'filename', 'algorithm', 'version', 'features', 'active'}
        for name, info in models.items():
            for field in required_fields:
                assert field in info, f"Model {name} missing field: {field}"
