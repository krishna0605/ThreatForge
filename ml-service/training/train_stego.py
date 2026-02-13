import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib
import os

def generate_mock_stego_data(n_samples=1000):
    np.random.seed(42)
    # Features: [lsb_variance, chi_square, lsb_ones_ratio_deviation, lsb_suspicion]
    
    # Clean images
    X_clean = np.column_stack([
        np.random.normal(0.24, 0.02, n_samples),   # High LSB variance (random noise)
        np.random.normal(50, 20, n_samples),       # Low Chi-square
        np.random.normal(0.01, 0.005, n_samples),  # Natural LSB bias
        np.random.normal(0.1, 0.05, n_samples)     # Low suspicion score
    ])
    y_clean = np.zeros(n_samples)

    # Stego images
    X_stego = np.column_stack([
        np.random.normal(0.18, 0.03, n_samples),   # Lower variance (uniformity)
        np.random.normal(150, 40, n_samples),      # High Chi-square
        np.random.normal(0.001, 0.0005, n_samples),# Near perfect 0.5 ratio
        np.random.normal(0.8, 0.1, n_samples)      # High suspicion score
    ])
    y_stego = np.ones(n_samples)

    X = np.vstack([X_clean, X_stego])
    y = np.hstack([y_clean, y_stego])
    return X, y

def train_stego_model():
    print("Generating synthetic steganography dataset...")
    X, y = generate_mock_stego_data()
    
    # Save mock data to CSV for demonstration
    os.makedirs('training/data', exist_ok=True)
    df = pd.DataFrame(X, columns=['lsb_variance', 'chi_square', 'lsb_ones_ratio_deviation', 'lsb_suspicion'])
    df['label'] = y
    df.to_csv('training/data/stego_dataset.csv', index=False)
    print(f"Mock dataset saved to training/data/stego_dataset.csv")
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Logistic Regression...")
    clf = LogisticRegression(random_state=42)
    clf.fit(X_train, y_train)
    
    y_pred = clf.predict(X_test)
    print("Accuracy:", accuracy_score(y_test, y_pred))
    
    os.makedirs('app/ml/models', exist_ok=True)
    model_path = 'app/ml/models/stego_lr_v1.joblib'
    joblib.dump(clf, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_stego_model()
