import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import joblib
import os

def generate_mock_network_data(n_samples=2000):
    np.random.seed(42)
    # Features: [avg_packet_size, unique_ports, unique_flows, anomaly_score_heuristic]
    
    # Normal traffic
    X_normal = np.column_stack([
        np.random.normal(500, 100, n_samples),   # Avg packet size
        np.random.normal(5, 2, n_samples),       # Few unique ports
        np.random.normal(10, 3, n_samples),      # Reasonable flows
        np.random.normal(1.0, 0.5, n_samples)    # Low heuristic score
    ])
    
    # Anomalous traffic (Scanning, DDoF, Exfil)
    n_anom = int(n_samples * 0.1)
    X_anom = np.column_stack([
        np.random.normal(50, 10, n_anom),        # Small packets (scanning) OR large (exfil)
        np.random.normal(50, 20, n_anom),        # Many ports
        np.random.normal(100, 30, n_anom),       # Many flows
        np.random.normal(6.0, 1.0, n_anom)       # High heuristic score
    ])
    
    X = np.vstack([X_normal, X_anom])
    return X # Unsupervised, no labels needed

def train_network_model():
    print("Generating synthetic network traffic dataset...")
    X_train = generate_mock_network_data()
    
    # Save mock data to CSV for demonstration
    os.makedirs('training/data', exist_ok=True)
    df = pd.DataFrame(X_train, columns=['avg_packet_size', 'unique_ports', 'unique_flows', 'anomaly_score_heuristic'])
    df.to_csv('training/data/network_dataset.csv', index=False)
    print(f"Mock dataset saved to training/data/network_dataset.csv")
    
    print("Training Isolation Forest (Unsupervised)...")
    iso_forest = IsolationForest(contamination=0.1, random_state=42)
    iso_forest.fit(X_train)
    
    # Sanity check
    test_normal = [[500, 5, 10, 1.0]]
    test_anom = [[50, 100, 200, 8.0]]
    
    print("Prediction (Normal):", iso_forest.predict(test_normal)) # Should be 1
    print("Prediction (Anomaly):", iso_forest.predict(test_anom))  # Should be -1
    
    os.makedirs('app/ml/models', exist_ok=True)
    model_path = 'app/ml/models/network_if_v1.joblib'
    joblib.dump(iso_forest, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_network_model()
