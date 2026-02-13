# ThreatForge — Project Scaffolding & Dependency Installation

Set up the complete folder structure for the Cybersecurity Threat AI project with **3 separate root-level directories**, each independently deployable.

## Proposed Changes

### 1. Frontend — `frontend/` (→ Vercel)

#### [NEW] Next.js 14 project via `create-next-app`

- Initialize with `npx -y create-next-app@latest ./` inside `frontend/`
- TypeScript, App Router, ESLint enabled
- Install all additional dependencies:

```
react-bootstrap bootstrap chart.js react-chartjs-2 framer-motion
react-dropzone @uiw/react-codemirror leaflet react-leaflet
@supabase/supabase-js zod jspdf html2canvas sonner
@codemirror/lang-javascript
```

- Create page/component directory structure:
  - `src/app/(public)/` — Landing, features, docs
  - `src/app/(auth)/` — Login, signup, forgot-password
  - `src/app/(dashboard)/` — Dashboard, scans, rules, threats, reports, settings
  - `src/app/api/proxy/` — API proxy route
  - `src/components/{ui,dashboard,scans,rules,threats,layout,auth}/`
  - `src/lib/` — api.ts, auth.ts, constants.ts
  - `src/utils/supabase/` — client.ts, server.ts

---

### 2. Backend — `backend/` (→ Railway)

#### [NEW] Flask API project

- Create `requirements.txt` with all Python dependencies
- Create directory structure:
  - `app/` — Flask app factory, config, extensions
  - `app/models/` — SQLAlchemy models
  - `app/api/` — Blueprint endpoints
  - `app/services/` — Business logic
  - `app/middleware/` — Auth, error handlers
  - `app/utils/` — Validators, helpers
  - `migrations/` — Alembic
  - `yara_rules/{malware,suspicious,packer}/` — Built-in rules
  - `tests/` — pytest tests
- Create deploy configs: `Procfile`, `railway.toml`, `Dockerfile`

---

### 3. ML Service — `ml-service/` (→ Hugging Face Spaces)

#### [NEW] Flask/Gradio ML inference server

- Create `requirements.txt` with ML dependencies
- Create directory structure:
  - `models/` — Trained model files (.pkl via Git LFS)
  - `inference/` — Prediction logic per model
  - `features/` — Feature extraction modules
  - `training/` — Training scripts
  - `tests/` — Model tests

---

### 4. Root-Level Files

#### [NEW] Configuration files

| File | Purpose |
|------|---------|
| `.env.example` | Environment variable template |
| `.gitattributes` | Git LFS tracking for `.pkl` files |
| `docker-compose.yml` | Local dev orchestration |
| `README.md` | Project documentation |
| `.github/workflows/ci.yml` | CI pipeline |
| `.github/workflows/deploy.yml` | CD pipeline |

## Verification Plan

### Automated Tests
1. **Frontend build check**: `cd frontend && npm run build` — must exit 0
2. **Directory verification**: Confirm all 3 root directories have their own `package.json` or `requirements.txt`

### Manual Verification
1. Confirm `frontend/`, `backend/`, and `ml-service/` each exist as separate root directories suitable for independent deployment
2. Confirm `frontend/` contains a valid Next.js project that can dev-server with `npm run dev`
3. Confirm `backend/requirements.txt` lists all Flask dependencies
4. Confirm `ml-service/requirements.txt` lists all ML dependencies
