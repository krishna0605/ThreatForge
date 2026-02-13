import pytest
import os
import tempfile
from unittest.mock import MagicMock, patch
from app.services.inference import InferenceService

class TestInferenceService:
    
    def test_calculate_entropy(self):
        # High entropy (random)
        random_data = os.urandom(1000)
        entropy = InferenceService.calculate_entropy(random_data)
        assert entropy > 6.0
        
        # Low entropy (uniform)
        uniform_data = b'A' * 1000
        entropy = InferenceService.calculate_entropy(uniform_data)
        assert entropy < 1.0

    @patch('app.services.inference.InferenceService.load_model')
    def test_analyze_malware_mock_model(self, mock_load):
        # Mock the model to return a predictable result
        mock_clf = MagicMock()
        mock_clf.predict.return_value = [1] # Malicious
        mock_clf.predict_proba.return_value = [[0.1, 0.9]] # 90% confidence
        mock_load.return_value = mock_clf

        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp.write(b'MZ' + b'\x00'*100) # Fake PE header start
            tmp_path = tmp.name
            
        try:
            result = InferenceService.analyze_malware(tmp_path, "test.exe")
            assert result['ml_verdict'] == 'malicious'
            assert result['ml_confidence'] == 90.0
            assert result['score'] > 50 # integration of ML score
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    def test_analyze_malware_no_file(self):
        # Should raise error
        with pytest.raises(Exception):
            InferenceService.analyze_malware("non_existent_file.exe", "test.exe")
