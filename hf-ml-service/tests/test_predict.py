"""Tests — ML Service Prediction Endpoint"""
import io
import pytest


class TestPredictEndpoint:
    """Tests for POST /predict"""

    def test_predict_valid_file(self, authorized_client, sample_exe):
        with open(sample_exe, 'rb') as f:
            response = authorized_client.post('/predict', files={'file': ('test.exe', f, 'application/octet-stream')})
        assert response.status_code == 200
        data = response.json()
        assert 'score' in data
        assert 'label' in data
        assert 'features' in data

    def test_predict_text_file(self, authorized_client, sample_text):
        with open(sample_text, 'rb') as f:
            response = authorized_client.post('/predict', files={'file': ('test.txt', f, 'text/plain')})
        assert response.status_code == 200
        data = response.json()
        assert 'score' in data

    def test_predict_score_range(self, authorized_client, sample_exe):
        with open(sample_exe, 'rb') as f:
            response = authorized_client.post('/predict', files={'file': ('test.exe', f, 'application/octet-stream')})
        data = response.json()
        assert 0 <= data['score'] <= 100

    def test_predict_response_schema(self, authorized_client, sample_text):
        with open(sample_text, 'rb') as f:
            response = authorized_client.post('/predict', files={'file': ('test.txt', f, 'text/plain')})
        data = response.json()
        expected_keys = {'score', 'label', 'features'}
        assert expected_keys.issubset(set(data.keys()))

    def test_predict_empty_file(self, authorized_client, tmp_path):
        f = tmp_path / "empty.bin"
        f.write_bytes(b'')
        with open(f, 'rb') as fh:
            response = authorized_client.post('/predict', files={'file': ('empty.bin', fh, 'application/octet-stream')})
        # Should handle gracefully — 200 with low score or 400
        assert response.status_code in (200, 400, 422)

    def test_predict_no_file(self, authorized_client):
        response = authorized_client.post('/predict')
        assert response.status_code == 422  # FastAPI validation error

    def test_predict_features_dict(self, authorized_client, sample_exe):
        with open(sample_exe, 'rb') as f:
            response = authorized_client.post('/predict', files={'file': ('test.exe', f, 'application/octet-stream')})
        data = response.json()
        assert isinstance(data['features'], dict)

    def test_predict_response_has_model_version(self, authorized_client, sample_exe):
        """Verify response includes model_version from registry."""
        with open(sample_exe, 'rb') as f:
            response = authorized_client.post('/predict', files={'file': ('test.exe', f, 'application/octet-stream')})
        data = response.json()
        assert 'model_version' in data

    def test_predict_oversized_file(self, authorized_client, oversized_file):
        """Verify 413 returned for files exceeding MAX_FILE_SIZE_MB."""
        with open(oversized_file, 'rb') as f:
            response = authorized_client.post('/predict', files={'file': ('big.bin', f, 'application/octet-stream')})
        assert response.status_code == 413

    def test_predict_model_unavailable_fails_closed(self, authorized_client, sample_exe, monkeypatch):
        """A missing or invalid required model must never produce a heuristic-only result."""
        from app.services.inference import ModelUnavailableError
        monkeypatch.setattr(
            'app.services.inference.InferenceService.load_model',
            lambda _name: (_ for _ in ()).throw(ModelUnavailableError('unavailable')),
        )
        with open(sample_exe, 'rb') as f:
            response = authorized_client.post('/predict', files={'file': ('test.exe', f, 'application/octet-stream')})
        assert response.status_code == 503
        data = response.json()
        assert data['detail']['code'] == 'model_unavailable'
        assert 'score' not in data
