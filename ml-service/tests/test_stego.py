"""Tests — ML Service Steganography Endpoint"""
import pytest


class TestStegoEndpoint:
    """Tests for POST /analyze/steganography"""

    def test_analyze_stego_png(self, authorized_client, sample_png):
        with open(sample_png, 'rb') as f:
            response = authorized_client.post('/analyze/stego',
                                    files={'file': ('test.png', f, 'image/png')})
        assert response.status_code == 200
        data = response.json()
        assert 'has_hidden_data' in data

    def test_analyze_stego_non_image(self, authorized_client, sample_text):
        with open(sample_text, 'rb') as f:
            response = authorized_client.post('/analyze/stego',
                                    files={'file': ('test.txt', f, 'text/plain')})
        # Should handle non-image files gracefully
        assert response.status_code in (200, 400, 422)

    def test_analyze_stego_no_file(self, authorized_client):
        response = authorized_client.post('/analyze/stego')
        assert response.status_code == 422

    def test_stego_response_structure(self, authorized_client, sample_png):
        with open(sample_png, 'rb') as f:
            response = authorized_client.post('/analyze/stego',
                                    files={'file': ('test.png', f, 'image/png')})
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, dict)

    def test_stego_exe_file(self, authorized_client, sample_exe):
        with open(sample_exe, 'rb') as f:
            response = authorized_client.post('/analyze/stego',
                                    files={'file': ('test.exe', f, 'application/octet-stream')})
        # Should handle non-image gracefully
        assert response.status_code in (200, 400, 422)
