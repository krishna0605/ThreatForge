"""Integration Tests — Security API Endpoints"""
import pytest
from unittest.mock import MagicMock, patch
from tests.conftest import TEST_USER_ID, TEST_USER


class TestChangePassword:
    """Tests for PUT /api/auth/change-password"""

    def test_change_password_unauthenticated(self, client):
        response = client.put('/api/auth/change-password', json={})
        assert response.status_code == 401

    @patch('app.api.security.supabase')
    def test_change_password_missing_fields(self, mock_sb, client, auth_headers):
        response = client.put('/api/auth/change-password', json={
            'current_password': 'old',
        }, headers=auth_headers)
        assert response.status_code == 400

    @patch('app.api.security.supabase')
    def test_change_password_mismatch(self, mock_sb, client, auth_headers):
        response = client.put('/api/auth/change-password', json={
            'current_password': 'OldPass123!',
            'new_password': 'NewPass123!',
            'confirm_password': 'DifferentPass456!',
        }, headers=auth_headers)
        assert response.status_code == 400


class TestSessions:
    """Tests for /api/security/sessions"""

    def test_get_sessions_unauthenticated(self, client):
        response = client.get('/api/security/sessions')
        assert response.status_code == 401

    @patch('app.api.security.supabase')
    def test_get_sessions_authenticated(self, mock_sb, client, auth_headers):
        mock_sb.table.return_value.select.return_value.eq.return_value.order.return_value \
            .execute.return_value = MagicMock(data=[])
        response = client.get('/api/security/sessions', headers=auth_headers)
        assert response.status_code == 200

    @patch('app.api.security.supabase')
    def test_revoke_session(self, mock_sb, client, auth_headers):
        mock_sb.table.return_value.select.return_value.eq.return_value.eq.return_value \
            .execute.return_value = MagicMock(data=[{'id': 'session-1', 'user_id': TEST_USER_ID}])
        mock_sb.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()
        response = client.delete('/api/security/sessions/session-1', headers=auth_headers)
        assert response.status_code == 200


class TestPreferences:
    """Tests for /api/security/preferences"""

    @patch('app.api.security.supabase')
    def test_get_preferences(self, mock_sb, client, auth_headers):
        mock_sb.table.return_value.select.return_value.eq.return_value.limit.return_value \
            .execute.return_value = MagicMock(data=[])
        response = client.get('/api/security/preferences', headers=auth_headers)
        assert response.status_code == 200

    @patch('app.api.security.supabase')
    def test_update_preferences(self, mock_sb, client, auth_headers):
        mock_sb.table.return_value.select.return_value.eq.return_value.limit.return_value \
            .execute.return_value = MagicMock(data=[{'user_id': TEST_USER_ID}])
        mock_sb.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()
        response = client.put('/api/security/preferences', json={
            'session_timeout_enabled': True,
            'session_timeout_minutes': 30,
        }, headers=auth_headers)
        assert response.status_code == 200


class TestIpWhitelist:
    """Tests for /api/security/ip-whitelist"""

    @patch('app.api.security.supabase')
    def test_get_ip_whitelist(self, mock_sb, client, auth_headers):
        mock_sb.table.return_value.select.return_value.eq.return_value.order.return_value \
            .execute.return_value = MagicMock(data=[])
        response = client.get('/api/security/ip-whitelist', headers=auth_headers)
        assert response.status_code == 200

    @patch('app.api.security.supabase')
    def test_add_ip_whitelist(self, mock_sb, client, auth_headers):
        insert_result = MagicMock()
        insert_result.data = [{'id': 'ip-1', 'user_id': TEST_USER_ID,
                               'cidr_range': '192.168.1.0/24', 'label': 'Office Network'}]
        mock_sb.table.return_value.insert.return_value.execute.return_value = insert_result
        response = client.post('/api/security/ip-whitelist', json={
            'cidr_range': '192.168.1.0/24',
            'label': 'Office Network',
        }, headers=auth_headers)
        assert response.status_code in (200, 201)


class TestAuditLogs:
    """Tests for GET /api/security/audit-logs"""

    @patch('app.api.security.supabase')
    def test_get_audit_logs(self, mock_sb, client, auth_headers):
        mock_sb.table.return_value.select.return_value.eq.return_value.order.return_value \
            .range.return_value.execute.return_value = MagicMock(data=[], count=0)
        response = client.get('/api/security/audit-logs', headers=auth_headers)
        assert response.status_code == 200
