"""Integration Tests — Auth API Endpoints"""
import pytest
from unittest.mock import MagicMock, patch
from tests.conftest import TEST_USER, TEST_USER_ID, TEST_USER_EMAIL


class TestSignup:
    """Tests for POST /api/auth/signup"""

    @patch('app.api.auth.get_user_by_id')
    @patch('app.api.auth.get_user_by_email')
    @patch('app.api.auth.supabase')
    def test_signup_success(self, mock_sb, mock_get_email, mock_get_id, client):
        # get_user_by_email returns None (user doesn't exist yet)
        mock_get_email.return_value = None

        # supabase.auth.sign_up returns a user
        mock_auth = MagicMock()
        mock_auth.sign_up.return_value = MagicMock(
            user=MagicMock(id=TEST_USER_ID, email=TEST_USER_EMAIL)
        )
        mock_sb.auth = mock_auth

        # .update() and .insert() calls succeed
        mock_sb.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()
        mock_sb.table.return_value.insert.return_value.execute.return_value = MagicMock()

        # get_user_by_id returns a User-like object
        mock_user = MagicMock()
        mock_user.id = TEST_USER_ID
        mock_user.email = TEST_USER_EMAIL
        mock_user.display_name = 'New User'
        mock_user.role = 'analyst'
        mock_get_id.return_value = mock_user

        response = client.post('/api/auth/signup', json={
            'display_name': 'New User',
            'email': 'new@example.com',
            'password': 'SecurePass123!',
        })
        assert response.status_code in (200, 201)
        data = response.get_json()
        assert data['status'] == 'success'
        assert 'access_token' in data['data']

    def test_signup_missing_email(self, client):
        response = client.post('/api/auth/signup', json={
            'password': 'SecurePass123!',
        })
        assert response.status_code == 400

    def test_signup_missing_password(self, client):
        response = client.post('/api/auth/signup', json={
            'email': 'test@example.com',
        })
        assert response.status_code == 400

    def test_signup_short_password(self, client):
        response = client.post('/api/auth/signup', json={
            'email': 'test@example.com',
            'password': 'short',
        })
        assert response.status_code == 400


class TestLogin:
    """Tests for POST /api/auth/login"""

    @patch('app.api.auth.supabase')
    def test_login_success(self, mock_sb, client):
        mock_auth = MagicMock()
        mock_user = MagicMock(id=TEST_USER_ID, email=TEST_USER_EMAIL)
        mock_auth.sign_in_with_password.return_value = MagicMock(user=mock_user)
        mock_sb.auth = mock_auth
        user_data = TEST_USER.copy()
        user_data['mfa_enabled'] = False
        mock_sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = \
            MagicMock(data=[user_data])
        mock_sb.table.return_value.insert.return_value.execute.return_value = MagicMock()

        response = client.post('/api/auth/login', json={
            'email': TEST_USER_EMAIL,
            'password': 'SecurePass123!',
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'success'
        assert 'access_token' in data['data']
        assert 'user' in data['data']

    def test_login_missing_fields(self, client):
        response = client.post('/api/auth/login', json={})
        assert response.status_code == 400

    @patch('app.api.auth.supabase')
    def test_login_wrong_password(self, mock_sb, client):
        mock_sb.auth.sign_in_with_password.side_effect = Exception("Invalid login credentials")
        response = client.post('/api/auth/login', json={
            'email': 'test@example.com',
            'password': 'wrongpass123',
        })
        assert response.status_code in (401, 500)


class TestGetMe:
    """Tests for GET /api/auth/me"""

    def test_get_me_unauthenticated(self, client):
        response = client.get('/api/auth/me')
        assert response.status_code == 401

    @patch('app.api.auth.supabase')
    def test_get_me_authenticated(self, mock_sb, client, auth_headers):
        mock_sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = \
            MagicMock(data=[TEST_USER])
        response = client.get('/api/auth/me', headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'success'
        assert data['data']['id'] == TEST_USER_ID


class TestLogout:
    """Tests for POST /api/auth/logout"""

    @patch('app.api.auth.supabase')
    def test_logout_success(self, mock_sb, client, auth_headers):
        mock_sb.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()
        response = client.post('/api/auth/logout', headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'success'


class TestRefresh:
    """Tests for POST /api/auth/refresh"""

    def test_refresh_with_valid_token(self, client, refresh_headers):
        response = client.post('/api/auth/refresh', headers=refresh_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'success'
        assert 'access_token' in data['data']

    def test_refresh_without_token(self, client):
        response = client.post('/api/auth/refresh')
        assert response.status_code == 401


class TestLoginMFA:
    """Tests for POST /api/auth/login with MFA enabled."""

    @patch('app.api.auth.supabase')
    def test_login_mfa_required_returns_temp_token(self, mock_sb, client):
        """When user has MFA enabled, login should return mfa_required + temp_token."""
        mock_auth = MagicMock()
        mock_user = MagicMock(id=TEST_USER_ID, email=TEST_USER_EMAIL)
        mock_auth.sign_in_with_password.return_value = MagicMock(user=mock_user)
        mock_sb.auth = mock_auth
        
        mfa_user = TEST_USER.copy()
        mfa_user['mfa_enabled'] = True
        mfa_user['mfa_secret'] = 'encrypted_secret'
        mock_sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = \
            MagicMock(data=[mfa_user])

        response = client.post('/api/auth/login', json={
            'email': TEST_USER_EMAIL,
            'password': 'SecurePass123!',
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'success'
        assert data['data']['mfa_required'] is True
        assert 'temp_token' in data['data']
        # Should NOT have full tokens
        assert 'access_token' not in data['data']

    @patch('app.api.auth.supabase')
    def test_login_no_mfa_returns_tokens(self, mock_sb, client):
        """When user has MFA disabled, login should return full tokens directly."""
        mock_auth = MagicMock()
        mock_user = MagicMock(id=TEST_USER_ID, email=TEST_USER_EMAIL)
        mock_auth.sign_in_with_password.return_value = MagicMock(user=mock_user)
        mock_sb.auth = mock_auth
        
        user_data = TEST_USER.copy()
        user_data['mfa_enabled'] = False
        mock_sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = \
            MagicMock(data=[user_data])
        mock_sb.table.return_value.insert.return_value.execute.return_value = MagicMock()

        response = client.post('/api/auth/login', json={
            'email': TEST_USER_EMAIL,
            'password': 'SecurePass123!',
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'success'
        assert 'access_token' in data['data']
        assert 'user' in data['data']
        assert 'mfa_required' not in data['data']


class TestMFAVerifyLogin:
    """Tests for POST /api/auth/mfa/verify-login."""

    @patch('app.api.auth.decrypt_data')
    @patch('app.api.auth.supabase')
    def test_verify_login_valid_totp(self, mock_sb, mock_decrypt, client, app):
        """Valid TOTP code should issue full tokens."""
        import pyotp
        secret = pyotp.random_base32()
        totp = pyotp.TOTP(secret)
        valid_code = totp.now()

        mock_decrypt.return_value = secret
        
        mfa_user = TEST_USER.copy()
        mfa_user['mfa_enabled'] = True
        mfa_user['mfa_secret'] = 'encrypted_secret'
        mock_sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = \
            MagicMock(data=[mfa_user])
        mock_sb.table.return_value.insert.return_value.execute.return_value = MagicMock()

        # Create a mfa_pending temp token
        from flask_jwt_extended import create_access_token
        with app.app_context():
            temp_token = create_access_token(identity=f"mfa_pending:{TEST_USER_ID}")

        response = client.post('/api/auth/mfa/verify-login',
            headers={'Authorization': f'Bearer {temp_token}'},
            json={'totp_code': valid_code}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'success'
        assert 'access_token' in data['data']
        assert 'user' in data['data']

    @patch('app.api.auth.decrypt_data')
    @patch('app.api.auth.supabase')
    def test_verify_login_invalid_totp(self, mock_sb, mock_decrypt, client, app):
        """Invalid TOTP code should return 401."""
        import pyotp
        secret = pyotp.random_base32()
        mock_decrypt.return_value = secret
        
        mfa_user = TEST_USER.copy()
        mfa_user['mfa_enabled'] = True
        mfa_user['mfa_secret'] = 'encrypted_secret'
        mfa_user['recovery_codes'] = None
        mock_sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = \
            MagicMock(data=[mfa_user])

        from flask_jwt_extended import create_access_token
        with app.app_context():
            temp_token = create_access_token(identity=f"mfa_pending:{TEST_USER_ID}")

        response = client.post('/api/auth/mfa/verify-login',
            headers={'Authorization': f'Bearer {temp_token}'},
            json={'totp_code': '000000'}
        )
        assert response.status_code == 401

    def test_verify_login_rejects_regular_token(self, client, auth_headers):
        """Regular (non mfa_pending) token should be rejected with 403."""
        response = client.post('/api/auth/mfa/verify-login',
            headers=auth_headers,
            json={'totp_code': '123456'}
        )
        assert response.status_code == 403
        data = response.get_json()
        assert data['status'] == 'error'


class TestGoogleAuthMFA:
    """Tests for POST /api/auth/google with MFA cross-check."""

    @patch('app.api.auth.supabase')
    def test_google_auth_mfa_required(self, mock_sb, client):
        """Google login with MFA-enabled profile should return mfa_required + temp_token."""
        mock_auth = MagicMock()
        mock_auth_user = MagicMock()
        mock_auth_user.id = TEST_USER_ID
        mock_auth_user.email = TEST_USER_EMAIL
        mock_auth_user.user_metadata = {'full_name': 'Test User'}
        mock_auth.get_user.return_value = MagicMock(user=mock_auth_user)
        mock_sb.auth = mock_auth

        mfa_user = TEST_USER.copy()
        mfa_user['mfa_enabled'] = True
        mfa_user['mfa_secret'] = 'encrypted_secret'
        mock_sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = \
            MagicMock(data=[mfa_user])

        response = client.post('/api/auth/google', json={
            'access_token': 'valid-supabase-token-12345',
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'success'
        assert data['data']['mfa_required'] is True
        assert 'temp_token' in data['data']

    @patch('app.api.auth.supabase')
    def test_google_auth_no_mfa(self, mock_sb, client):
        """Google login without MFA should return full tokens."""
        mock_auth = MagicMock()
        mock_auth_user = MagicMock()
        mock_auth_user.id = TEST_USER_ID
        mock_auth_user.email = TEST_USER_EMAIL
        mock_auth_user.user_metadata = {'full_name': 'Test User'}
        mock_auth.get_user.return_value = MagicMock(user=mock_auth_user)
        mock_sb.auth = mock_auth

        user_data = TEST_USER.copy()
        user_data['mfa_enabled'] = False
        mock_sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = \
            MagicMock(data=[user_data])
        mock_sb.table.return_value.insert.return_value.execute.return_value = MagicMock()

        response = client.post('/api/auth/google', json={
            'access_token': 'valid-supabase-token-12345',
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'success'
        assert 'access_token' in data['data']
        assert 'user' in data['data']

    @patch('app.api.auth.supabase')
    def test_google_auth_new_user_no_mfa(self, mock_sb, client):
        """First-time Google login creates profile with MFA disabled."""
        mock_auth = MagicMock()
        mock_auth_user = MagicMock()
        mock_auth_user.id = TEST_USER_ID
        mock_auth_user.email = TEST_USER_EMAIL
        mock_auth_user.user_metadata = {'full_name': 'New Google User', 'avatar_url': 'https://example.com/photo.jpg'}
        mock_auth.get_user.return_value = MagicMock(user=mock_auth_user)
        mock_sb.auth = mock_auth

        # First call: profile not found (empty data)
        # Second call (after insert): profile found
        mock_sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = \
            MagicMock(data=[])
        mock_sb.table.return_value.insert.return_value.execute.return_value = MagicMock()

        response = client.post('/api/auth/google', json={
            'access_token': 'valid-supabase-token-12345',
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'success'
        assert 'access_token' in data['data']

