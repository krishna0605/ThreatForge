"""Deploy an exact Git revision to Render and wait for a terminal state."""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request

API_ROOT = 'https://api.render.com/v1'
SUCCESS_STATES = {'live'}
FAILURE_STATES = {
    'build_failed',
    'update_failed',
    'canceled',
    'deactivated',
    'pre_deploy_failed',
}


def request_json(method: str, path: str, token: str, payload: dict | None = None):
    body = json.dumps(payload).encode('utf-8') if payload is not None else None
    request = urllib.request.Request(
        f'{API_ROOT}{path}',
        data=body,
        method=method,
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f'Render API returned HTTP {exc.code}') from exc
    except urllib.error.URLError as exc:
        raise RuntimeError('Render API request failed') from exc


def deployed_commit_id(deploy: dict) -> str | None:
    commit = deploy.get('commit')
    if isinstance(commit, dict):
        return commit.get('id')
    return deploy.get('commitId')


def deploy(service_id: str, commit_sha: str, token: str, timeout_seconds: int) -> dict:
    previous_deploys = request_json(
        'GET',
        f'/services/{service_id}/deploys?limit=1',
        token,
    )
    if isinstance(previous_deploys, list) and previous_deploys:
        previous = previous_deploys[0]
        if isinstance(previous, dict) and isinstance(previous.get('deploy'), dict):
            previous = previous['deploy']
        print(
            f"previous_render_deploy_id={previous.get('id')} "
            f"previous_render_commit={deployed_commit_id(previous)}",
            flush=True,
        )

    started = request_json(
        'POST',
        f'/services/{service_id}/deploys',
        token,
        {'commitId': commit_sha},
    )
    deploy_id = started.get('id')
    if not deploy_id:
        raise RuntimeError('Render did not return a deployment ID')

    deadline = time.monotonic() + timeout_seconds
    last_status = None
    while time.monotonic() < deadline:
        current = request_json(
            'GET',
            f'/services/{service_id}/deploys/{deploy_id}',
            token,
        )
        status = current.get('status')
        if status != last_status:
            print(f'render_deploy_id={deploy_id} status={status}', flush=True)
            last_status = status

        if status in SUCCESS_STATES:
            actual_sha = deployed_commit_id(current)
            if not actual_sha or not commit_sha.startswith(actual_sha) and not actual_sha.startswith(commit_sha):
                raise RuntimeError('Render deployment Git revision does not match the requested revision')
            return current
        if status in FAILURE_STATES:
            raise RuntimeError(f'Render deployment ended in terminal state: {status}')
        time.sleep(10)

    raise RuntimeError('Timed out waiting for Render deployment')


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--service-id', required=True)
    parser.add_argument('--commit-sha', required=True)
    parser.add_argument('--timeout-seconds', type=int, default=1800)
    args = parser.parse_args()

    token = os.environ.get('RENDER_API_KEY')
    if not token:
        print('RENDER_API_KEY is required', file=sys.stderr)
        return 2

    try:
        result = deploy(
            args.service_id,
            args.commit_sha,
            token,
            args.timeout_seconds,
        )
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    print(f"render_deploy_id={result['id']} commit={deployed_commit_id(result)}")
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
