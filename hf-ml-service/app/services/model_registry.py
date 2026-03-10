"""Model Registry — Provides model metadata and version tracking."""
import json
import os
import structlog

logger = structlog.get_logger(__name__)

# Path to model_registry.json (relative to this file)
_REGISTRY_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'ml', 'models', 'model_registry.json'
)


class ModelRegistry:
    """Loads and caches model metadata from model_registry.json."""

    _manifest = None

    @classmethod
    def get_manifest(cls) -> dict:
        """Load and cache the model registry manifest."""
        if cls._manifest is None:
            try:
                with open(_REGISTRY_PATH, 'r') as f:
                    cls._manifest = json.load(f)
                logger.info("model_registry_loaded",
                            path=_REGISTRY_PATH,
                            model_count=len(cls._manifest.get('models', {})))
            except FileNotFoundError:
                logger.warning("model_registry_not_found", path=_REGISTRY_PATH)
                cls._manifest = {"schema_version": "1.0", "models": {}}
            except json.JSONDecodeError as e:
                logger.error("model_registry_parse_error", error=str(e))
                cls._manifest = {"schema_version": "1.0", "models": {}}
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
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        return os.path.join(base_dir, 'ml', 'models', filename)

    @classmethod
    def reload(cls):
        """Force-reload the manifest from disk (useful for testing)."""
        cls._manifest = None
        return cls.get_manifest()
