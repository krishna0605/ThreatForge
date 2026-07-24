"""Validate required environment variables at startup."""
import os
import sys
from urllib.parse import urlparse

from cryptography.fernet import Fernet

REQUIRED = [
    'SECRET_KEY',
    'JWT_SECRET_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'ML_SERVICE_URL',
    'ML_API_KEY',
    'ENCRYPTION_KEY',
]

OPTIONAL = [
    'SENTRY_DSN',
    'OTEL_EXPORTER_OTLP_ENDPOINT',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'RESEND_API_KEY',
]

INSECURE_DEFAULTS = {
    'SECRET_KEY': ['dev-secret-key-change-in-production', 'test-secret-key'],
    'JWT_SECRET_KEY': ['jwt-secret-key-change-in-production', 'test-jwt-secret-key'],
}


def is_valid_https_origin(value):
    parsed = urlparse(value)
    return (
        parsed.scheme == 'https'
        and bool(parsed.hostname)
        and parsed.username is None
        and parsed.password is None
        and parsed.path in {'', '/'}
        and not parsed.params
        and not parsed.query
        and not parsed.fragment
    )


def validate():
    """Check required env vars. Returns list of error messages."""
    errors = []
    env = os.environ.get('FLASK_CONFIG', 'development')

    # Check Required
    for var in REQUIRED:
        val = os.environ.get(var, '')
        if not val:
            # SUPABASE_SERVICE_KEY might be SUPABASE_KEY
            if var == 'SUPABASE_SERVICE_KEY' and os.environ.get('SUPABASE_KEY'):
                continue

            errors.append(f"  ✗ {var} is not set")

    # Check Insecure Defaults in Production
    if env == 'production':
        for var, defaults in INSECURE_DEFAULTS.items():
            val = os.environ.get(var, '')
            if val in defaults:
                errors.append(f"  ✗ {var} uses an insecure default in production")
            elif val and len(val) < 32:
                errors.append(f"  ✗ {var} must be at least 32 characters in production")

        for var in ('SUPABASE_URL', 'ML_SERVICE_URL'):
            value = os.environ.get(var, '')
            if value and not is_valid_https_origin(value):
                errors.append(f"  ✗ {var} must be an HTTPS origin in production")

        encryption_key = os.environ.get('ENCRYPTION_KEY', '')
        if encryption_key:
            try:
                Fernet(encryption_key.encode('utf-8'))
            except Exception:
                errors.append("  ✗ ENCRYPTION_KEY is not a valid Fernet key")

        cors_origins = [
            origin.strip()
            for origin in os.environ.get('CORS_ORIGINS', '').split(',')
            if origin.strip()
        ]
        if not cors_origins:
            errors.append("  ✗ CORS_ORIGINS must list explicit production origins")
        elif '*' in cors_origins:
            errors.append("  ✗ CORS_ORIGINS cannot contain a wildcard in production")
        else:
            for origin in cors_origins:
                if not is_valid_https_origin(origin):
                    errors.append(
                        "  ✗ CORS_ORIGINS contains an invalid origin; "
                        "use an HTTPS scheme and host only"
                    )
                    break

    return errors


if __name__ == '__main__':
    errs = validate()
    if errs:
        print("❌ Environment validation failed:")
        for e in errs:
            print(e)
        sys.exit(1)
    else:
        print("✅ All required environment variables are set.")
