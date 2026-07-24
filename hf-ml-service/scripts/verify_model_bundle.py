"""Verify the packaged model bundle and emit a sanitized release manifest."""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

SERVICE_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SERVICE_ROOT))

from app.services.inference import InferenceService  # noqa: E402
from app.services.model_registry import ModelRegistry, ModelRegistryError  # noqa: E402


def build_release_manifest() -> dict:
    manifest = ModelRegistry.get_manifest()
    readiness = InferenceService.preload_required_models()
    if not readiness or not all(item.get('ready') for item in readiness.values()):
        raise RuntimeError('One or more required models failed verification or loading')

    models = {}
    for name, info in ModelRegistry.get_required_models().items():
        models[name] = {
            'version': info['version'],
            'sha256': info['sha256'],
            'size_bytes': info['size_bytes'],
            'expected_class': info['expected_class'],
            'framework': info['framework'],
            'framework_version': info['framework_version'],
            'features': info['features'],
        }

    return {
        'schema_version': '1.0',
        'model_registry_schema': manifest['schema_version'],
        'repository_commit': os.environ.get('GITHUB_SHA', 'local'),
        'models': models,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()

    try:
        release_manifest = build_release_manifest()
    except (ModelRegistryError, RuntimeError) as exc:
        print(f'model bundle verification failed: {type(exc).__name__}', file=sys.stderr)
        return 1

    serialized = json.dumps(release_manifest, indent=2, sort_keys=True) + '\n'
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(serialized, encoding='utf-8')
    print(
        f"verified {len(release_manifest['models'])} required models "
        f"for registry schema {release_manifest['model_registry_schema']}"
    )
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
