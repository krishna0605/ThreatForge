"""Integration Tests — Shared Report Endpoints"""
import pytest
from unittest.mock import MagicMock, patch
from tests.conftest import TEST_USER_ID
from datetime import datetime, timezone, timedelta


class TestCreateShareLink:
    """Tests for POST /api/scans/<id>/share"""

    def test_create_share_unauthenticated(self, client):
        response = client.post('/api/scans/scan-123/share')
        assert response.status_code == 401

    @patch('app.api.shared.supabase')
    def test_create_share_not_found(self, mock_sb, client, auth_headers):
        mock_sb.table.return_value.select.return_value.eq.return_value \
            .eq.return_value.execute.return_value = MagicMock(data=[])
        response = client.post('/api/scans/nonexistent/share', headers=auth_headers)
        assert response.status_code == 404

    @patch('app.api.shared.supabase')
    def test_create_share_success(self, mock_sb, client, auth_headers):
        # First call: scan ownership check
        scan_check = MagicMock(data=[{'id': 'scan-123'}])
        # Second call: no existing share
        no_share = MagicMock(data=[])
        # Third call: insert share
        insert_result = MagicMock()

        mock_sb.table.return_value.select.return_value.eq.return_value \
            .eq.return_value.execute.side_effect = [scan_check, no_share]
        mock_sb.table.return_value.insert.return_value.execute.return_value = insert_result

        response = client.post('/api/scans/scan-123/share', headers=auth_headers)
        assert response.status_code in (200, 201)
        data = response.get_json()
        assert 'token' in data or 'share_url' in data


class TestGetSharedReport:
    """Tests for GET /api/shared/<token> (public, no auth)"""

    @patch('app.api.shared.supabase')
    def test_get_shared_not_found(self, mock_sb, client):
        mock_sb.table.return_value.select.return_value \
            .eq.return_value.eq.return_value.single.return_value \
            .execute.side_effect = Exception("No rows returned")
        response = client.get('/api/shared/nonexistent-token')
        assert response.status_code in (404, 500)

    @patch('app.api.shared.supabase')
    def test_get_shared_expired(self, mock_sb, client):
        past = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        share_data = {
            'id': 'share-1',
            'scan_id': 'scan-123',
            'share_token': 'test-token',
            'expires_at': past,
            'is_active': True,
            'created_at': '2026-01-01T00:00:00Z',
        }
        mock_sb.table.return_value.select.return_value \
            .eq.return_value.eq.return_value.single.return_value \
            .execute.return_value = MagicMock(data=share_data)
        mock_sb.table.return_value.update.return_value.eq.return_value \
            .execute.return_value = MagicMock()
        response = client.get('/api/shared/test-token')
        assert response.status_code == 410
