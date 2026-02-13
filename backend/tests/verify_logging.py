import logging
import sys
import os
import json
from flask import Flask, request, g

# Add backend directory to path (parent of tests)
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

from app.logging_config import setup_logging
from app.middleware.correlation import register_correlation_middleware

def test_json_logging():
    app = Flask(__name__)
    
    # 1. Setup Logging
    logger = setup_logging(app)
    
    # 2. Register Middleware
    register_correlation_middleware(app)
    
    # 3. Define a route that logs
    @app.route('/test-log')
    def test_log():
        app.logger.info("This is a structured log message", extra_data="test_value")
        # Standard logging redirect test
        logging.warning("This is a standard warning")
        return "Logged"

    # 4. Use test client
    client = app.test_client()
    
    print("\n--- TEST OUTPUT START ---\n")
    response = client.get('/test-log', headers={'X-Correlation-ID': 'test-correlation-id-123'})
    print("\n--- TEST OUTPUT END ---\n")

    assert response.status_code == 200
    print("Test passed: Request completed.")

if __name__ == "__main__":
    test_json_logging()
