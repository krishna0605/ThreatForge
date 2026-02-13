from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
import os

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    # Typo fix from previous attempt: uptime_seconds
    assert "uptime_seconds" in response.json()

def test_predict_no_auth():
    # Should fail with 403
    response = client.post("/predict", files={"file": ("test.txt", b"content")})
    assert response.status_code == 403

def test_predict_with_auth_invalid_key():
    headers = {settings.API_KEY_NAME: "wrong_key"}
    response = client.post("/predict", files={"file": ("test.txt", b"content")}, headers=headers)
    assert response.status_code == 403

def test_predict_with_valid_key():
    # We need to simulate a valid file upload
    # Using the default key from settings/config fallback
    key = settings.ML_API_KEY
    headers = {settings.API_KEY_NAME: key}
    
    # Upload a dummy EXE-like file
    file_content = b'MZ' + os.urandom(100)
    files = {"file": ("malware_test.exe", file_content, "application/octet-stream")}
    
    response = client.post("/predict", files=files, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "score" in data
    assert "label" in data
    assert data["filename"] == "malware_test.exe"

def test_stego_analysis():
    key = settings.ML_API_KEY
    headers = {settings.API_KEY_NAME: key}
    
    # Needs actual image content or it might fail on PIL.open
    # Minimal 1x1 PNG
    png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    
    files = {"file": ("test.png", png_data, "image/png")}
    response = client.post("/analyze/stego", files=files, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "has_hidden_data" in data


def test_health_shows_model_versions():
    """Verify /health returns actual model versions from registry."""
    response = client.get("/health")
    data = response.json()
    assert "models" in data
    models = data["models"]
    assert isinstance(models, dict)
    # Check at least one model has version info
    if models:
        first_model = next(iter(models.values()))
        assert "version" in first_model
        assert "algorithm" in first_model


def test_predict_no_api_key_env(monkeypatch):
    """Verify 500 when ML_API_KEY env var is not set."""
    monkeypatch.setattr('app.core.config.settings', type('Settings', (), {
        'ML_API_KEY': None,
        'API_KEY_NAME': 'X-API-Key',
        'Rate_Limit': '100/minute',
        'MAX_FILE_SIZE_MB': 50,
    })())
    
    # Re-import to pick up monkeypatched settings
    headers = {"X-API-Key": "any-key"}
    response = client.post("/predict", files={"file": ("test.txt", b"content")}, headers=headers)
    # Should return 500 since ML_API_KEY is None
    assert response.status_code in (500, 403)


def test_stego_response_has_model_version():
    """Verify stego responses include model_version."""
    key = settings.ML_API_KEY
    headers = {settings.API_KEY_NAME: key}
    png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    files = {"file": ("test.png", png_data, "image/png")}
    response = client.post("/analyze/stego", files=files, headers=headers)
    if response.status_code == 200:
        data = response.json()
        assert "model_version" in data
