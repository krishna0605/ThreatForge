"""ML Client Service — HTTP client to ML inference service"""
import os
import requests
from typing import Dict, Any


class MLClient:
    """Client for communicating with the ML inference service."""

    def __init__(self, base_url: str = None):
        self.base_url = base_url or os.environ.get('ML_SERVICE_URL', 'http://localhost:7860')
        self.api_key = os.environ.get('ML_API_KEY', '')

    def _get_headers(self) -> dict:
        """Return auth headers for ML service requests."""
        headers = {}
        if self.api_key:
            headers['X-API-Key'] = self.api_key
        return headers

    def predict_file(self, file_path: str) -> Dict[str, Any]:
        """
        Send file to ML service for analysis.

        Args:
            file_path: Path to the file to analyze.

        Returns:
            Dict containing 'score', 'label', and 'features'.
        """
        try:
            with open(file_path, 'rb') as f:
                files = {'file': (os.path.basename(file_path), f)}
                response = requests.post(
                    f'{self.base_url}/predict',
                    files=files,
                    headers=self._get_headers(),
                    timeout=60
                )

            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            return {'error': str(e), 'score': 0, 'label': 'unknown', 'features': {}}
        except FileNotFoundError:
            return {'error': 'File not found', 'score': 0, 'label': 'error'}

    def health_check(self) -> bool:
        """Check if ML service is healthy."""
        try:
            response = requests.get(f'{self.base_url}/health', timeout=5)
            return response.status_code == 200
        except requests.RequestException:
            return False
