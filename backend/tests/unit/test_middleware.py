"""Unit Tests — Middleware & Error Handlers"""
import pytest
from unittest.mock import patch, MagicMock


class TestErrorHandlers:
    """Tests for Flask error handlers."""

    def test_404_returns_json(self, client):
        response = client.get('/api/nonexistent-endpoint-xyz')
        assert response.status_code == 404
        data = response.get_json()
        assert 'error' in data

    def test_405_method_not_allowed(self, client):
        # DELETE on a POST-only endpoint (login only accepts POST)
        response = client.delete('/api/auth/login')
        assert response.status_code == 405


class TestAuthRequired:
    """Tests for auth_required decorator."""

    def test_missing_token_returns_401(self, client):
        response = client.get('/api/dashboard/stats')
        assert response.status_code == 401

    def test_invalid_token_returns_422_or_401(self, client):
        response = client.get(
            '/api/dashboard/stats',
            headers={'Authorization': 'Bearer invalid.token.here'},
        )
        assert response.status_code in (401, 422)

    @patch('app.api.dashboard.supabase')
    def test_valid_token_passes(self, mock_sb, client, auth_headers):
        """With valid JWT + mocked supabase, should get past auth."""
        generic = MagicMock()
        generic.data = []
        generic.count = 0
        eq = mock_sb.table.return_value.select.return_value.eq.return_value
        eq.execute.return_value = generic
        eq.gte.return_value.execute.return_value = generic
        eq.gte.return_value.lte.return_value.execute.return_value = generic
        eq.order.return_value.limit.return_value.execute.return_value = generic
        eq.limit.return_value.execute.return_value = generic
        eq.eq.return_value.execute.return_value = generic
        eq.eq.return_value.gte.return_value.execute.return_value = generic
        response = client.get('/api/dashboard/stats', headers=auth_headers)
        assert response.status_code != 401


class TestHealthEndpoint:
    """Tests for the health check endpoint."""

    def test_health_check_returns_200(self, client):
        # Health endpoint is at /api/health (registered on api_bp as '/health')
        response = client.get('/api/health')
        assert response.status_code == 200
        data = response.get_json()
        assert data.get('status') == 'success'
        assert data.get('data')['status'] == 'healthy'
