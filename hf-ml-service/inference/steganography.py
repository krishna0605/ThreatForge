"""Steganography Detection Logic"""
import numpy as np
from typing import Dict, Any, List


class SteganographyDetector:
    """Detect hidden data in images using ML model."""

    def __init__(self, model):
        self.model = model

    def predict(self, features: List[float]) -> Dict[str, Any]:
        """
        Predict if an image contains hidden data.

        Args:
            features: Image statistical features (LSB variance, chi-square, etc.)

        Returns:
            Dict with prediction and confidence
        """
        if self.model is None:
            return {'prediction': 'unknown', 'confidence': 0.0, 'has_hidden_data': False}

        features_array = np.array(features).reshape(1, -1)
        prediction = self.model.predict(features_array)[0]
        probabilities = self.model.predict_proba(features_array)[0]

        return {
            'prediction': 'stego' if prediction == 1 else 'clean',
            'confidence': float(np.max(probabilities)),
            'has_hidden_data': bool(prediction == 1),
        }
