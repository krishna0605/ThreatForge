"""Integration Tests — Notifications API Endpoints"""
import pytest
from unittest.mock import MagicMock, patch
from tests.conftest import TEST_USER_ID


class TestNotificationPreferences:
    """Tests for /api/notifications/preferences"""

    def test_get_prefs_unauthenticated(self, client):
        response = client.get('/api/notifications/preferences')
        assert response.status_code == 401

    @patch('app.api.notifications_api.supabase')
    def test_get_prefs_authenticated(self, mock_sb, client, auth_headers):
        mock_sb.table.return_value.select.return_value.eq.return_value \
            .limit.return_value.execute.return_value = MagicMock(data=[])
        response = client.get('/api/notifications/preferences', headers=auth_headers)
        assert response.status_code == 200

    @patch('app.api.notifications_api.supabase')
    def test_update_prefs(self, mock_sb, client, auth_headers):
        mock_sb.table.return_value.select.return_value.eq.return_value \
            .limit.return_value.execute.return_value = MagicMock(data=[{'user_id': TEST_USER_ID}])
        mock_sb.table.return_value.update.return_value.eq.return_value \
            .execute.return_value = MagicMock()
        response = client.put('/api/notifications/preferences', json={
            'email_threat_alerts': False,
        }, headers=auth_headers)
        assert response.status_code == 200


class TestNotificationHistory:
    """Tests for /api/notifications"""

    @patch('app.api.notifications_api.supabase')
    def test_get_notifications(self, mock_sb, client, auth_headers):
        mock_sb.table.return_value.select.return_value.eq.return_value \
            .order.return_value.range.return_value.execute.return_value = MagicMock(data=[], count=0)
        response = client.get('/api/notifications', headers=auth_headers)
        assert response.status_code == 200

    @patch('app.api.notifications_api.supabase')
    def test_unread_count(self, mock_sb, client, auth_headers):
        mock_sb.table.return_value.select.return_value.eq.return_value \
            .eq.return_value.execute.return_value = MagicMock(count=5)
        response = client.get('/api/notifications/unread-count', headers=auth_headers)
        assert response.status_code == 200

    @patch('app.api.notifications_api.supabase')
    def test_mark_all_read(self, mock_sb, client, auth_headers):
        mock_sb.table.return_value.update.return_value.eq.return_value \
            .eq.return_value.execute.return_value = MagicMock()
        response = client.put('/api/notifications/read-all', json={}, headers=auth_headers)
        assert response.status_code == 200


class TestPushSubscription:
    """Tests for /api/notifications/push/*"""

    @patch('app.api.notifications_api.supabase')
    def test_subscribe_push(self, mock_sb, client, auth_headers):
        mock_sb.table.return_value.select.return_value.eq.return_value \
            .limit.return_value.execute.return_value = MagicMock(data=[{'user_id': TEST_USER_ID}])
        mock_sb.table.return_value.update.return_value.eq.return_value \
            .execute.return_value = MagicMock()
        response = client.post('/api/notifications/push/subscribe', json={
            'subscription': {'endpoint': 'https://push.example.com', 'keys': {'p256dh': 'key', 'auth': 'auth'}},
        }, headers=auth_headers)
        assert response.status_code == 200

    def test_subscribe_push_missing_data(self, client, auth_headers):
        response = client.post('/api/notifications/push/subscribe', json={}, headers=auth_headers)
        assert response.status_code == 400
