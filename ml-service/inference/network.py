"""Network Anomaly Detection Logic"""
import numpy as np
from typing import Dict, Any, List


class NetworkAnomalyDetector:
    """Detect network anomalies using Isolation Forest model."""

    def __init__(self, model):
        self.model = model

    def predict(self, features: List[float]) -> Dict[str, Any]:
        """
        Predict if network traffic is anomalous.

        Args:
            features: Network flow features (packet sizes, intervals, ports)

        Returns:
            Dict with prediction and anomaly score
        """
        if self.model is None:
            return {'prediction': 'unknown', 'anomaly_score': 0.0, 'is_anomalous': False}

        features_array = np.array(features).reshape(1, -1)
        prediction = self.model.predict(features_array)[0]
        score = self.model.decision_function(features_array)[0]

        return {
            'prediction': 'anomaly' if prediction == -1 else 'normal',
            'anomaly_score': float(score),
            'is_anomalous': bool(prediction == -1),
        }
