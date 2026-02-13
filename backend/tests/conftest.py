"""
Pytest Configuration — ThreatForge Backend Tests

IMPORTANT: Environment variables & supabase mock MUST be set before
any application code is imported, because app/supabase_client.py
calls create_client() at module-import time.
"""
import os
import sys

# ── 1. Set env vars BEFORE anything touches supabase_client ──────────
os.environ.setdefault('SUPABASE_URL', 'http://localhost:54321')
os.environ.setdefault('SUPABASE_SERVICE_KEY', 'test-service-key')
os.environ.setdefault('SUPABASE_KEY', 'test-anon-key')
os.environ.setdefault('JWT_SECRET_KEY', 'test-jwt-secret-key-for-testing-only')
os.environ.setdefault('FLASK_ENV', 'testing')

# ── 2. Pre-mock supabase.create_client so no real connection is made ──
from unittest.mock import MagicMock, patch
import supabase as _supabase_pkg

_mock_client = MagicMock()

# Configure the mock so that the JWT blocklist checker doesn't think
# every token is revoked.  The checker at app/__init__.py does:
#   supabase.table('user_sessions').select('is_revoked')
#          .eq('token_jti', jti).limit(1).execute()
# A plain MagicMock returns truthy objects for .data and .data[0].get(…),
# which makes every token appear revoked.  Return empty data by default.
_mock_execute_result = MagicMock()
_mock_execute_result.data = []
_mock_execute_result.count = 0
_mock_client.table.return_value.select.return_value.eq.return_value \
    .limit.return_value.execute.return_value = _mock_execute_result
_mock_client.table.return_value.select.return_value.eq.return_value \
    .execute.return_value = _mock_execute_result

_supabase_pkg.create_client = MagicMock(return_value=_mock_client)

# ── 3. Now safe to import app code ───────────────────────────────────
import pytest
from flask_jwt_extended import create_access_token, create_refresh_token
from app import create_app
from app.config import TestingConfig


@pytest.fixture(scope='session')
def app():
    """Create the Flask application for the test session."""
    application = create_app(TestingConfig)
    application.config['TESTING'] = True
    return application


@pytest.fixture(scope='session')
def client(app):
    """Create a Flask test client."""
    return app.test_client()


@pytest.fixture
def mock_supabase():
    """Provide a fresh MagicMock for supabase, patched into the app module."""
    mock = MagicMock()
    with patch('app.supabase_client.supabase', mock):
        yield mock


import uuid

# ── Test user data ────────────────────────────────────────────────────
TEST_USER = {
    'id': '12345678-1234-5678-1234-567812345678', # Valid UUID format
    'email': 'testuser@threatforge.dev',
    'display_name': 'Test User',
    'role': 'analyst',
    'avatar_url': None,
    'mfa_enabled': False,
}

# Convenience constants used by integration tests
TEST_USER_ID = TEST_USER['id']
TEST_USER_EMAIL = TEST_USER['email']


@pytest.fixture
def auth_headers(app):
    """Generate valid JWT authorization headers using Flask-JWT-Extended."""
    with app.app_context():
        token = create_access_token(
            identity=TEST_USER['id'],
            additional_claims={
                'email': TEST_USER['email'],
                'role': TEST_USER['role'],
            },
            fresh=True,
        )
    return {'Authorization': f'Bearer {token}'}


@pytest.fixture
def refresh_headers(app):
    """Generate valid refresh token authorization headers."""
    with app.app_context():
        token = create_refresh_token(identity=TEST_USER['id'])
    return {'Authorization': f'Bearer {token}'}


@pytest.fixture
def expired_headers():
    """Generate expired JWT authorization headers (manual, guaranteed expired)."""
    import jwt as pyjwt
    import datetime
    payload = {
        'sub': TEST_USER['id'],
        'type': 'access',
        'exp': datetime.datetime.now(datetime.UTC) - datetime.timedelta(hours=1),
        'iat': datetime.datetime.now(datetime.UTC) - datetime.timedelta(hours=2),
    }
    token = pyjwt.encode(payload, TestingConfig.JWT_SECRET_KEY, algorithm='HS256')
    return {'Authorization': f'Bearer {token}'}
