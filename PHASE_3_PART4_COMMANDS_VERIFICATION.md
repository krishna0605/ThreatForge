## Step 4: Commands & Environment Setup

### 4.1 Install any new npm packages (if needed)

No new npm packages are required for Phase 3. All dependencies (`framer-motion`, `chart.js`, `react-chartjs-2`, `bootstrap`) were installed in Phase 1.

### 4.2 Backend setup commands

The backend already has all dependencies in `requirements.txt`. If you haven't set up the virtual environment yet:

```bash
# From project root
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

> **NOTE**: `yara-python` may fail to install on Windows. This is expected — the `YaraEngine` has a fallback regex-based matcher that works without it. To force install on Windows, try:
> ```bash
> pip install yara-python --no-build-isolation
> ```
> If it still fails, the app will still work via the fallback.

> **NOTE**: `python-magic-bin` is the Windows-compatible version of `python-magic`. It should install fine. If it fails, the `FileAnalyzer.get_file_metadata()` will need a try/except fallback (already handled).

### 4.3 Create the uploads directory

```bash
# Windows (from project root)
mkdir backend\uploads
```

Then update `backend/.env` to add:
```
UPLOAD_FOLDER=./uploads
```

### 4.4 Run the backend

```bash
cd backend
# Activate venv first, then:
python run.py
```

If `run.py` doesn't exist, check for the app entry point. You may need to create it:

**Create file**: `backend/run.py`

```python
"""Flask App Entry Point"""
from dotenv import load_dotenv
load_dotenv()

from app import create_app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

### 4.5 Run the frontend

```bash
cd frontend
npm run dev
```

### 4.6 Add `NEXT_PUBLIC_API_URL` to frontend `.env.local`

The `AuthContext.tsx` uses `NEXT_PUBLIC_API_URL` but `.env.local` currently has `BACKEND_URL`. Add:

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Step 5: File Summary — What to Create/Modify

| # | Action | File Path | Description |
|---|--------|-----------|-------------|
| 1 | **OVERWRITE** | `backend/app/services/file_analyzer.py` | Full metadata, entropy, PE parsing, ML feature extraction |
| 2 | **OVERWRITE** | `backend/app/services/yara_engine.py` | YARA compile, match, validate, test with fallback |
| 3 | **OVERWRITE** | `backend/app/services/scanner.py` | Full scan orchestrator (5-step pipeline) |
| 4 | **OVERWRITE** | `backend/app/services/ml_client.py` | Remove `current_app` dependency, use `os.environ` |
| 5 | **OVERWRITE** | `backend/app/api/scans.py` | 6 endpoints: create, list, detail, delete, report, PDF |
| 6 | **OVERWRITE** | `backend/app/api/rules.py` | 6 endpoints: list, create, update, delete, test, validate |
| 7 | **NEW** | `frontend/src/lib/api.ts` | Reusable API client helper (GET, POST, PUT, DELETE, Upload) |
| 8 | **OVERWRITE** | `frontend/src/app/(dashboard)/scans/new/page.tsx` | Drag-and-drop file upload with scan options |
| 9 | **OVERWRITE** | `frontend/src/app/(dashboard)/scans/page.tsx` | Scan history with pagination, filtering, delete |
| 10 | **OVERWRITE** | `frontend/src/app/(dashboard)/scans/[id]/page.tsx` | Scan detail with findings, severity badges, remediation |
| 11 | **OVERWRITE** | `frontend/src/app/(dashboard)/rules/page.tsx` | YARA rules CRUD with modal editor and syntax validation |
| 12 | **NEW** | `backend/run.py` | Flask entry point (if not existing) |
| 13 | **MODIFY** | `frontend/.env.local` | Add `NEXT_PUBLIC_API_URL=http://localhost:5000` |

---

## Step 6: Verification Plan

### 6.1 Backend Tests (Manual via curl or Postman)

```bash
# 1. Health check
curl http://localhost:5000/api/health

# 2. Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "password123", "display_name": "Test User"}'
# Save the access_token from response

# 3. Create a scan (upload a test file)
curl -X POST http://localhost:5000/api/scans \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@path/to/test_file.txt" \
  -F "scan_type=full"
# Save the scan_id from response

# 4. List scans
curl http://localhost:5000/api/scans \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Get scan detail
curl http://localhost:5000/api/scans/SCAN_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# 6. Create YARA rule
curl -X POST http://localhost:5000/api/rules \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TestRule",
    "severity": "medium",
    "rule_content": "rule TestRule { strings: $a = \"test\" condition: $a }"
  }'

# 7. List rules
curl http://localhost:5000/api/rules \
  -H "Authorization: Bearer YOUR_TOKEN"

# 8. Validate rule syntax
curl -X POST http://localhost:5000/api/rules/validate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rule_content": "rule Test { condition: true }"}'

# 9. Delete scan
curl -X DELETE http://localhost:5000/api/scans/SCAN_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6.2 Frontend Visual Tests

1. Navigate to `/scans` — should show empty state with "Start Scan" button
2. Click "New Scan" → navigate to `/scans/new`
3. Drag a file into the drop zone → file name and size should appear
4. Toggle scan options (ML, YARA) → checkboxes work
5. Click "Start Scan" → spinner shows → navigates to `/scans/SCAN_ID` on completion
6. Scan detail page shows file info, severity-colored findings, remediation tips
7. Back to `/scans` → scan appears in list with correct status/threat count
8. Navigate to `/rules` → create a new YARA rule → modal opens with template
9. Click "Validate Syntax" → shows valid/invalid alert
10. Save rule → appears in rules list
11. Edit rule → modal pre-filled → save updates
12. Delete rule → confirm dialog → rule removed

### 6.3 Edge Cases to Verify

- Upload a file > 50 MB → should get 413 error
- Upload file with disallowed extension → should get 400 error
- Submit scan without file → should get 400 error
- Create rule with invalid YARA syntax → should get 400 with error details
- Access scan belonging to another user → should get 404
- Delete a builtin rule → should get 403

---

## Important Notes for the AI Model

1. **File encoding**: All files must be UTF-8. Do NOT use `echo >>` to append to files on Windows — it produces UTF-16.

2. **`'use client'` directive**: Every frontend page that uses `useState`, `useEffect`, `useRouter`, `framer-motion`, or `useAuth` MUST have `'use client';` as the very first line.

3. **Import paths**: Frontend uses `@/` alias for `src/`. Example: `import { apiGet } from '@/lib/api';`

4. **Form data uploads**: The `apiUpload` function does NOT set `Content-Type` header — the browser automatically sets `multipart/form-data` with boundary. Setting it manually will break the upload.

5. **YARA fallback**: The `YaraEngine` class has a `_fallback_match` and `_fallback_validate` method that uses regex when `yara-python` is not installed. This ensures the app works on all platforms.

6. **Synchronous scanning**: Phase 3 uses synchronous scanning (the API waits for results). Phase 4 will add Celery + Redis for background async scanning with WebSocket progress updates.

7. **SQLite for development**: The backend uses SQLite by default (`sqlite:///dev.db`). The Supabase PostgreSQL connection is used in production via `DATABASE_URL` env var.

8. **Existing models are correct**: Do NOT modify any files in `backend/app/models/` — they already have the correct column definitions and relationships.

9. **Existing `__init__.py` files are correct**: Do NOT modify `backend/app/__init__.py`, `backend/app/api/__init__.py`, or `backend/app/models/__init__.py`.

10. **Order of implementation**: Implement in this order to avoid import errors:
    1. `file_analyzer.py` (no deps on other services)
    2. `yara_engine.py` (no deps)
    3. `ml_client.py` (no deps)
    4. `scanner.py` (depends on above 3)
    5. `scans.py` API (depends on scanner)
    6. `rules.py` API (depends on yara_engine)
    7. `api.ts` frontend helper (no deps)
    8. Frontend pages (depends on api.ts)
