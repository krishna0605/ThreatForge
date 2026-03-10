<div align="center">

# 🛡️ ThreatForge

### AI-Powered Threat Detection Platform

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-threat--forge.vercel.app-00C853?style=for-the-badge&logo=vercel&logoColor=white)](https://threat-forge.vercel.app/)
[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-threat--forge.vercel.app-00C853?style=for-the-badge&logo=vercel&logoColor=white)](https://threat-forge.vercel.app/)

<br/>

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-2.3+-000000?style=flat-square&logo=flask&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)
![scikit-learn](https://img.shields.io/badge/scikit--learn-ML-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Container-2496ED?style=flat-square&logo=docker&logoColor=white)

<br/>

*Detect malware, steganography, and network anomalies using Machine Learning + YARA rules — structured for modern SOC teams.*

[🚀 Live Demo](https://threat-forge.vercel.app/) • [📖 Documentation](https://threatforge.notion.site/) • [🐛 Report Bug](../../issues) • [💡 Request Feature](../../issues)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔬 Malware Detection
- ML classifier on PE file features
- Static analysis & heuristics
- High-accuracy threat scoring

### 🖼️ Steganography Detection
- LSB analysis for hidden data
- Chi-square statistical tests on images
- Supports PNG, JPEG formats

### 📡 Network Anomaly Detection
- Isolation Forest on flow data
- Detects unusual traffic patterns
- Real-time packet analysis

### 📜 YARA Rule Engine
- Custom rule editor with syntax support
- Built-in rule library
- Test rules against file samples

### 📊 Interactive Dashboard
- Real-time threat metrics
- Geographic threat map
- Live system status overview

</td>
<td width="50%">

### 🔐 Auth + MFA
- Secure JWT authentication
- TOTP-based Two-Factor Auth
- Google OAuth integration

### 📄 PDF Reports
- Export detailed scan results
- Compliance-ready format
- Downloadable evidence logs

### 🌍 Threat Intel Feed
- Live Indicators of Compromise (IoC)
- Integrated open-source feeds
- Contextual threat data

### 🔔 Real-time Notifications
- Instant alerts for high-risk events
- WebSocket-based updates
- Actionable security insights

### 📈 Observability
- Prometheus metrics scraping
- Grafana visualization dashboards
- Structured logging & monitoring

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

<table>
<tr>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=nextjs" width="48" height="48" alt="Next.js" />
<br>Next.js 14
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=react" width="48" height="48" alt="React" />
<br>React 18
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=bootstrap" width="48" height="48" alt="Bootstrap" />
<br>Bootstrap 5
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=python" width="48" height="48" alt="Python" />
<br>Python 3.11
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=flask" width="48" height="48" alt="Flask" />
<br>Flask
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=redis" width="48" height="48" alt="Redis" />
<br>Redis
</td>
</tr>
<tr>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=supabase" width="48" height="48" alt="Supabase" />
<br>Supabase
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=docker" width="48" height="48" alt="Docker" />
<br>Docker
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=githubactions" width="48" height="48" alt="GitHub Actions" />
<br>CI/CD
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=sklearn" width="48" height="48" alt="scikit-learn" />
<br>scikit-learn
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=grafana" width="48" height="48" alt="Grafana" />
<br>Grafana
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=prometheus" width="48" height="48" alt="Prometheus" />
<br>Prometheus
</td>
</tr>
</table>

### Architecture Overview

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 14, React 18, Bootstrap 5, Chart.js, Leaflet |
| **Backend API** | Python 3.11, Flask, SQLAlchemy, Celery, YARA |
| **ML Service** | scikit-learn, pandas, NumPy, Pillow, joblib |
| **Database** | Supabase (PostgreSQL), Redis |
| **Deployment** | Vercel (Frontend), Render (Backend), Hugging Face (ML) |

---

## 🏗️ Project Structure

```
ThreatForge/
├── 📁 frontend/          # Next.js 14 Web Application
│   ├── src/app/          # Pages & Routing
│   ├── src/components/   # Reusable UI Components
│   └── public/           # Static Assets
│
├── 📁 backend/           # Flask REST API
│   ├── app/api/          # Route Handlers
│   ├── app/services/     # Business Logic (Scanner, ML Client)
│   ├── app/models/       # SQLAlchemy Models
│   └── tests/            # Pytest Suite
│
├── 📁 ml-service/        # ML Inference Service
│   ├── app/              # FastAPI Endpoints
│   └── training/         # Model Training Scripts
│
├── 📁 observability/     # Monitoring Configs
│   ├── prometheus/       # Prometheus Config
│   └── grafana/          # Grafana Dashboards
│
└── 🐳 docker-compose.yml # Multi-Service Orchestration
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose (optional)
- Supabase project URL & keys

### Installation

```bash
# Clone the repository
git clone https://github.com/krishna0605/ThreatForge.git
cd ThreatForge

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials
```

### Local Development

**Option 1: Docker Compose (Recommended)**

```bash
docker-compose up
```

**Option 2: Manual Setup**

```bash
# 1. Frontend
cd frontend && npm install && npm run dev

# 2. Backend (new terminal)
cd backend && pip install -r requirements.txt
python -c "from app import create_app; create_app().run(debug=True)"

# 3. ML Service (new terminal)
cd ml-service && pip install -r requirements.txt && python app.py
```

### Access Points

| Service | URL |
|---------|-----|
| 🌐 Frontend | http://localhost:3000 |
| ⚙️ Backend API | http://localhost:5000 |
| 🤖 ML Service | http://localhost:7860 |
| 📊 Grafana | http://localhost:3001 |

---

## 🔐 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
DATABASE_URL=postgresql://...

# Backend
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key
REDIS_URL=redis://localhost:6379

# ML Service
ML_SERVICE_URL=http://localhost:7860
HF_TOKEN=hf_...
```

---

## 🌐 Deployment

| Service | Platform | Status |
|---------|----------|--------|
| Frontend | Vercel | [![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel&logoColor=white)](https://threat-forge.vercel.app/) |
| Backend API | Render | [![Render](https://img.shields.io/badge/Render-Deployed-46E3B7?logo=render&logoColor=black)](https://render.com/) |
| ML Service | Hugging Face Spaces | [![HuggingFace](https://img.shields.io/badge/🤗_HuggingFace-Deployed-yellow)](https://huggingface.co/spaces) |

---

## 📖 Documentation

For comprehensive documentation including architecture diagrams, API reference, and development guides:

<div align="center">

### 📚 [View Full Documentation on Notion](https://threatforge.notion.site/)

</div>

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

### 🌟 Star this repo if you find it helpful!

[![GitHub stars](https://img.shields.io/github/stars/krishna0605/ThreatForge?style=social)](../../stargazers)

<br/>

**Built with ❤️ by [Krishna](https://creative-engineer.dev/)**

[🚀 Live Demo](https://threat-forge.vercel.app/) • [🌐 Portfolio](https://creative-engineer.dev/) • [📖 Documentation](https://threatforge.notion.site/)

</div>

