# 🛡️ Cybersecurity Threat AI

> AI-Powered Threat Detection Platform — Detect malware, steganography, and network threats using ML + YARA rules.

## Architecture

| Service | Directory | Deploy Target | Purpose |
|---------|-----------|---------------|---------|
| **Frontend** | `frontend/` | Vercel | Next.js 14 web application |
| **Backend API** | `backend/` | Railway | Flask REST API (auth, CRUD, YARA, orchestration) |
| **ML Service** | `ml-service/` | Hugging Face Spaces | ML inference (malware, stego, network) |

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker & Docker Compose (optional)

### Local Development

**Option 1: Docker Compose (recommended)**
```bash
cp .env.example .env
# Fill in your environment variables
docker-compose up
```

**Option 2: Manual**
```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend (in new terminal)
cd backend && pip install -r requirements.txt
python -c "from app import create_app; create_app().run(debug=True)"

# ML Service (in new terminal)
cd ml-service && pip install -r requirements.txt && python app.py
```

## Features

- 🔬 **Malware Detection** — ML classifier on PE features
- 🖼️ **Steganography Detection** — LSB analysis + chi-square test
- 📡 **Network Anomaly Detection** — Isolation Forest on flow features
- 📜 **YARA Rule Engine** — Custom rule editor + built-in rules
- 📊 **Interactive Dashboard** — Charts, metrics, threat map
- 🔐 **Auth + 2FA** — JWT + TOTP authentication
- 📄 **PDF Reports** — Export scan results
- 🌍 **Threat Intel Feed** — Live IoC data

## Tech Stack

**Frontend:** Next.js 14, React 18, Bootstrap 5, Chart.js, Leaflet, Framer Motion, Supabase JS

**Backend:** Python 3.11, Flask, SQLAlchemy, YARA, Celery, Gunicorn

**ML:** scikit-learn, pandas, NumPy, Pillow, joblib

**Infrastructure:** Supabase (DB + Auth + Storage), Redis, GitHub Actions CI/CD

## License

MIT
