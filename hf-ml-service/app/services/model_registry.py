"""Local, integrity-verified model artifact registry."""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
from pathlib import Path
from typing import Any

import structlog

logger = structlog.get_logger(__name__)

_BASE_DIR = Path(__file__).resolve().parent.parent
_MODELS_DIR = _BASE_DIR / 'ml' / 'models'
_REGISTRY_PATH = _MODELS_DIR / 'model_registry.json'
_SHA256_RE = re.compile(r'^[0-9a-f]{64}$')


class ModelRegistryError(Exception):
    """Base exception for model registry failures."""


class ModelManifestError(ModelRegistryError):
    """Raised when the model manifest is missing or malformed."""


class ModelArtifactError(ModelRegistryError):
    """Raised when a packaged model fails an integrity check."""


class ModelRegistry:
    """Loads model metadata and verifies packaged artifacts before use."""

    _manifest: dict[str, Any] | None = None

    @classmethod
    def get_manifest(cls) -> dict[str, Any]:
        if cls._manifest is None:
            try:
                with _REGISTRY_PATH.open('r', encoding='utf-8') as file_obj:
                    manifest = json.load(file_obj)
            except FileNotFoundError as exc:
                logger.error('model_registry_not_found')
                raise ModelManifestError('Model registry is missing') from exc
            except json.JSONDecodeError as exc:
                logger.error('model_registry_parse_error', error_type=type(exc).__name__)
                raise ModelManifestError('Model registry is invalid') from exc

            if manifest.get('schema_version') != '2.0':
                raise ModelManifestError('Unsupported model registry schema')
            if not isinstance(manifest.get('models'), dict):
                raise ModelManifestError('Model registry models must be an object')

            cls._manifest = manifest
            logger.info(
                'model_registry_loaded',
                model_count=len(manifest['models']),
                schema_version=manifest['schema_version'],
            )
        return cls._manifest

    @classmethod
    def get_active_models(cls) -> dict[str, dict[str, Any]]:
        manifest = cls.get_manifest()
        return {
            name: info
            for name, info in manifest['models'].items()
            if info.get('active', False)
        }

    @classmethod
    def get_required_models(cls) -> dict[str, dict[str, Any]]:
        return {
            name: info
            for name, info in cls.get_active_models().items()
            if info.get('required', False)
        }

    @classmethod
    def get_model_info(cls, model_name: str) -> dict[str, Any]:
        return cls.get_manifest()['models'].get(model_name, {})

    @classmethod
    def get_model_path(cls, model_name: str) -> Path:
        info = cls.get_model_info(model_name)
        if not info:
            raise ModelManifestError('Unknown model')

        filename = info.get('filename')
        if not isinstance(filename, str) or not filename:
            raise ModelManifestError('Model filename is missing')
        if filename != os.path.basename(filename):
            raise ModelManifestError('Model filename must not contain a path')

        candidate = _MODELS_DIR / filename
        resolved_parent = candidate.parent.resolve()
        if resolved_parent != _MODELS_DIR.resolve():
            raise ModelArtifactError('Model path escapes the packaged model directory')
        return candidate

    @classmethod
    def verify_model_artifact(cls, model_name: str) -> Path:
        info = cls.get_model_info(model_name)
        if not info:
            raise ModelManifestError('Unknown model')

        expected_hash = info.get('sha256')
        expected_size = info.get('size_bytes')
        expected_class = info.get('expected_class')
        features = info.get('features')
        required_text_fields = (
            'version',
            'algorithm',
            'framework',
            'framework_version',
        )
        if not isinstance(expected_hash, str) or not _SHA256_RE.fullmatch(expected_hash):
            raise ModelManifestError('Model SHA-256 is missing or invalid')
        if not isinstance(expected_size, int) or expected_size <= 0:
            raise ModelManifestError('Model size is missing or invalid')
        if not isinstance(expected_class, str) or not expected_class:
            raise ModelManifestError('Expected model class is missing')
        if any(
            not isinstance(info.get(field), str) or not info[field]
            for field in required_text_fields
        ):
            raise ModelManifestError('Required model metadata is missing')
        if (
            not isinstance(features, list)
            or not features
            or any(not isinstance(feature, str) or not feature for feature in features)
        ):
            raise ModelManifestError('Model feature contract is missing')

        model_path = cls.get_model_path(model_name)
        if model_path.is_symlink():
            raise ModelArtifactError('Model artifact must not be a symlink')
        if not model_path.is_file():
            raise ModelArtifactError('Model artifact is missing')
        if model_path.stat().st_size != expected_size:
            raise ModelArtifactError('Model artifact size does not match the manifest')

        digest = hashlib.sha256()
        with model_path.open('rb') as file_obj:
            for chunk in iter(lambda: file_obj.read(1024 * 1024), b''):
                digest.update(chunk)

        if not hmac.compare_digest(digest.hexdigest(), expected_hash):
            raise ModelArtifactError('Model artifact digest does not match the manifest')

        logger.info(
            'model_artifact_verified',
            model_name=model_name,
            model_version=info.get('version'),
        )
        return model_path

    @classmethod
    def ensure_model_available(cls, model_name: str) -> Path:
        """Compatibility wrapper: packaged models must be present and verified."""
        return cls.verify_model_artifact(model_name)

    @classmethod
    def verify_required_models(cls) -> dict[str, dict[str, Any]]:
        results: dict[str, dict[str, Any]] = {}
        try:
            required_models = cls.get_required_models()
        except ModelRegistryError:
            return {'registry': {'verified': False, 'version': None}}

        for name, info in required_models.items():
            try:
                cls.verify_model_artifact(name)
                results[name] = {
                    'verified': True,
                    'version': info.get('version'),
                }
            except ModelRegistryError as exc:
                logger.error(
                    'model_artifact_verification_failed',
                    model_name=name,
                    error_type=type(exc).__name__,
                )
                results[name] = {
                    'verified': False,
                    'version': info.get('version'),
                }
        return results

    @classmethod
    def reload(cls):
        cls._manifest = None
        return cls.get_manifest()
