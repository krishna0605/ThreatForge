"""Validate required environment variables at startup."""
import os
import sys

REQUIRED = [
    'SECRET_KEY',
    'JWT_SECRET_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY',
    'DB_PASSWORD', # Needed for direct DB access if used
    'ML_SERVICE_URL',
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
            
            # DB_PASSWORD is not needed if DATABASE_URL is set (e.g. Railway/Heroku/Render)
            if var == 'DB_PASSWORD' and os.environ.get('DATABASE_URL'):
                continue
                
            errors.append(f"  ✗ {var} is not set")

    # Check Insecure Defaults in Production
    if env == 'production':
        for var, defaults in INSECURE_DEFAULTS.items():
            val = os.environ.get(var, '')
            if val in defaults:
                errors.append(f"  ✗ {var} uses an insecure default in production")

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
