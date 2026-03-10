"""Model Registry - Provides model metadata, paths, and artifact download support."""
import json
import os

import requests
import structlog

logger = structlog.get_logger(__name__)

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_MODELS_DIR = os.path.join(_BASE_DIR, 'ml', 'models')
_REGISTRY_PATH = os.path.join(_MODELS_DIR, 'model_registry.json')
_DEFAULT_MODEL_ARTIFACT_BASE_URL = (
    'https://raw.githubusercontent.com/krishna0605/ThreatForge/main/hf-ml-service/app/ml/models'
)


class ModelRegistry:
    """Loads and caches model metadata from model_registry.json."""

    _manifest = None

    @classmethod
    def get_manifest(cls) -> dict:
        """Load and cache the model registry manifest."""
        if cls._manifest is None:
            try:
                with open(_REGISTRY_PATH, 'r', encoding='utf-8') as f:
                    cls._manifest = json.load(f)
                logger.info(
                    'model_registry_loaded',
                    path=_REGISTRY_PATH,
                    model_count=len(cls._manifest.get('models', {})),
                )
            except FileNotFoundError:
                logger.warning('model_registry_not_found', path=_REGISTRY_PATH)
                cls._manifest = {'schema_version': '1.0', 'models': {}}
            except json.JSONDecodeError as exc:
                logger.error('model_registry_parse_error', error=str(exc))
                cls._manifest = {'schema_version': '1.0', 'models': {}}
        return cls._manifest

    @classmethod
    def get_active_models(cls) -> dict:
        """Return dict of active model name -> metadata."""
        manifest = cls.get_manifest()
        return {
            name: info
            for name, info in manifest.get('models', {}).items()
            if info.get('active', False)
        }

    @classmethod
    def get_model_info(cls, model_name: str) -> dict:
        """Return metadata for a specific model, or empty dict if not found."""
        manifest = cls.get_manifest()
        return manifest.get('models', {}).get(model_name, {})

    @classmethod
    def get_model_path(cls, model_name: str) -> str:
        """Return the full path to a model's .joblib file."""
        info = cls.get_model_info(model_name)
        filename = info.get('filename', f'{model_name}.joblib')
        return os.path.join(_MODELS_DIR, filename)

    @classmethod
    def get_model_download_url(cls, model_name: str) -> str:
        """Return the download URL for a model artifact."""
        info = cls.get_model_info(model_name)
        if info.get('download_url'):
            return info['download_url']

        filename = info.get('filename', f'{model_name}.joblib')
        base_url = os.environ.get('MODEL_ARTIFACT_BASE_URL', _DEFAULT_MODEL_ARTIFACT_BASE_URL).rstrip('/')
        if not base_url:
            return ''
        return f'{base_url}/{filename}'

    @classmethod
    def ensure_model_available(cls, model_name: str):
        """Ensure the model artifact exists locally, downloading it if needed."""
        model_path = cls.get_model_path(model_name)
        if os.path.exists(model_path):
            return model_path

        download_url = cls.get_model_download_url(model_name)
        if not download_url:
            logger.warning('model_download_url_missing', model_name=model_name)
            return None

        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        temp_path = f'{model_path}.download'

        try:
            response = requests.get(download_url, stream=True, timeout=30)
            response.raise_for_status()

            with open(temp_path, 'wb') as file_obj:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        file_obj.write(chunk)

            os.replace(temp_path, model_path)
            logger.info('model_downloaded', model_name=model_name, path=model_path, url=download_url)
            return model_path
        except (requests.RequestException, OSError) as exc:
            logger.error('model_download_failed', model_name=model_name, url=download_url, error=str(exc))
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return None

    @classmethod
    def reload(cls):
        """Force-reload the manifest from disk (useful for testing)."""
        cls._manifest = None
        return cls.get_manifest()
