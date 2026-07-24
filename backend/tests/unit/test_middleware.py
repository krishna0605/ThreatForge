"""Unit Tests — Middleware & Error Handlers"""
import pytest
from unittest.mock import patch, MagicMock


class TestErrorHandlers:
    """Tests for Flask error handlers."""

    def test_404_returns_json(self, client):
        response = client.get('/api/nonexistent-endpoint-xyz')
        assert response.status_code == 404
        data = response.get_json()
        assert data.get('status') == 'error' or 'error' in data or 'message' in data

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
    """Tests for liveness and bounded dependency readiness."""

    @patch('app.services.ml_client.MLClient.health_check')
    def test_liveness_does_not_check_ml(self, mock_ml_health, client):
        response = client.get('/api/health/live')
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'alive'
        mock_ml_health.assert_not_called()

    @patch('app.api.auth.requests.get')
    @patch('app.services.ml_client.MLClient.health_check', return_value=True)
    def test_readiness_returns_200_when_dependencies_are_ready(
        self, _mock_ml_health, mock_supabase_get, client
    ):
        mock_supabase_get.return_value.raise_for_status.return_value = None
        response = client.get('/api/health/ready')
        assert response.status_code == 200
        assert response.get_json()['status'] == 'ready'
        assert mock_supabase_get.call_args.kwargs['timeout'] == (1, 2)

    @patch('app.api.auth.requests.get')
    @patch('app.services.ml_client.MLClient.health_check', return_value=False)
    def test_ml_outage_keeps_liveness_up_and_readiness_down(
        self, _mock_ml_health, mock_supabase_get, client
    ):
        mock_supabase_get.return_value.raise_for_status.return_value = None
        assert client.get('/api/health/live').status_code == 200
        response = client.get('/api/health/ready')
        assert response.status_code == 503
        assert response.get_json()['components']['ml_service'] == 'not_ready'

    @patch('app.api.auth.requests.get', side_effect=TimeoutError)
    @patch('app.services.ml_client.MLClient.health_check', return_value=True)
    def test_unexpected_database_failure_is_a_bounded_503(
        self, _mock_ml_health, _mock_supabase_get, client
    ):
        response = client.get('/api/health/ready')
        assert response.status_code == 503
        assert response.get_json()['components']['database'] == 'not_ready'

    @patch('app.api.auth.requests.get')
    @patch('app.services.ml_client.MLClient.health_check', return_value=True)
    def test_legacy_health_aliases_readiness(
        self, _mock_ml_health, mock_supabase_get, client
    ):
        mock_supabase_get.return_value.raise_for_status.return_value = None
        response = client.get('/api/health')
        assert response.status_code == 200
        assert response.get_json()['status'] == 'ready'
