"""Count-only, read-only validation of MFA-encrypted profile fields.

This script intentionally emits counts only. It never prints user identifiers,
ciphertext, recovery codes, or encryption key material.
"""
from __future__ import annotations

import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_ROOT))

from app.supabase_client import supabase  # noqa: E402
from app.utils.crypto import CryptoError, decrypt_data  # noqa: E402


def collect_counts() -> dict[str, int]:
    counts = {
        'mfa_enabled_profiles': 0,
        'missing_secret_profiles': 0,
        'secret_decryption_failed_profiles': 0,
        'recovery_code_decryption_failed_profiles': 0,
    }

    page_size = 500
    offset = 0
    while True:
        response = (
            supabase.table('profiles')
            .select('mfa_secret,recovery_codes')
            .eq('mfa_enabled', True)
            .range(offset, offset + page_size - 1)
            .execute()
        )
        rows = response.data or []
        counts['mfa_enabled_profiles'] += len(rows)

        for row in rows:
            secret = row.get('mfa_secret')
            if not secret:
                counts['missing_secret_profiles'] += 1
            else:
                try:
                    if not decrypt_data(secret):
                        counts['secret_decryption_failed_profiles'] += 1
                except CryptoError:
                    counts['secret_decryption_failed_profiles'] += 1

            recovery_failed = False
            for encrypted_code in row.get('recovery_codes') or []:
                try:
                    if not decrypt_data(encrypted_code):
                        recovery_failed = True
                except CryptoError:
                    recovery_failed = True
            if recovery_failed:
                counts['recovery_code_decryption_failed_profiles'] += 1

        if len(rows) < page_size:
            break
        offset += page_size

    return counts


def main() -> int:
    counts = collect_counts()
    for name, count in counts.items():
        print(f'{name}={count}')
    failures = (
        counts['missing_secret_profiles']
        + counts['secret_decryption_failed_profiles']
        + counts['recovery_code_decryption_failed_profiles']
    )
    return 1 if failures else 0


if __name__ == '__main__':
    raise SystemExit(main())
