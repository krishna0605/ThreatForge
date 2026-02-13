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
