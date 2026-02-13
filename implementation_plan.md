# 🛡️ Cybersecurity Threat AI — Implementation Plan

> Production-level, all-free-tier deployment. Built from scratch to detect malware, steganography, and network threats using ML + YARA rules.

---

## 1. Deployment Architecture (All Free)

| Service | Role | Free Tier |
|---------|------|-----------|
| **Vercel** | Next.js Frontend | 100 GB bandwidth, serverless functions |
| **Railway** | Flask API Backend (auth, CRUD, YARA, orchestration) | $5/month free credit |
| **Hugging Face Spaces** | ML Inference Backend (model serving) | Free CPU Spaces |
| **Supabase** | PostgreSQL DB + Auth + Storage | 500 MB DB, 1 GB storage |
| **GitHub Actions** | CI/CD Pipeline | 2,000 min/month free |
| **Git LFS** | Large ML model file storage | 1 GB free |

```mermaid
graph TB
    subgraph "User"
        Browser["🌐 Browser"]
    end

    subgraph "Vercel (Free)"
        Frontend["Next.js 14 Frontend<br/>Bootstrap 5 + React"]
        SSR["Server Components<br/>+ API Routes (proxy)"]
    end

    subgraph "Railway (Free $5 credit)"
        FlaskAPI["Flask API Backend<br/>Auth, CRUD, YARA,<br/>Orchestration, Reports"]
    end

    subgraph "Hugging Face Spaces (Free)"
        MLServer["Gradio/Flask ML Server<br/>Malware Classifier<br/>Stego Detector<br/>Network Analyzer"]
    end

    subgraph "Supabase (Free)"
        Auth["Supabase Auth"]
        DB["PostgreSQL"]
        Storage["Object Storage<br/>(uploaded files)"]
        Realtime["Realtime<br/>Subscriptions"]
    end

    Browser --> Frontend
    Frontend --> SSR
    SSR -->|"REST API"| FlaskAPI
    SSR -->|"Realtime"| Realtime
    FlaskAPI -->|"ML Inference"| MLServer
    FlaskAPI --> Auth
    FlaskAPI --> DB
    FlaskAPI --> Storage
    MLServer -.->|"Model files<br/>via Git LFS"| MLServer
```

> [!IMPORTANT]
> **Why split the backend?** Railway handles fast API responses (auth, CRUD, YARA). Hugging Face handles heavy ML inference with GPU-ready infrastructure and free hosting for ML models — no Git LFS bandwidth limits.

---

## 2. Complete Tech Stack

### Frontend (Vercel)

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.x | React framework, App Router, SSR |
| React | 18.x | UI library |
| Bootstrap | 5.3 | Responsive CSS framework (matches CV) |
| react-bootstrap | 2.x | Bootstrap React components |
| Chart.js + react-chartjs-2 | 4.x | Threat visualization charts |
| Framer Motion | 12.x | Animations |
| react-dropzone | 14.x | File upload drag-and-drop |
| react-code-mirror | 6.x | YARA rule syntax editor |
| Leaflet + react-leaflet | 1.9 | Interactive threat map |
| Supabase JS | 2.x | Auth + Realtime client |
| Zod | 3.x | Form validation |
| jsPDF + html2canvas | — | PDF report export |
| Sonner | 2.x | Toast notifications |

### API Backend (Railway)

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Runtime |
| Flask | 3.x | Web framework |
| Flask-RESTful | 0.3.x | Structured REST endpoints |
| Flask-CORS | 4.x | Cross-origin requests |
| Flask-JWT-Extended | 4.x | JWT authentication |
| Flask-Limiter | 3.x | Rate limiting |
| Flask-SocketIO | 5.x | Real-time scan progress |
| SQLAlchemy | 2.x | ORM |
| Alembic | 1.x | DB migrations |
| python-yara | 4.x | YARA rule engine |
| python-magic | 0.4.x | File type detection |
| pefile | 2023.x | PE header parsing |
| Celery + Redis | 5.x | Background task queue |
| Gunicorn | 22.x | Production WSGI server |
| Marshmallow | 3.x | Schema validation |
| supabase-py | 2.x | Supabase client |
| Sentry SDK | 2.x | Error monitoring |
| flasgger | 0.9.x | Swagger API docs |

### ML Backend (Hugging Face Spaces)

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Runtime |
| Flask / Gradio | — | Serving interface |
| scikit-learn | 1.4+ | ML models |
| pandas | 2.x | Data manipulation |
| numpy | 1.x | Numerical computation |
| Pillow | 10.x | Image analysis (stego) |
| joblib | 1.x | Model serialization |
| scipy | 1.x | Statistical analysis |

---

## 3. Complete Page / UI Map

```mermaid
graph TD
    subgraph "Public Pages"
        Landing["/ — Landing Page"]
        Login["/login — Login"]
        Signup["/signup — Sign Up"]
        ForgotPw["/forgot-password"]
        Features["/features — Feature Showcase"]
        Docs["/docs — API Documentation"]
    end

    subgraph "Dashboard (Authenticated)"
        Dash["/dashboard — Overview"]
        Scans["/scans — Scan History"]
        NewScan["/scans/new — New Scan"]
        ScanDetail["/scans/:id — Scan Results"]
        Rules["/rules — YARA Rule Manager"]
        RuleEditor["/rules/:id/edit — Rule Editor"]
        ThreatMap["/threats/map — Threat Map"]
        ThreatFeed["/threats/feed — Threat Intel Feed"]
        Reports["/reports — Reports"]
        ReportView["/reports/:id — Report Detail"]
        Settings["/settings — User Settings"]
        APIKeys["/settings/api-keys — API Key Mgmt"]
    end

    Landing --> Login
    Landing --> Signup
    Landing --> Features
    Login --> Dash
    Signup --> Dash
    Dash --> Scans
    Dash --> Rules
    Dash --> ThreatMap
    Scans --> NewScan
    Scans --> ScanDetail
    Rules --> RuleEditor
    Dash --> Reports
    Reports --> ReportView
    Dash --> Settings
    Settings --> APIKeys
    Dash --> ThreatFeed
```

### 3.1 UI Page Descriptions

#### Landing Page (`/`)
```
┌─────────────────────────────────────────────────────────┐
│  🛡️ Cybersecurity Threat AI                    [Login]  │
│─────────────────────────────────────────────────────────│
│                                                         │
│   ██████████████████████████████████████████████████    │
│   █                                                █    │
│   █   AI-Powered Threat Detection Platform         █    │
│   █   Detect malware, steganography & network      █    │
│   █   threats using machine learning & YARA rules  █    │
│   █                                                █    │
│   █       [Get Started Free]   [View Demo]         █    │
│   █                                                █    │
│   ██████████████████████████████████████████████████    │
│                                                         │
│  ┌─────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │ 🔬      │  │ 🖼️          │  │ 📡               │   │
│  │ Malware │  │ Steganography│  │ Network Anomaly  │   │
│  │ Detection│  │ Detection   │  │ Detection        │   │
│  │ ML-based│  │ Image hidden │  │ Traffic pattern  │   │
│  │ scanning│  │ data finder  │  │ analysis         │   │
│  └─────────┘  └─────────────┘  └──────────────────┘   │
│                                                         │
│  ┌─────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │ 📜 YARA │  │ 📊 Dashboard │  │ 🌍 Threat Map   │   │
│  │ Custom  │  │ Real-time   │  │ Global threat    │   │
│  │ rules   │  │ analytics   │  │ visualization    │   │
│  └─────────┘  └─────────────┘  └──────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Trusted by security researchers worldwide      │   │
│  │  ★★★★★  "Best open-source threat scanner"       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Footer: About | GitHub | Docs | Privacy | Terms        │
└─────────────────────────────────────────────────────────┘
```

#### Dashboard (`/dashboard`)
```
┌──────────────────────────────────────────────────────────────┐
│  🛡️ CyberThreatAI    [Dashboard] [Scans] [Rules] [⚙️] [👤] │
│──────────────────────────────────────────────────────────────│
│                                                              │
│  Welcome back, User                                 Feb 2026 │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐     │
│  │ 🔍 42    │ │ 🚨 12    │ │ ✅ 30    │ │ ⚠️ 5 Critical │  │
│  │ Total    │ │ Threats  │ │ Clean    │ │ Alerts       │    │
│  │ Scans    │ │ Found    │ │ Files    │ │ This Week    │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘    │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────────┐     │
│  │ Threat Distribution  │  │ Scan Activity (7 days)   │     │
│  │ [PIE CHART]          │  │ [LINE CHART]             │     │
│  │ ■ Malware 45%        │  │                          │     │
│  │ ■ Suspicious 30%     │  │  ╱‾‾╲    ╱╲              │     │
│  │ ■ Clean 20%          │  │ ╱    ╲__╱  ╲__           │     │
│  │ ■ Stego 5%           │  │                          │     │
│  └──────────────────────┘  └──────────────────────────┘     │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────────┐     │
│  │ Severity Breakdown   │  │ Recent Scans             │     │
│  │ [BAR CHART]          │  │ ─────────────────────    │     │
│  │ Critical ████████ 8  │  │ 📄 report.exe  🔴 Mal   │     │
│  │ High     ██████ 6    │  │ 🖼️ photo.png   🟡 Steg  │     │
│  │ Medium   ████ 4      │  │ 📄 doc.pdf     🟢 Clean │     │
│  │ Low      ██ 2        │  │ 📦 archive.zip 🔴 Mal   │     │
│  └──────────────────────┘  └──────────────────────────┘     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  🌍 Threat Map                          [Full View] │    │
│  │  [WORLD MAP WITH THREAT PINS]                       │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

#### New Scan Page (`/scans/new`)
```
┌──────────────────────────────────────────────────────────────┐
│  🔍 New Threat Scan                                          │
│──────────────────────────────────────────────────────────────│
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                                                        │  │
│  │        ╔═══════════════════════════════════╗           │  │
│  │        ║   📁 Drop files here or          ║           │  │
│  │        ║      click to browse             ║           │  │
│  │        ║                                  ║           │  │
│  │        ║   Supports: EXE, DLL, PDF, IMG,  ║           │  │
│  │        ║   ZIP, PCAP, scripts, docs       ║           │  │
│  │        ║   Max: 50 MB per file            ║           │  │
│  │        ╚═══════════════════════════════════╝           │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Scan Options:                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ☑ Malware Detection (ML)                              │  │
│  │ ☑ Steganography Analysis                              │  │
│  │ ☑ YARA Rule Matching                                  │  │
│  │ ☐ Network Traffic Analysis (PCAP only)                │  │
│  │ ☑ File Entropy Analysis                               │  │
│  │ ☑ PE Header Inspection                                │  │
│  │                                                        │  │
│  │ YARA Ruleset: [All Rules          ▼]                  │  │
│  │ Scan Priority: ○ Normal  ● High                       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Queued Files:                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 📄 malware_sample.exe    2.3 MB    [Remove]           │  │
│  │ 🖼️ suspicious_image.png  1.1 MB    [Remove]           │  │
│  │ 📦 payload.zip           5.8 MB    [Remove]           │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│                              [Cancel]  [🔍 Start Scan]       │
└──────────────────────────────────────────────────────────────┘
```

#### Scan Results Page (`/scans/:id`)
```
┌──────────────────────────────────────────────────────────────┐
│  📋 Scan Results — malware_sample.exe                        │
│──────────────────────────────────────────────────────────────│
│  Status: ✅ Complete  |  Duration: 12s  |  Threat: 🔴 HIGH   │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ THREAT SCORE                                            ││
│  │ ████████████████████████████░░░  87/100  MALICIOUS      ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  [Overview] [ML Results] [YARA Matches] [Entropy] [Headers]  │
│                                                              │
│  ┌──────────── File Metadata ────────────────────────────┐  │
│  │ Name:     malware_sample.exe                          │  │
│  │ Size:     2.3 MB                                      │  │
│  │ SHA-256:  a1b2c3d4e5f6...                            │  │
│  │ Type:     PE32 executable (GUI) x86                   │  │
│  │ Entropy:  7.82 (HIGH - likely packed/encrypted)       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────── ML Predictions ───────────────────────────┐  │
│  │ 🔬 Malware Classifier:    Trojan (94.2% confidence)   │  │
│  │ 🖼️ Steganography:         Not detected                │  │
│  │ 📊 Anomaly Score:         0.92 (anomalous)            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────── YARA Matches (3) ─────────────────────────┐  │
│  │ 🔴 rule suspicious_packer  — UPX packing detected     │  │
│  │ 🔴 rule trojan_downloader  — URL patterns found       │  │
│  │ 🟡 rule obfuscated_strings — Encoded strings found    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────── Remediation ──────────────────────────────┐  │
│  │ ⚠️ This file is highly suspicious. Recommendations:    │  │
│  │ 1. Do NOT execute this file                           │  │
│  │ 2. Quarantine immediately                             │  │
│  │ 3. Submit hash to VirusTotal for confirmation         │  │
│  │ 4. Check system for related indicators of compromise  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│              [📄 Export PDF]  [🔗 Share Report]               │
└──────────────────────────────────────────────────────────────┘
```

#### YARA Rule Editor (`/rules/:id/edit`)
```
┌──────────────────────────────────────────────────────────────┐
│  📜 YARA Rule Editor — trojan_downloader                     │
│──────────────────────────────────────────────────────────────│
│                                                              │
│  ┌──────── Code Editor (CodeMirror) ─────────────────────┐  │
│  │  1 │ rule trojan_downloader {                         │  │
│  │  2 │   meta:                                          │  │
│  │  3 │     author = "CyberThreatAI"                     │  │
│  │  4 │     description = "Detects trojan downloaders"   │  │
│  │  5 │     severity = "critical"                        │  │
│  │  6 │   strings:                                       │  │
│  │  7 │     $url1 = /https?:\/\/[^\s]+\.exe/ nocase      │  │
│  │  8 │     $url2 = "URLDownloadToFile" ascii             │  │
│  │  9 │     $cmd = "cmd.exe /c" nocase                    │  │
│  │ 10 │   condition:                                      │  │
│  │ 11 │     any of them                                   │  │
│  │ 12 │ }                                                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──── Rule Properties ──┐  ┌──── Test Results ──────────┐ │
│  │ Name: trojan_download │  │ ✅ Syntax valid             │ │
│  │ Category: [Malware ▼] │  │ 🧪 Test against sample:    │ │
│  │ Severity: [Critical▼] │  │    📄 test.exe → MATCH     │ │
│  │ Tags: trojan, network │  │    📄 clean.exe → NO MATCH │ │
│  │ Enabled: ☑            │  │    📄 doc.pdf → NO MATCH   │ │
│  └───────────────────────┘  └────────────────────────────┘ │
│                                                              │
│         [Delete Rule]    [Test Rule]    [💾 Save Rule]        │
└──────────────────────────────────────────────────────────────┘
```

#### Threat Map (`/threats/map`)
```
┌──────────────────────────────────────────────────────────────┐
│  🌍 Global Threat Map                                        │
│──────────────────────────────────────────────────────────────│
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    WORLD MAP (Leaflet)                │   │
│  │                                                      │   │
│  │     🔴          🟡                                   │   │
│  │        🔴    🔴       🟡     🔴                      │   │
│  │                 🟡        🔴     🟡                   │   │
│  │           🔴        🟡       🔴                      │   │
│  │                                                      │   │
│  │  🔴 = Critical   🟡 = Medium   🟢 = Low             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Filter: [All Types ▼] [Last 7 Days ▼] [All Severities ▼]   │
│                                                              │
│  Recent Threats:                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 🔴 Trojan — Russia   │ 🟡 Adware — USA             │   │
│  │ 🔴 Ransomware — CN   │ 🟢 PUP — Germany            │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Core Features (12)

### 4.1 Feature Architecture Diagram

```mermaid
graph TB
    subgraph "🔬 Detection Features"
        F1["Malware Detection<br/>(ML Classifier)"]
        F2["Steganography Detection<br/>(Image Analysis + ML)"]
        F3["Network Anomaly Detection<br/>(Traffic Analysis)"]
        F4["YARA Rule Engine<br/>(Pattern Matching)"]
        F5["File Entropy Analysis<br/>(Packing Detection)"]
        F6["PE Header Inspection<br/>(Executable Analysis)"]
    end

    subgraph "📊 Management Features"
        F7["Interactive Dashboard<br/>(Charts + Metrics)"]
        F8["YARA Rule CRUD + Editor<br/>(In-browser editing)"]
        F9["Scan History + Filtering<br/>(Search, sort, paginate)"]
        F10["PDF Report Generation<br/>(Export + Share)"]
    end

    subgraph "🔐 Platform Features"
        F11["User Auth (JWT + 2FA)<br/>(Login, Signup, MFA)"]
        F12["API Key Management<br/>(Programmatic access)"]
    end
```

### Feature Details

| # | Feature | Description | Backend Location |
|---|---------|-------------|------------------|
| 1 | **Malware Detection** | ML classifier using Random Forest / Gradient Boosting trained on PE features | HF Spaces |
| 2 | **Steganography Detection** | LSB analysis, chi-square test, ML on image statistics | HF Spaces |
| 3 | **Network Anomaly Detection** | Isolation Forest on PCAP/flow features (packet size, frequency, ports) | HF Spaces |
| 4 | **YARA Rule Engine** | Compile & match user-defined + built-in YARA rules against uploaded files | Railway |
| 5 | **File Entropy Analysis** | Shannon entropy calculation to detect packing/encryption | Railway |
| 6 | **PE Header Inspection** | Parse PE headers, imports, sections, detect anomalies | Railway |
| 7 | **Dashboard** | Summary cards, pie/bar/line charts, recent activity, threat map widget | Vercel |
| 8 | **YARA Rule Editor** | CodeMirror-based syntax editor, rule testing, CRUD operations | Vercel + Railway |
| 9 | **Scan History** | Paginated list with filters by status, severity, date, file type | Vercel + Railway |
| 10 | **PDF Reports** | Export detailed scan results as downloadable PDF reports | Vercel |
| 11 | **Auth + 2FA** | JWT-based login/signup with optional TOTP two-factor authentication | Railway + Supabase |
| 12 | **API Keys** | Generate/revoke API keys for programmatic scanning access | Railway |

---

## 5. Suggested Bonus Features (8)

| # | Feature | Impact | Effort |
|---|---------|--------|--------|
| 13 | **Threat Intelligence Feed** | Pull live IoC data from free APIs (AbuseIPDB, OTX) | Medium |
| 14 | **Interactive Threat Map** | Leaflet-based world map with geo-located threats | Medium |
| 15 | **Batch File Processing** | Upload ZIP → auto-extract → scan all files | Low |
| 16 | **Scan Scheduling** | Cron-based recurring scans on monitored directories | Medium |
| 17 | **Email Alerts** | Send email on critical threat detection (free SMTP via Gmail/Resend) | Low |
| 18 | **Scan Comparison** | Diff two scan reports side-by-side | Low |
| 19 | **Dark Mode** | Full dark/light theme toggle | Low |
| 20 | **IoC Database** | Searchable database of known-bad hashes, IPs, domains | Medium |

---

## 6. Database Schema

```mermaid
erDiagram
    USERS ||--o{ SCANS : creates
    USERS ||--o{ API_KEYS : owns
    USERS ||--o{ YARA_RULES : authors
    USERS ||--o{ ACTIVITY_LOGS : generates
    SCANS ||--o{ FINDINGS : produces
    SCANS ||--o{ SCAN_FILES : contains
    YARA_RULES ||--o{ RULE_MATCHES : triggers

    USERS {
        uuid id PK
        string email
        string password_hash
        string display_name
        string avatar_url
        boolean mfa_enabled
        string mfa_secret
        string role
        timestamp created_at
    }

    SCANS {
        uuid id PK
        uuid user_id FK
        string status
        string scan_type
        integer total_files
        integer threats_found
        float duration_seconds
        jsonb options
        timestamp created_at
        timestamp completed_at
    }

    SCAN_FILES {
        uuid id PK
        uuid scan_id FK
        string filename
        string file_hash_sha256
        string mime_type
        integer file_size
        float entropy
        string storage_path
        timestamp uploaded_at
    }

    FINDINGS {
        uuid id PK
        uuid scan_id FK
        uuid scan_file_id FK
        string finding_type
        string severity
        string title
        text description
        float confidence
        jsonb details
        text remediation
        timestamp detected_at
    }

    YARA_RULES {
        uuid id PK
        uuid user_id FK
        string name
        string category
        string severity
        text rule_content
        boolean is_enabled
        boolean is_builtin
        timestamp created_at
        timestamp updated_at
    }

    RULE_MATCHES {
        uuid id PK
        uuid finding_id FK
        uuid rule_id FK
        string rule_name
        jsonb matched_strings
    }

    API_KEYS {
        uuid id PK
        uuid user_id FK
        string key_hash
        string key_prefix
        string label
        timestamp last_used_at
        timestamp expires_at
        timestamp created_at
    }

    ACTIVITY_LOGS {
        uuid id PK
        uuid user_id FK
        string action
        string resource_type
        uuid resource_id
        jsonb metadata
        string ip_address
        timestamp created_at
    }
```

---

## 7. API Endpoint Catalog

### Auth Endpoints (Railway)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/logout` | Invalidate session |
| POST | `/api/auth/refresh` | Refresh JWT token |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/mfa/enroll` | Enable 2FA |
| POST | `/api/auth/mfa/verify` | Verify TOTP code |

### Scan Endpoints (Railway)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scans` | Create new scan (multipart file upload) |
| GET | `/api/scans` | List user's scans (paginated, filterable) |
| GET | `/api/scans/:id` | Get scan details + findings |
| DELETE | `/api/scans/:id` | Delete a scan |
| GET | `/api/scans/:id/report` | Get formatted report data |
| GET | `/api/scans/:id/export/pdf` | Export scan as PDF |

### YARA Rule Endpoints (Railway)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rules` | List all rules |
| POST | `/api/rules` | Create new rule |
| PUT | `/api/rules/:id` | Update a rule |
| DELETE | `/api/rules/:id` | Delete a rule |
| POST | `/api/rules/:id/test` | Test rule against a file |
| POST | `/api/rules/validate` | Validate YARA syntax |

### ML Inference Endpoints (Hugging Face Spaces)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/predict/malware` | Classify file as malware/clean |
| POST | `/predict/steganography` | Detect hidden data in image |
| POST | `/predict/network` | Analyze network traffic data |
| GET | `/models/status` | Check model loading status |
| GET | `/health` | Health check |

### Dashboard & Misc Endpoints (Railway)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Summary statistics |
| GET | `/api/dashboard/chart/severity` | Severity distribution data |
| GET | `/api/dashboard/chart/timeline` | Scan timeline data |
| GET | `/api/dashboard/recent` | Recent scan activity |
| GET | `/api/threats/feed` | External threat intel feed |
| GET | `/api/threats/map` | Geo-located threat data |
| POST | `/api/api-keys` | Generate new API key |
| GET | `/api/api-keys` | List API keys |
| DELETE | `/api/api-keys/:id` | Revoke an API key |
| GET | `/api/activity` | User activity log |

---

## 8. ML Pipeline Architecture

```mermaid
graph TB
    subgraph "File Upload"
        Upload["Uploaded File"]
        Meta["Extract Metadata<br/>(hash, size, type, magic bytes)"]
    end

    subgraph "Feature Extraction"
        PEFeat["PE Features<br/>(imports, sections, headers)"]
        ByteFeat["Byte Histogram<br/>(256 byte frequency bins)"]
        EntFeat["Entropy Features<br/>(overall + per-section)"]
        ImgFeat["Image Stats<br/>(LSB variance, chi-sq)"]
        NetFeat["Network Features<br/>(packet sizes, intervals, ports)"]
    end

    subgraph "ML Models (HF Spaces)"
        MalModel["Malware Classifier<br/>RandomForest / XGBoost<br/>Trained on PE features"]
        StegoModel["Stego Detector<br/>Gradient Boosting<br/>Trained on image stats"]
        NetModel["Network Anomaly Detector<br/>IsolationForest<br/>Trained on flow features"]
    end

    subgraph "Post-Processing"
        Combine["Combine Results"]
        Score["Calculate Threat Score<br/>(weighted average)"]
        Report["Generate Report"]
    end

    Upload --> Meta
    Meta --> PEFeat
    Meta --> ByteFeat
    Meta --> EntFeat
    Meta --> ImgFeat
    Meta --> NetFeat

    PEFeat --> MalModel
    ByteFeat --> MalModel
    EntFeat --> MalModel
    ImgFeat --> StegoModel
    NetFeat --> NetModel

    MalModel --> Combine
    StegoModel --> Combine
    NetModel --> Combine
    Combine --> Score
    Score --> Report
```

### ML Model Training Strategy

```mermaid
sequenceDiagram
    participant D as Dataset
    participant FE as Feature Extractor
    participant T as Trainer
    participant M as Model
    participant S as Storage

    Note over D: Public datasets:<br/>EMBER, CIC-IDS-2017,<br/>BOSS (stego), custom samples

    D->>FE: Raw samples
    FE->>FE: Extract features (PE, bytes, entropy)
    FE->>T: Feature matrix + labels
    T->>T: Train/validate split (80/20)
    T->>T: Cross-validation (5-fold)
    T->>T: Hyperparameter tuning (GridSearchCV)
    T->>M: Trained model (.pkl via joblib)
    M->>S: Store in Git LFS / HF Hub
    Note over S: Models auto-loaded<br/>by HF Space on startup
```

---

## 9. Scan Orchestration Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Next.js Frontend
    participant API as Flask API (Railway)
    participant ML as ML Server (HF Spaces)
    participant YARA as YARA Engine
    participant DB as Supabase DB
    participant ST as Supabase Storage

    U->>FE: Upload file(s) + select options
    FE->>API: POST /api/scans (multipart)
    API->>ST: Store uploaded file
    API->>DB: Create scan record (status: queued)
    API-->>FE: Return scan ID

    Note over API: Background task (Celery / thread)

    API->>API: Extract file metadata (hash, type, size)
    API->>API: Calculate entropy
    API->>DB: Update scan (status: running)

    par ML Inference
        API->>ML: POST /predict/malware (features)
        ML-->>API: {class: "trojan", confidence: 0.94}
    and YARA Matching
        API->>YARA: Match file against rules
        YARA-->>API: [{rule: "suspicious_packer", matches: [...]}]
    end

    API->>DB: Save findings
    API->>DB: Update scan (status: completed)
    DB-->>FE: Realtime notification
    FE-->>U: Show results
```

---

## 10. Authentication & Security

```mermaid
flowchart TD
    Start([User visits app]) --> Check{Has JWT?}

    Check -->|Yes| Validate{JWT valid?}
    Check -->|No| Login[Show Login Page]

    Validate -->|Yes| Dashboard
    Validate -->|No| Login

    Login --> Method{Auth method}
    Method -->|Email/Password| Creds[Enter credentials]
    Method -->|Sign Up| Register[Create account]

    Creds --> VerifyCreds{Valid?}
    VerifyCreds -->|No| Error[Show error]
    Error --> Login

    VerifyCreds -->|Yes| CheckMFA{MFA enabled?}
    Register --> CheckMFA

    CheckMFA -->|No| IssueJWT[Issue JWT + Refresh Token]
    CheckMFA -->|Yes| MFA[Enter TOTP Code]
    MFA --> VerifyMFA{Valid?}
    VerifyMFA -->|No| MFAError[Show error]
    MFAError --> MFA
    VerifyMFA -->|Yes| IssueJWT

    IssueJWT --> Dashboard[Go to Dashboard]
```

### Security Layers

| Layer | Implementation |
|-------|----------------|
| **Transport** | HTTPS enforced (Vercel + Railway auto-SSL) |
| **Authentication** | JWT (access + refresh) via Flask-JWT-Extended |
| **MFA** | TOTP via pyotp (Google Authenticator compatible) |
| **Authorization** | Role-based (admin, analyst, viewer) |
| **Rate Limiting** | Flask-Limiter (100 req/min general, 10 req/min scans) |
| **Input Validation** | Marshmallow schemas on all endpoints |
| **File Safety** | Uploaded files stored in Supabase Storage, never executed |
| **CORS** | Strict origin whitelist (Vercel domain only) |
| **Headers** | Helmet-equivalent security headers via middleware |
| **DB Security** | Supabase RLS policies per user |

---

## 11. Project Structure

```
cybersecurity-threat-ai/
├── frontend/                          # Next.js 14 (→ Vercel)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (public)/             # Landing, features, docs
│   │   │   │   ├── page.tsx          # Landing page
│   │   │   │   ├── features/page.tsx
│   │   │   │   └── docs/page.tsx
│   │   │   ├── (auth)/              # Login, signup
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── signup/page.tsx
│   │   │   │   └── forgot-password/page.tsx
│   │   │   ├── (dashboard)/         # Protected routes
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── scans/
│   │   │   │   │   ├── page.tsx     # Scan list
│   │   │   │   │   ├── new/page.tsx # New scan
│   │   │   │   │   └── [id]/page.tsx# Scan results
│   │   │   │   ├── rules/
│   │   │   │   │   ├── page.tsx     # Rule list
│   │   │   │   │   └── [id]/edit/page.tsx # Rule editor
│   │   │   │   ├── threats/
│   │   │   │   │   ├── map/page.tsx # Threat map
│   │   │   │   │   └── feed/page.tsx
│   │   │   │   ├── reports/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   └── settings/
│   │   │   │       ├── page.tsx
│   │   │   │       └── api-keys/page.tsx
│   │   │   ├── api/                 # Next.js API routes (proxy)
│   │   │   │   └── proxy/[...path]/route.ts
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ui/                  # Button, Card, Modal, etc.
│   │   │   ├── dashboard/           # Chart widgets, stat cards
│   │   │   ├── scans/               # File upload, progress, results
│   │   │   ├── rules/               # Rule editor, rule list
│   │   │   ├── threats/             # Map component, feed items
│   │   │   ├── layout/              # Navbar, Sidebar, Footer
│   │   │   └── auth/                # Login form, signup form
│   │   ├── lib/
│   │   │   ├── api.ts               # API client functions
│   │   │   ├── auth.ts              # Auth helpers
│   │   │   └── constants.ts         # Config values
│   │   └── utils/
│   │       ├── supabase/
│   │       │   ├── client.ts
│   │       │   └── server.ts
│   │       └── formatters.ts
│   ├── public/                      # Static assets
│   ├── package.json
│   ├── next.config.mjs
│   └── Dockerfile
│
├── backend/                          # Flask API (→ Railway)
│   ├── app/
│   │   ├── __init__.py              # Flask app factory
│   │   ├── config.py                # Config from env vars
│   │   ├── extensions.py            # DB, JWT, Limiter init
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── scan.py
│   │   │   ├── finding.py
│   │   │   ├── yara_rule.py
│   │   │   ├── api_key.py
│   │   │   └── activity_log.py
│   │   ├── api/
│   │   │   ├── __init__.py          # Blueprint registration
│   │   │   ├── auth.py              # Auth endpoints
│   │   │   ├── scans.py             # Scan CRUD + orchestration
│   │   │   ├── rules.py             # YARA rule CRUD
│   │   │   ├── dashboard.py         # Stats & charts data
│   │   │   ├── reports.py           # Report endpoints
│   │   │   ├── threats.py           # Threat intel & map data
│   │   │   └── api_keys.py          # API key management
│   │   ├── services/
│   │   │   ├── scanner.py           # Scan orchestrator
│   │   │   ├── yara_engine.py       # YARA compile & match
│   │   │   ├── file_analyzer.py     # Entropy, PE, metadata
│   │   │   ├── ml_client.py         # HTTP client to HF Space
│   │   │   └── threat_intel.py      # External API integration
│   │   ├── middleware/
│   │   │   ├── auth_required.py     # JWT decorator
│   │   │   └── error_handler.py     # Global error handler
│   │   └── utils/
│   │       ├── validators.py        # Marshmallow schemas
│   │       └── helpers.py           # Misc utilities
│   ├── migrations/                  # Alembic migrations
│   ├── yara_rules/                  # Built-in YARA rules
│   │   ├── malware/
│   │   ├── suspicious/
│   │   └── packer/
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_scans.py
│   │   ├── test_rules.py
│   │   └── test_yara_engine.py
│   ├── requirements.txt
│   ├── Procfile                     # Railway: gunicorn
│   ├── Dockerfile
│   └── railway.toml
│
├── ml-service/                       # ML Backend (→ HF Spaces)
│   ├── app.py                       # Flask/Gradio server
│   ├── models/
│   │   ├── malware_classifier.pkl   # Trained model (Git LFS)
│   │   ├── stego_detector.pkl       # Trained model (Git LFS)
│   │   └── network_anomaly.pkl      # Trained model (Git LFS)
│   ├── inference/
│   │   ├── malware.py               # Malware prediction logic
│   │   ├── steganography.py         # Stego prediction logic
│   │   └── network.py               # Network prediction logic
│   ├── features/
│   │   ├── pe_features.py           # PE feature extraction
│   │   ├── image_features.py        # Image stat extraction
│   │   └── network_features.py      # PCAP feature extraction
│   ├── training/                    # Training scripts
│   │   ├── train_malware.py
│   │   ├── train_stego.py
│   │   └── train_network.py
│   ├── requirements.txt
│   └── README.md                    # HF Space metadata
│
├── docker-compose.yml               # Local dev environment
├── .github/
│   └── workflows/
│       ├── ci.yml                   # Test + lint on PR
│       └── deploy.yml               # Auto-deploy pipeline
├── .gitattributes                   # Git LFS tracking
├── .env.example
└── README.md
```

---

## 12. CI/CD Pipeline

```mermaid
graph LR
    subgraph "GitHub"
        Push["git push / PR"]
    end

    subgraph "GitHub Actions"
        Lint["Lint<br/>(ESLint + Flake8)"]
        TestFE["Test Frontend<br/>(Vitest)"]
        TestBE["Test Backend<br/>(pytest)"]
        Build["Build Check<br/>(next build)"]
    end

    subgraph "Deploy (on main merge)"
        DeployFE["Vercel<br/>Auto-deploy"]
        DeployBE["Railway<br/>Auto-deploy"]
        DeployML["HF Spaces<br/>git push to HF"]
    end

    Push --> Lint
    Push --> TestFE
    Push --> TestBE
    Lint --> Build
    TestFE --> Build
    TestBE --> Build
    Build --> DeployFE
    Build --> DeployBE
    Build --> DeployML
```

---

## 13. Phased Build Roadmap

```mermaid
gantt
    title Cybersecurity Threat AI — Build Phases
    dateFormat YYYY-MM-DD
    section Phase 1: Foundation (Week 1)
    Project scaffolding (Next.js + Flask)  :p1a, 2026-02-12, 1d
    Supabase setup (DB + Auth)            :p1b, after p1a, 1d
    Auth endpoints + Login/Signup UI      :p1c, after p1b, 2d
    Dashboard skeleton + navbar/sidebar   :p1d, after p1c, 2d
    Deploy skeleton to Vercel/Railway     :p1e, after p1d, 1d

    section Phase 2: Core Scanning (Week 2-3)
    File upload UI + Supabase Storage     :p2a, after p1e, 2d
    File metadata extraction (hash/type)  :p2b, after p2a, 1d
    Entropy analysis service              :p2c, after p2b, 1d
    YARA rule engine integration          :p2d, after p2c, 2d
    PE header parser                      :p2e, after p2d, 1d
    Scan orchestrator + results API       :p2f, after p2e, 2d
    Scan results UI                       :p2g, after p2f, 2d

    section Phase 3: ML Models (Week 3-4)
    Train malware classifier              :p3a, after p2g, 2d
    Train stego detector                  :p3b, after p3a, 2d
    Train network anomaly detector        :p3c, after p3b, 2d
    Deploy ML service to HF Spaces        :p3d, after p3c, 1d
    Integrate ML predictions into scan    :p3e, after p3d, 1d

    section Phase 4: Advanced Features (Week 4-5)
    YARA rule editor UI (CodeMirror)      :p4a, after p3e, 2d
    Dashboard charts (Chart.js)           :p4b, after p4a, 2d
    Threat map (Leaflet)                  :p4c, after p4b, 2d
    PDF report export                     :p4d, after p4c, 1d
    API key management                    :p4e, after p4d, 1d
    Dark mode + UI polish                 :p4f, after p4e, 2d

    section Phase 5: Production (Week 5-6)
    CI/CD pipelines                       :p5a, after p4f, 1d
    Full test suite (pytest + Vitest)     :p5b, after p5a, 2d
    Security hardening                    :p5c, after p5b, 1d
    README + documentation                :p5d, after p5c, 1d
    Final deploy + smoke test             :p5e, after p5d, 1d
```

---

## 14. Verification Plan

### Automated Tests

| Test Suite | Framework | Run Command | Coverage |
|------------|-----------|-------------|----------|
| **Frontend Unit** | Vitest + Testing Library | `cd frontend && npm test` | Components, utils, hooks |
| **Backend Unit** | pytest | `cd backend && pytest` | API endpoints, services, models |
| **Backend Integration** | pytest + fixtures | `cd backend && pytest tests/integration/` | DB operations, scan flow |
| **YARA Engine** | pytest | `cd backend && pytest tests/test_yara_engine.py` | Rule compilation, matching |
| **ML Models** | pytest | `cd ml-service && pytest tests/` | Model loading, prediction accuracy |
| **E2E** | Playwright | `npx playwright test` | Full user flows (login → scan → results) |

### Manual Verification

1. **File Upload Flow**: Upload a test EXE file → verify it reaches Supabase Storage → verify scan record is created → verify findings appear
2. **YARA Rule Test**: Create a custom YARA rule via the editor → test against a known file → verify match/no-match
3. **ML Predictions**: Upload known malware samples → confirm classification with >80% confidence
4. **Auth Flow**: Sign up → log in → enable 2FA → log out → log back in with TOTP → verify access
5. **Dashboard**: Create 5+ scans → verify charts update correctly → verify recent scans list
6. **PDF Export**: Complete a scan → export PDF → verify report content and formatting
7. **API Key Access**: Generate API key → use `curl` to call `/api/scans` with API key header → verify response
8. **Deployment Health**: Hit `/health` on Railway → hit `/health` on HF Space → verify both respond 200

---

> [!TIP]
> **CV Impact Maximizer**: This project touches **ML/AI, Full-Stack, DevOps, and Cybersecurity** — four high-demand domains in a single project. The split deployment (Vercel + Railway + HF Spaces) also demonstrates cloud architecture skills.
