"""Production startup configuration validation tests."""
from cryptography.fernet import Fernet

import validate_env


def set_valid_production_environment(monkeypatch):
    values = {
        'FLASK_CONFIG': 'production',
        'SECRET_KEY': 'production-secret-with-sufficient-entropy',
        'JWT_SECRET_KEY': 'production-jwt-secret-with-sufficient-entropy',
        'SUPABASE_URL': 'https://staging-project.supabase.co',
        'SUPABASE_SERVICE_KEY': 'service-role-value',
        'ML_SERVICE_URL': 'https://threatforge-ml-staging.hf.space',
        'ML_API_KEY': 'staging-ml-api-key',
        'ENCRYPTION_KEY': Fernet.generate_key().decode('utf-8'),
        'CORS_ORIGINS': 'https://staging.threatforge.dev',
    }
    for key, value in values.items():
        monkeypatch.setenv(key, value)


def test_valid_production_environment_passes(monkeypatch):
    set_valid_production_environment(monkeypatch)
    assert validate_env.validate() == []


def test_every_required_setting_fails_when_missing(monkeypatch):
    set_valid_production_environment(monkeypatch)
    for required_name in validate_env.REQUIRED:
        with monkeypatch.context() as context:
            context.delenv(required_name)
            if required_name == 'SUPABASE_SERVICE_KEY':
                context.delenv('SUPABASE_KEY', raising=False)
            errors = validate_env.validate()
            assert any(required_name in error for error in errors)


def test_invalid_fernet_key_fails_production_startup(monkeypatch):
    set_valid_production_environment(monkeypatch)
    monkeypatch.setenv('ENCRYPTION_KEY', 'not-a-fernet-key')
    assert any('valid Fernet key' in error for error in validate_env.validate())


def test_wildcard_or_invalid_cors_origin_fails_production_startup(monkeypatch):
    set_valid_production_environment(monkeypatch)
    monkeypatch.setenv('CORS_ORIGINS', '*')
    assert any('wildcard' in error for error in validate_env.validate())

    monkeypatch.setenv('CORS_ORIGINS', 'https://threatforge.dev/path')
    assert any('invalid origin' in error for error in validate_env.validate())


def test_insecure_default_secrets_fail_production_startup(monkeypatch):
    set_valid_production_environment(monkeypatch)
    monkeypatch.setenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    monkeypatch.setenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    errors = validate_env.validate()
    assert any('SECRET_KEY uses an insecure default' in error for error in errors)
    assert any('JWT_SECRET_KEY uses an insecure default' in error for error in errors)


def test_short_secrets_and_non_https_service_urls_fail(monkeypatch):
    set_valid_production_environment(monkeypatch)
    monkeypatch.setenv('SECRET_KEY', 'too-short')
    monkeypatch.setenv('SUPABASE_URL', 'http://project.supabase.co')
    monkeypatch.setenv('ML_SERVICE_URL', 'https://user:pass@ml.example.com')
    errors = validate_env.validate()
    assert any('at least 32 characters' in error for error in errors)
    assert any('SUPABASE_URL must be an HTTPS origin' in error for error in errors)
    assert any('ML_SERVICE_URL must be an HTTPS origin' in error for error in errors)
