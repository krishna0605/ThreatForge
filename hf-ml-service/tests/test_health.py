"""Tests — ML Service Health Endpoints."""
from unittest.mock import patch


class TestHealthEndpoint:
    """Tests for liveness and readiness contracts."""

    def test_liveness_returns_200_without_model_checks(self, client):
        with patch(
            'app.api.endpoints.InferenceService.readiness',
            side_effect=AssertionError('liveness must not inspect models'),
        ):
            response = client.get('/health/live')
        assert response.status_code == 200
        assert response.json()['status'] == 'alive'

    def test_readiness_returns_200_when_all_required_models_are_ready(self, client):
        model_status = {
            'malware_rf_v1': {'ready': True, 'version': '1.0.0'},
            'stego_lr_v1': {'ready': True, 'version': '1.0.0'},
        }
        with patch('app.api.endpoints.InferenceService.readiness', return_value=model_status):
            response = client.get('/health/ready')
        assert response.status_code == 200
        assert response.json()['status'] == 'healthy'

    def test_readiness_returns_503_when_a_required_model_is_unavailable(self, client):
        model_status = {
            'malware_rf_v1': {'ready': False, 'version': '1.0.0'},
            'stego_lr_v1': {'ready': True, 'version': '1.0.0'},
        }
        with patch('app.api.endpoints.InferenceService.readiness', return_value=model_status):
            response = client.get('/health/ready')
        assert response.status_code == 503
        assert response.json()['status'] == 'not_ready'

    def test_legacy_health_aliases_readiness(self, client):
        with patch(
            'app.api.endpoints.InferenceService.readiness',
            return_value={'malware_rf_v1': {'ready': False, 'version': '1.0.0'}},
        ):
            response = client.get('/health')
        assert response.status_code == 503


class TestRootEndpoint:
    """Tests for GET /"""

    def test_root_returns_200(self, client):
        response = client.get('/')
        assert response.status_code == 200

    def test_root_response_content(self, client):
        response = client.get('/')
        data = response.json()
        assert isinstance(data, dict)
