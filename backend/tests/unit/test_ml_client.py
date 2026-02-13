"""Unit Tests — ML Client Service"""
import os
import pytest
import requests as req_lib
import responses


@pytest.fixture
def ml_client():
    from app.services.ml_client import MLClient
    return MLClient(base_url='http://ml-test:7860')


class TestPredictFile:
    """Tests for MLClient.predict_file()"""

    @responses.activate
    def test_predict_file_success(self, ml_client, tmp_path):
        f = tmp_path / "test.bin"
        f.write_bytes(b'\x00' * 100)

        responses.add(
            responses.POST, 'http://ml-test:7860/predict',
            json={'score': 85, 'label': 'malicious', 'features': {'entropy': 7.9}},
            status=200,
        )

        result = ml_client.predict_file(str(f))
        assert result['score'] == 85
        assert result['label'] == 'malicious'
        assert 'features' in result

    @responses.activate
    def test_predict_file_timeout(self, ml_client, tmp_path):
        f = tmp_path / "test.bin"
        f.write_bytes(b'\x00' * 100)

        # Use requests.exceptions.ConnectionError (not builtin ConnectionError)
        responses.add(
            responses.POST, 'http://ml-test:7860/predict',
            body=req_lib.exceptions.ConnectionError("Connection timed out"),
        )

        result = ml_client.predict_file(str(f))
        assert result['score'] == 0
        assert 'error' in result

    @responses.activate
    def test_predict_file_500(self, ml_client, tmp_path):
        f = tmp_path / "test.bin"
        f.write_bytes(b'\x00' * 100)

        responses.add(
            responses.POST, 'http://ml-test:7860/predict',
            json={'error': 'Internal server error'},
            status=500,
        )

        result = ml_client.predict_file(str(f))
        assert result['score'] == 0
        assert 'error' in result

    def test_predict_file_not_found(self, ml_client):
        result = ml_client.predict_file('/nonexistent/path/file.bin')
        assert result['label'] == 'error'
        assert 'error' in result

    @responses.activate
    def test_predict_file_malformed_json(self, ml_client, tmp_path):
        f = tmp_path / "test.bin"
        f.write_bytes(b'\x00' * 100)

        responses.add(
            responses.POST, 'http://ml-test:7860/predict',
            body='not json',
            status=200,
            content_type='text/plain',
        )

        result = ml_client.predict_file(str(f))
        assert result['score'] == 0
        assert 'error' in result

    @responses.activate
    def test_predict_returns_features_dict(self, ml_client, tmp_path):
        f = tmp_path / "test.bin"
        f.write_bytes(b'MZ' + b'\x00' * 100)

        responses.add(
            responses.POST, 'http://ml-test:7860/predict',
            json={'score': 10, 'label': 'benign', 'features': {'size': 102}},
            status=200,
        )

        result = ml_client.predict_file(str(f))
        assert isinstance(result['features'], dict)

    @responses.activate
    def test_predict_low_score_benign(self, ml_client, tmp_path):
        f = tmp_path / "test.txt"
        f.write_text("hello world")

        responses.add(
            responses.POST, 'http://ml-test:7860/predict',
            json={'score': 5, 'label': 'benign', 'features': {}},
            status=200,
        )

        result = ml_client.predict_file(str(f))
        assert result['score'] == 5
        assert result['label'] == 'benign'


class TestHealthCheck:
    """Tests for MLClient.health_check()"""

    @responses.activate
    def test_health_check_healthy(self, ml_client):
        responses.add(
            responses.GET, 'http://ml-test:7860/health',
            json={'status': 'healthy'},
            status=200,
        )
        assert ml_client.health_check() is True

    @responses.activate
    def test_health_check_unhealthy(self, ml_client):
        responses.add(
            responses.GET, 'http://ml-test:7860/health',
            json={'status': 'unhealthy'},
            status=503,
        )
        assert ml_client.health_check() is False

    @responses.activate
    def test_health_check_unreachable(self, ml_client):
        responses.add(
            responses.GET, 'http://ml-test:7860/health',
            body=req_lib.exceptions.ConnectionError("Connection refused"),
        )
        assert ml_client.health_check() is False


class TestURLConfig:
    """Tests for MLClient URL configuration."""

    def test_default_base_url(self):
        from app.services.ml_client import MLClient
        c = MLClient()
        assert 'localhost' in c.base_url or '7860' in c.base_url

    def test_custom_base_url(self):
        from app.services.ml_client import MLClient
        c = MLClient(base_url='http://custom:9999')
        assert c.base_url == 'http://custom:9999'
