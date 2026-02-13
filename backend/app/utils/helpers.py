"""Utility Helpers"""
import secrets
import hashlib
from datetime import datetime, timezone


def generate_api_key() -> tuple[str, str, str]:
    """Generate a new API key. Returns (raw_key, key_hash, key_prefix)."""
    raw_key = f'ctai_{secrets.token_urlsafe(32)}'
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    key_prefix = raw_key[:10]
    return raw_key, key_hash, key_prefix


def utc_now() -> datetime:
    """Get current UTC datetime."""
    return datetime.now(timezone.utc)


def safe_filename(filename: str) -> str:
    """Sanitize a filename for safe storage."""
    import re
    filename = re.sub(r'[^\w\s\-.]', '', filename)
    filename = filename.strip()
    return filename or 'unnamed_file'
