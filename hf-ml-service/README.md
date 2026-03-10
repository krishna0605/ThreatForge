---
title: ThreatForge ML Service
emoji: 🛡️
colorFrom: blue
colorTo: gray
sdk: docker
pinned: false
---

# ThreatForge ML Service

This is the AI microservice for the ThreatForge cybersecurity platform. It provides file analysis capabilities using static analysis (PE headers, entropy) and machine learning models.

## API Endpoints

### `POST /predict`
Upload a file to get a threat score and classification.

**Request:** `multipart/form-data` with `file` field.

**Response:**
```json
{
  "filename": "suspicious.exe",
  "score": 85,
  "label": "malicious",
  "features": {
    "entropy": 7.2,
    "size": 10240,
    "suspicious_sections": true
  }
}
```

## Running Locally

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the server:
   ```bash
   python app.py
   ```
   Server will start at `http://localhost:7860`.

## Docker

Build and run with Docker:
```bash
docker build -t threatforge-ml .
docker run -p 7860:7860 threatforge-ml
```

## Deployment
This service is designed to be deployed on **Hugging Face Spaces** using the Docker SDK.
