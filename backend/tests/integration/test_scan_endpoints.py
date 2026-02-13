"""Integration Tests — Scan API Endpoints"""
import io
import pytest
from unittest.mock import MagicMock, patch
from tests.conftest import TEST_USER_ID


class TestListScans:
    """Tests for GET /api/scans"""

    def test_list_scans_unauthenticated(self, client):
        response = client.get('/api/scans')
        assert response.status_code == 401

    @patch('app.api.scans.supabase')
    def test_list_scans_authenticated(self, mock_sb, client, auth_headers):
        mock_sb.table.return_value.select.return_value.eq.return_value.order.return_value \
            .range.return_value.execute.return_value = MagicMock(data=[], count=0)
        response = client.get('/api/scans', headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert 'scans' in data

    @patch('app.api.scans.supabase')
    def test_list_scans_pagination(self, mock_sb, client, auth_headers):
        mock_sb.table.return_value.select.return_value.eq.return_value.order.return_value \
            .range.return_value.execute.return_value = MagicMock(data=[], count=0)
        response = client.get('/api/scans?page=2&per_page=5', headers=auth_headers)
        assert response.status_code == 200


class TestCreateScan:
    """Tests for POST /api/scans"""

    def test_create_scan_unauthenticated(self, client):
        response = client.post('/api/scans')
        assert response.status_code == 401

    def test_create_scan_no_file(self, client, auth_headers):
        response = client.post('/api/scans', headers=auth_headers)
        assert response.status_code == 400

    def test_create_scan_invalid_extension(self, client, auth_headers):
        data = {'file': (io.BytesIO(b'test'), 'test.xyz123')}
        headers = {'Authorization': auth_headers['Authorization']}
        response = client.post('/api/scans', data=data,
                               content_type='multipart/form-data', headers=headers)
        assert response.status_code == 400


class TestGetScan:
    """Tests for GET /api/scans/<id>"""

    def test_get_scan_unauthenticated(self, client):
        response = client.get('/api/scans/fake-id')
        assert response.status_code == 401

    @patch('app.api.scans.supabase')
    def test_get_scan_not_found(self, mock_sb, client, auth_headers):
        # get_scan uses .single().execute() which raises an exception if no rows
        mock_sb.table.return_value.select.return_value.eq.return_value \
            .eq.return_value.single.return_value.execute.side_effect = \
            Exception("No rows returned")
        response = client.get('/api/scans/nonexistent-id', headers=auth_headers)
        assert response.status_code in (404, 500)


class TestDeleteScan:
    """Tests for DELETE /api/scans/<id>"""

    def test_delete_scan_unauthenticated(self, client):
        response = client.delete('/api/scans/fake-id')
        assert response.status_code == 401

    @patch('app.api.scans.supabase')
    def test_delete_scan_not_found(self, mock_sb, client, auth_headers):
        # delete_scan uses .single().execute() which raises when no rows
        mock_sb.table.return_value.select.return_value.eq.return_value \
            .eq.return_value.single.return_value.execute.side_effect = \
            Exception("No rows returned")
        response = client.delete('/api/scans/nonexistent-id', headers=auth_headers)
        assert response.status_code in (404, 500)
