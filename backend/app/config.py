"""Application Configuration"""
import os
from datetime import timedelta


class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')

    # Rate Limiting
    RATELIMIT_DEFAULT = '100/minute'
    RATELIMIT_STORAGE_URI = 'memory://'

    # Supabase
    SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
    SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')

    # Hugging Face ML Service
    ML_SERVICE_URL = os.environ.get('ML_SERVICE_URL', 'http://localhost:7860')

    # File Upload
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50 MB
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', '/tmp/uploads')

    # Sentry
    SENTRY_DSN = os.environ.get('SENTRY_DSN', '')

    # Resend (email notifications)
    RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
    RESEND_FROM_EMAIL = os.environ.get('RESEND_FROM_EMAIL', 'ThreatForge <noreply@threatforge.dev>')

    # Web Push (VAPID keys)
    VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY', '')
    VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY', '')


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    # Enforce explicit CORS origins in production (no wildcard)
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '').split(',')


class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SECRET_KEY = 'test-secret-key-for-testing-only'
    JWT_SECRET_KEY = 'test-jwt-secret-key-for-testing-only'
    SUPABASE_URL = 'http://localhost:54321'
    SUPABASE_KEY = 'test-anon-key'
    RATELIMIT_ENABLED = False
    ML_SERVICE_URL = 'http://localhost:7860'
    MAX_CONTENT_LENGTH = 1 * 1024 * 1024  # 1MB for tests


config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
}
