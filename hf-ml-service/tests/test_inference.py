import pytest
import os
import tempfile
from unittest.mock import MagicMock, patch
from app.services.inference import InferenceService, ModelUnavailableError
from app.services.model_registry import ModelArtifactError

class TestInferenceService:

    def setup_method(self):
        InferenceService.reset_model_cache()

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

    @patch('app.services.inference.joblib.load')
    @patch('app.services.inference.ModelRegistry.ensure_model_available')
    def test_deserializer_is_never_called_before_integrity_verification(
        self, mock_verify, mock_joblib_load
    ):
        mock_verify.side_effect = ModelArtifactError('digest mismatch')
        with pytest.raises(ModelUnavailableError):
            InferenceService.load_model('malware_rf_v1')
        mock_joblib_load.assert_not_called()

    @patch('app.services.inference.package_version', return_value='1.8.0')
    @patch('app.services.inference.ModelRegistry.get_model_info')
    @patch('app.services.inference.ModelRegistry.ensure_model_available')
    @patch('app.services.inference.joblib.load')
    def test_wrong_estimator_class_is_rejected(
        self, mock_joblib_load, mock_verify, mock_info, _mock_package_version
    ):
        mock_verify.return_value = 'verified.joblib'
        mock_info.return_value = {
            'expected_class': 'expected.Estimator',
            'framework': 'scikit-learn',
            'framework_version': '1.8.0',
            'features': ['feature'],
            'version': '1.0.0',
        }
        mock_joblib_load.return_value = MagicMock()
        with pytest.raises(ModelUnavailableError):
            InferenceService.load_model('demo')
        assert 'demo' not in InferenceService._models

    @patch('app.services.inference.package_version', return_value='1.8.0')
    @patch('app.services.inference.ModelRegistry.get_model_info')
    @patch('app.services.inference.ModelRegistry.ensure_model_available')
    @patch('app.services.inference.joblib.load')
    def test_wrong_feature_contract_is_rejected(
        self, mock_joblib_load, mock_verify, mock_info, _mock_package_version
    ):
        model = MagicMock()
        expected_class = f'{model.__class__.__module__}.{model.__class__.__name__}'
        model.n_features_in_ = 2
        mock_verify.return_value = 'verified.joblib'
        mock_info.return_value = {
            'expected_class': expected_class,
            'framework': 'scikit-learn',
            'framework_version': '1.8.0',
            'features': ['only_one_feature'],
            'version': '1.0.0',
        }
        mock_joblib_load.return_value = model
        with pytest.raises(ModelUnavailableError):
            InferenceService.load_model('demo')
        assert 'demo' not in InferenceService._models

    @patch('app.services.inference.ModelRegistry.get_required_models')
    @patch('app.services.inference.InferenceService.load_model')
    def test_readiness_fails_when_any_required_model_is_invalid(
        self, mock_load, mock_required
    ):
        mock_required.return_value = {
            'good': {'version': '1.0.0'},
            'bad': {'version': '2.0.0'},
        }
        mock_load.side_effect = [MagicMock(), ModelUnavailableError('invalid')]
        status = InferenceService.preload_required_models()
        assert status['good']['ready'] is True
        assert status['bad']['ready'] is False
