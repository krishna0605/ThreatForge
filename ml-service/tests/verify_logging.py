import sys
import os
import json
import logging
from fastapi.testclient import TestClient

# Add ml-service directory to path (parent of tests)
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

# Set OTel endpoint to localhost to avoid DNS errors during test
os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = "http://localhost:4318/v1/traces"

from app.main import app

def test_ml_json_logging():
    client = TestClient(app)
    
    print("\n--- ML SERVICE TEST OUTPUT START ---\n")
    # Health check endpoint logs access
    response = client.get("/health", headers={'X-Correlation-ID': 'ml-test-correlation-id-456'})
    
    print(f"Response Headers: {response.headers}")
    
    if 'X-Correlation-ID' in response.headers:
        print(f"X-Correlation-ID found: {response.headers['X-Correlation-ID']}")
    else:
        print("X-Correlation-ID NOT found in headers!")

    print("\n--- ML SERVICE TEST OUTPUT END ---\n")

    assert response.status_code == 200
    assert 'X-Correlation-ID' in response.headers
    assert response.headers['X-Correlation-ID'] == 'ml-test-correlation-id-456'
    print("Test passed: Request completed and headers verified.")

if __name__ == "__main__":
    test_ml_json_logging()
