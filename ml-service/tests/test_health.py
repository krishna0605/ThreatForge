"""Tests — ML Service Health Endpoint"""
import pytest


class TestHealthEndpoint:
    """Tests for GET /health"""

    def test_health_returns_200(self, client):
        response = client.get('/health')
        assert response.status_code == 200

    def test_health_has_status(self, client):
        response = client.get('/health')
        data = response.json()
        assert data.get('status') == 'healthy'

    def test_health_has_version(self, client):
        response = client.get('/health')
        data = response.json()
        assert 'version' in data or 'uptime_seconds' in data


class TestRootEndpoint:
    """Tests for GET /"""

    def test_root_returns_200(self, client):
        response = client.get('/')
        assert response.status_code == 200

    def test_root_response_content(self, client):
        response = client.get('/')
        data = response.json()
        assert isinstance(data, dict)
