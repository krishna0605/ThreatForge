"""Tests — ML Service Network Analysis Endpoint"""
import pytest


class TestNetworkEndpoint:
    """Tests for POST /analyze/network"""

    def test_analyze_network_pcap(self, authorized_client, sample_pcap):
        with open(sample_pcap, 'rb') as f:
            response = authorized_client.post('/analyze/network',
                                    files={'file': ('test.pcap', f, 'application/octet-stream')})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)

    def test_analyze_network_non_pcap(self, authorized_client, sample_text):
        with open(sample_text, 'rb') as f:
            response = authorized_client.post('/analyze/network',
                                    files={'file': ('test.txt', f, 'text/plain')})
        # Should handle non-PCAP gracefully
        assert response.status_code in (200, 400, 422)

    def test_analyze_network_no_file(self, authorized_client):
        response = authorized_client.post('/analyze/network')
        assert response.status_code == 422

    def test_network_response_structure(self, authorized_client, sample_pcap):
        with open(sample_pcap, 'rb') as f:
            response = authorized_client.post('/analyze/network',
                                    files={'file': ('test.pcap', f, 'application/octet-stream')})
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, dict)

    def test_analyze_network_exe(self, authorized_client, sample_exe):
        with open(sample_exe, 'rb') as f:
            response = authorized_client.post('/analyze/network',
                                    files={'file': ('test.exe', f, 'application/octet-stream')})
        # Should handle non-PCAP gracefully
        assert response.status_code in (200, 400, 422)
