"""Tests for integrity-verified packaged model artifacts."""
from __future__ import annotations

import hashlib

import pytest

from app.services.model_registry import (
    ModelArtifactError,
    ModelManifestError,
    ModelRegistry,
)


class TestModelRegistry:
    def setup_method(self):
        ModelRegistry._manifest = None

    def teardown_method(self):
        ModelRegistry._manifest = None

    def test_load_manifest(self):
        manifest = ModelRegistry.get_manifest()
        assert manifest['schema_version'] == '2.0'
        assert 'models' in manifest

    def test_get_active_models_returns_expected(self):
        models = ModelRegistry.get_active_models()
        assert {'malware_rf_v1', 'stego_lr_v1', 'network_if_v1'} <= set(models)
        assert all(info['required'] for info in models.values())

    def test_packaged_models_pass_integrity_verification(self):
        for model_name in ModelRegistry.get_required_models():
            path = ModelRegistry.verify_model_artifact(model_name)
            assert path.is_file()

    def test_manifest_has_required_security_fields(self):
        required = {
            'filename',
            'version',
            'sha256',
            'size_bytes',
            'expected_class',
            'framework',
            'framework_version',
            'features',
            'active',
            'required',
        }
        for name, info in ModelRegistry.get_required_models().items():
            assert required <= set(info), f'{name} is missing required fields'

    def test_missing_registry_fails_closed(self, tmp_path, monkeypatch):
        monkeypatch.setattr(
            'app.services.model_registry._REGISTRY_PATH',
            tmp_path / 'missing.json',
        )
        with pytest.raises(ModelManifestError):
            ModelRegistry.get_manifest()

    def test_corrupt_registry_fails_closed(self, tmp_path, monkeypatch):
        bad_registry = tmp_path / 'model_registry.json'
        bad_registry.write_text('{invalid json', encoding='utf-8')
        monkeypatch.setattr('app.services.model_registry._REGISTRY_PATH', bad_registry)
        with pytest.raises(ModelManifestError):
            ModelRegistry.get_manifest()

    @staticmethod
    def configure_temp_model(tmp_path, monkeypatch, artifact=b'verified-model'):
        digest = hashlib.sha256(artifact).hexdigest()
        manifest = {
            'schema_version': '2.0',
            'models': {
                'demo': {
                    'filename': 'demo.joblib',
                    'version': '1.0.0',
                    'algorithm': 'DemoEstimator',
                    'sha256': digest,
                    'size_bytes': len(artifact),
                    'expected_class': 'example.Demo',
                    'framework': 'scikit-learn',
                    'framework_version': '1.8.0',
                    'features': ['feature'],
                    'active': True,
                    'required': True,
                }
            },
        }
        model_path = tmp_path / 'demo.joblib'
        model_path.write_bytes(artifact)
        monkeypatch.setattr('app.services.model_registry._MODELS_DIR', tmp_path)
        ModelRegistry._manifest = manifest
        return model_path, manifest

    def test_missing_artifact_is_rejected(self, tmp_path, monkeypatch):
        model_path, _ = self.configure_temp_model(tmp_path, monkeypatch)
        model_path.unlink()
        with pytest.raises(ModelArtifactError):
            ModelRegistry.verify_model_artifact('demo')

    def test_truncated_artifact_is_rejected(self, tmp_path, monkeypatch):
        model_path, _ = self.configure_temp_model(tmp_path, monkeypatch)
        model_path.write_bytes(b'short')
        with pytest.raises(ModelArtifactError, match='size'):
            ModelRegistry.verify_model_artifact('demo')

    def test_one_byte_tampering_is_rejected(self, tmp_path, monkeypatch):
        model_path, _ = self.configure_temp_model(tmp_path, monkeypatch)
        content = bytearray(model_path.read_bytes())
        content[0] ^= 0x01
        model_path.write_bytes(content)
        with pytest.raises(ModelArtifactError, match='digest'):
            ModelRegistry.verify_model_artifact('demo')

    def test_invalid_manifest_digest_is_rejected(self, tmp_path, monkeypatch):
        _, manifest = self.configure_temp_model(tmp_path, monkeypatch)
        manifest['models']['demo']['sha256'] = 'not-a-digest'
        with pytest.raises(ModelManifestError, match='SHA-256'):
            ModelRegistry.verify_model_artifact('demo')

    @pytest.mark.parametrize(
        ('field', 'value'),
        [
            ('version', ''),
            ('algorithm', None),
            ('framework', ''),
            ('framework_version', None),
            ('features', ['valid', '']),
        ],
    )
    def test_incomplete_model_contract_is_rejected(
        self, tmp_path, monkeypatch, field, value
    ):
        _, manifest = self.configure_temp_model(tmp_path, monkeypatch)
        manifest['models']['demo'][field] = value
        with pytest.raises(ModelManifestError):
            ModelRegistry.verify_model_artifact('demo')

    def test_filename_traversal_is_rejected(self, tmp_path, monkeypatch):
        _, manifest = self.configure_temp_model(tmp_path, monkeypatch)
        manifest['models']['demo']['filename'] = '../demo.joblib'
        with pytest.raises(ModelManifestError, match='path'):
            ModelRegistry.verify_model_artifact('demo')

    def test_symlink_is_rejected(self, tmp_path, monkeypatch):
        target, _ = self.configure_temp_model(tmp_path, monkeypatch)
        link = tmp_path / 'linked.joblib'
        try:
            link.symlink_to(target)
        except OSError:
            pytest.skip('Symlinks are not available in this environment')
        ModelRegistry._manifest['models']['demo']['filename'] = link.name
        with pytest.raises(ModelArtifactError, match='symlink'):
            ModelRegistry.verify_model_artifact('demo')

    def test_verify_required_models_reports_failure_safely(self, tmp_path, monkeypatch):
        model_path, _ = self.configure_temp_model(tmp_path, monkeypatch)
        model_path.write_bytes(b'tampered-model')
        result = ModelRegistry.verify_required_models()
        assert result == {'demo': {'verified': False, 'version': '1.0.0'}}
