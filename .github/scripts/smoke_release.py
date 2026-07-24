"""Authenticated release smoke test with exact cleanup of its audit scan."""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
import uuid


def request_json(
    method: str,
    url: str,
    *,
    token: str | None = None,
    payload: dict | None = None,
    body: bytes | None = None,
    content_type: str = 'application/json',
) -> tuple[int, dict]:
    if payload is not None:
        body = json.dumps(payload).encode('utf-8')
    headers = {'Content-Type': content_type}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    bypass_token = os.environ.get('VERCEL_AUTOMATION_BYPASS_SECRET')
    if bypass_token:
        headers['x-vercel-protection-bypass'] = bypass_token
    request = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as exc:
        try:
            response_body = json.load(exc)
        except Exception:
            response_body = {}
        return exc.code, response_body


def multipart_scan_body(filename: str) -> tuple[bytes, str]:
    boundary = f'threatforge-audit-{uuid.uuid4().hex}'
    parts = [
        f'--{boundary}\r\n'
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        'Content-Type: text/plain\r\n\r\n'
        'ThreatForge security release synthetic scan fixture.\r\n',
        f'--{boundary}\r\n'
        'Content-Disposition: form-data; name="scan_type"\r\n\r\n'
        'full\r\n',
        f'--{boundary}\r\n'
        'Content-Disposition: form-data; name="enable_ml"\r\n\r\n'
        'true\r\n',
        f'--{boundary}--\r\n',
    ]
    return ''.join(parts).encode('utf-8'), f'multipart/form-data; boundary={boundary}'


def run(base_url: str, email: str, password: str, include_scan: bool) -> None:
    api_root = f"{base_url.rstrip('/')}/api/proxy"
    status, login = request_json(
        'POST',
        f'{api_root}/auth/login',
        payload={'email': email, 'password': password},
    )
    token = (login.get('data') or {}).get('access_token')
    if status != 200 or not token:
        raise RuntimeError('Authenticated smoke login failed or requires MFA')

    status, _ = request_json('GET', f'{api_root}/dashboard/stats', token=token)
    if status != 200:
        raise RuntimeError('Authenticated dashboard smoke check failed')

    if not include_scan:
        return

    audit_tag = uuid.uuid4().hex
    filename = f'audit-release-{audit_tag}.txt'
    body, content_type = multipart_scan_body(filename)
    status, scan = request_json(
        'POST',
        f'{api_root}/scans',
        token=token,
        body=body,
        content_type=content_type,
    )
    scan_id = scan.get('scan_id')
    if status != 201 or not scan_id or scan.get('status') != 'completed':
        raise RuntimeError('Synthetic scan smoke check failed')

    cleanup_status, _ = request_json(
        'DELETE',
        f'{api_root}/scans/{scan_id}',
        token=token,
    )
    if cleanup_status != 200:
        raise RuntimeError('Synthetic scan succeeded but exact audit record cleanup failed')


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--base-url', required=True)
    parser.add_argument('--include-scan', action='store_true')
    args = parser.parse_args()
    email = os.environ.get('SMOKE_TEST_EMAIL')
    password = os.environ.get('SMOKE_TEST_PASSWORD')
    if not email or not password:
        print('SMOKE_TEST_EMAIL and SMOKE_TEST_PASSWORD are required', file=sys.stderr)
        return 2
    try:
        run(args.base_url, email, password, args.include_scan)
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    print('release_smoke=passed')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
