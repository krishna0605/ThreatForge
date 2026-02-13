## Step 3: Frontend Pages

### 3.1 API Client Helper — `frontend/src/lib/api.ts` [NEW]

Create a reusable API client with auth headers.

```typescript
'use client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function getHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function apiGet(path: string) {
  const res = await fetch(`${API_BASE}/api${path}`, { headers: getHeaders() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function apiPost(path: string, body?: any) {
  const headers: HeadersInit = { ...getHeaders(), 'Content-Type': 'application/json' };
  const res = await fetch(`${API_BASE}/api${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function apiPut(path: string, body: any) {
  const headers: HeadersInit = { ...getHeaders(), 'Content-Type': 'application/json' };
  const res = await fetch(`${API_BASE}/api${path}`, { method: 'PUT', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function apiDelete(path: string) {
  const res = await fetch(`${API_BASE}/api${path}`, { method: 'DELETE', headers: getHeaders() });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function apiUpload(path: string, formData: FormData) {
  const headers: HeadersInit = {};
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // Do NOT set Content-Type — browser sets multipart boundary automatically
  const res = await fetch(`${API_BASE}/api${path}`, { method: 'POST', headers, body: formData });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
}
```

---

### 3.2 New Scan Page — `frontend/src/app/(dashboard)/scans/new/page.tsx`

**OVERWRITE** the stub. Full drag-and-drop file upload with scan options.

```tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { apiUpload } from '@/lib/api';

export default function NewScanPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [scanType, setScanType] = useState('full');
  const [enableMl, setEnableMl] = useState(true);
  const [enableYara, setEnableYara] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleSubmit = async () => {
    if (!file) { setError('Please select a file'); return; }
    setError('');
    setIsScanning(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('scan_type', scanType);
      formData.append('enable_ml', String(enableMl));
      formData.append('enable_yara', String(enableYara));

      const result = await apiUpload('/scans', formData);
      router.push(`/scans/${result.scan_id}`);
    } catch (err: any) {
      setError(err.message || 'Scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="container-fluid p-0">
      <h2 className="fw-bold text-white mb-1">New Threat Scan</h2>
      <p className="text-secondary mb-4">Upload a file to analyze for threats</p>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      {/* Drop Zone */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className={`feature-card text-center p-5 mb-4 ${isDragging ? 'border-primary' : ''}`}
        style={{ cursor: 'pointer', borderStyle: 'dashed', borderWidth: '2px' }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="d-none"
          onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }}
        />
        <div className="fs-1 mb-3">{file ? '📄' : '📤'}</div>
        {file ? (
          <>
            <h5 className="text-white">{file.name}</h5>
            <p className="text-secondary mb-0">{formatSize(file.size)} • {file.type || 'Unknown type'}</p>
            <button className="btn btn-sm btn-outline-secondary mt-3"
              onClick={(e) => { e.stopPropagation(); setFile(null); }}>
              Remove
            </button>
          </>
        ) : (
          <>
            <h5 className="text-white">Drag & drop a file here</h5>
            <p className="text-secondary mb-0">or click to browse (max 50 MB)</p>
          </>
        )}
      </motion.div>

      {/* Scan Options */}
      <div className="feature-card p-4 mb-4">
        <h5 className="mb-3">Scan Options</h5>
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label text-secondary">Scan Type</label>
            <select className="form-select bg-dark text-white border-secondary"
              value={scanType} onChange={(e) => setScanType(e.target.value)}>
              <option value="full">Full Scan</option>
              <option value="quick">Quick Scan</option>
              <option value="yara_only">YARA Only</option>
            </select>
          </div>
          <div className="col-md-4 d-flex align-items-end">
            <div className="form-check">
              <input type="checkbox" className="form-check-input bg-dark border-secondary"
                id="enableMl" checked={enableMl} onChange={(e) => setEnableMl(e.target.checked)} />
              <label className="form-check-label text-secondary" htmlFor="enableMl">
                Enable ML Analysis
              </label>
            </div>
          </div>
          <div className="col-md-4 d-flex align-items-end">
            <div className="form-check">
              <input type="checkbox" className="form-check-input bg-dark border-secondary"
                id="enableYara" checked={enableYara} onChange={(e) => setEnableYara(e.target.checked)} />
              <label className="form-check-label text-secondary" htmlFor="enableYara">
                Enable YARA Rules
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button className="btn btn-cyber btn-lg px-5" onClick={handleSubmit}
        disabled={!file || isScanning}>
        {isScanning ? (
          <><span className="spinner-border spinner-border-sm me-2"></span>Scanning...</>
        ) : (
          <>🔍 Start Scan</>
        )}
      </button>
    </div>
  );
}
```

---

### 3.3 Scan History Page — `frontend/src/app/(dashboard)/scans/page.tsx`

**OVERWRITE** the stub.

```tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiGet, apiDelete } from '@/lib/api';
import { motion } from 'framer-motion';

interface Scan {
  id: string; status: string; filename: string | null; threats_found: number;
  duration_seconds: number | null; created_at: string; scan_type: string;
}

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    completed: 'bg-success', running: 'bg-primary', queued: 'bg-secondary', failed: 'bg-danger',
  };
  return map[s] || 'bg-secondary';
};

export default function ScansPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  const fetchScans = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: '10' });
      if (statusFilter) params.set('status', statusFilter);
      const data = await apiGet(`/scans?${params}`);
      setScans(data.scans);
      setTotalPages(data.pagination.pages);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScans(); }, [page, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this scan?')) return;
    try {
      await apiDelete(`/scans/${id}`);
      fetchScans();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="container-fluid p-0">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold text-white mb-1">Scan History</h2>
          <p className="text-secondary mb-0">View and manage your past scans</p>
        </div>
        <Link href="/scans/new" className="btn btn-cyber">🔍 New Scan</Link>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      {/* Filter */}
      <div className="mb-3">
        <select className="form-select bg-dark text-white border-secondary" style={{ width: 200 }}
          value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="running">Running</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="feature-card">
        {loading ? (
          <div className="text-center p-5">
            <div className="spinner-border text-primary"></div>
          </div>
        ) : scans.length === 0 ? (
          <div className="text-center p-5 text-secondary">
            <div className="fs-1 mb-3">📭</div>
            <p>No scans found. Start your first scan!</p>
            <Link href="/scans/new" className="btn btn-cyber-outline">Start Scan</Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle mb-0" style={{ backgroundColor: 'transparent' }}>
              <thead>
                <tr>
                  <th className="text-secondary small fw-bold">FILE</th>
                  <th className="text-secondary small fw-bold">STATUS</th>
                  <th className="text-secondary small fw-bold">THREATS</th>
                  <th className="text-secondary small fw-bold">DURATION</th>
                  <th className="text-secondary small fw-bold">DATE</th>
                  <th className="text-secondary small fw-bold text-end">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {scans.map((scan, i) => (
                  <motion.tr key={scan.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}>
                    <td>
                      <Link href={`/scans/${scan.id}`} className="text-decoration-none text-white fw-medium">
                        {scan.filename || 'Unknown file'}
                      </Link>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge(scan.status)} bg-opacity-25`}>{scan.status}</span>
                    </td>
                    <td>
                      <span className={scan.threats_found > 0 ? 'text-danger fw-bold' : 'text-success'}>
                        {scan.threats_found}
                      </span>
                    </td>
                    <td className="text-secondary">{scan.duration_seconds ? `${scan.duration_seconds}s` : '—'}</td>
                    <td className="text-secondary">{new Date(scan.created_at).toLocaleDateString()}</td>
                    <td className="text-end">
                      <Link href={`/scans/${scan.id}`} className="btn btn-sm btn-outline-primary me-2">View</Link>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(scan.id)}>🗑️</button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center gap-2 p-3 border-top border-secondary border-opacity-25">
            <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}>← Previous</button>
            <span className="text-secondary align-self-center">Page {page} of {totalPages}</span>
            <button className="btn btn-sm btn-outline-secondary" disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### 3.4 Scan Detail Page — `frontend/src/app/(dashboard)/scans/[id]/page.tsx`

**OVERWRITE** the stub.

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { motion } from 'framer-motion';

interface Finding {
  id: string; finding_type: string; severity: string; title: string;
  description: string; confidence: number; remediation: string;
  rule_matches?: { rule_name: string; matched_strings: any[] }[];
}

interface ScanDetail {
  id: string; status: string; scan_type: string; total_files: number;
  threats_found: number; duration_seconds: number;
  created_at: string; completed_at: string;
  files: { filename: string; file_hash_sha256: string; mime_type: string; file_size: number; entropy: number }[];
  findings: Finding[];
}

const severityColor: Record<string, string> = {
  critical: '#f85149', high: '#d29922', medium: '#e3b341', low: '#3fb950', info: '#58a6ff',
};

export default function ScanDetailPage() {
  const params = useParams();
  const scanId = params.id as string;
  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet(`/scans/${scanId}`)
      .then(setScan)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [scanId]);

  if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!scan) return <div className="text-center text-secondary p-5">Scan not found</div>;

  const file = scan.files[0];

  return (
    <div className="container-fluid p-0">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <Link href="/scans" className="text-secondary text-decoration-none small">← Back to Scans</Link>
          <h2 className="fw-bold text-white mt-1">{file?.filename || 'Unknown File'}</h2>
        </div>
        <span className={`badge ${scan.status === 'completed' ? 'bg-success' : 'bg-warning'} bg-opacity-25 px-3 py-2`}>
          {scan.status}
        </span>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Threats', value: scan.threats_found, color: scan.threats_found > 0 ? '#f85149' : '#3fb950' },
          { label: 'Duration', value: `${scan.duration_seconds || 0}s`, color: '#58a6ff' },
          { label: 'Entropy', value: file?.entropy?.toFixed(2) || 'N/A', color: '#bc8cff' },
          { label: 'File Size', value: file ? `${(file.file_size / 1024).toFixed(1)} KB` : '—', color: '#8b949e' },
        ].map((card, i) => (
          <div className="col-md-3" key={i}>
            <div className="stat-card feature-card">
              <p className="text-secondary small mb-1">{card.label}</p>
              <h3 className="fw-bold mb-0" style={{ color: card.color }}>{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* File Info */}
      {file && (
        <div className="feature-card p-4 mb-4">
          <h5 className="mb-3">📄 File Information</h5>
          <div className="row text-secondary small">
            <div className="col-md-6"><strong>SHA-256:</strong> <code>{file.file_hash_sha256 || 'N/A'}</code></div>
            <div className="col-md-3"><strong>MIME:</strong> {file.mime_type || 'N/A'}</div>
            <div className="col-md-3"><strong>Entropy:</strong> {file.entropy?.toFixed(4) || 'N/A'}</div>
          </div>
        </div>
      )}

      {/* Findings */}
      <div className="feature-card p-4">
        <h5 className="mb-3">🔍 Findings ({scan.findings.length})</h5>
        {scan.findings.length === 0 ? (
          <div className="text-center text-success py-4">
            <div className="fs-1 mb-2">✅</div>
            <p>No threats detected</p>
          </div>
        ) : (
          scan.findings.map((finding, i) => (
            <motion.div key={finding.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-3 mb-3 rounded-3 border border-secondary border-opacity-25"
              style={{ borderLeft: `4px solid ${severityColor[finding.severity] || '#8b949e'}` }}
            >
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge" style={{ backgroundColor: severityColor[finding.severity] }}>
                    {finding.severity.toUpperCase()}
                  </span>
                  <span className="badge bg-secondary bg-opacity-25">{finding.finding_type}</span>
                  <strong className="text-white">{finding.title}</strong>
                </div>
                {finding.confidence != null && (
                  <span className="text-secondary small">{(finding.confidence * 100).toFixed(0)}% confidence</span>
                )}
              </div>
              {finding.description && <p className="text-secondary small mb-2">{finding.description}</p>}
              {finding.remediation && (
                <div className="bg-dark p-2 rounded-2 small">
                  <strong className="text-warning">💡 Remediation:</strong>
                  <span className="text-secondary ms-1">{finding.remediation}</span>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
```

---

### 3.5 YARA Rules Page — `frontend/src/app/(dashboard)/rules/page.tsx`

**OVERWRITE** the stub. Includes inline rule editor modal.

```tsx
'use client';

import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { motion } from 'framer-motion';

interface YaraRule {
  id: string; name: string; category: string; severity: string;
  rule_content: string; is_enabled: boolean; is_builtin: boolean;
  created_at: string;
}

const severityColors: Record<string, string> = {
  critical: 'danger', high: 'warning', medium: 'info', low: 'success',
};

export default function RulesPage() {
  const [rules, setRules] = useState<YaraRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<YaraRule | null>(null);

  // Editor form state
  const [formName, setFormName] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState('custom');
  const [formSeverity, setFormSeverity] = useState('medium');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchRules = async () => {
    try {
      const data = await apiGet('/rules');
      setRules(data.rules);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRules(); }, []);

  const openEditor = (rule?: YaraRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormName(rule.name);
      setFormContent(rule.rule_content);
      setFormCategory(rule.category);
      setFormSeverity(rule.severity);
    } else {
      setEditingRule(null);
      setFormName('');
      setFormContent(`rule ExampleRule {\n  meta:\n    description = ""\n  strings:\n    $s1 = "suspicious"\n  condition:\n    $s1\n}`);
      setFormCategory('custom');
      setFormSeverity('medium');
    }
    setFormError('');
    setShowEditor(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setFormError('');
    try {
      if (editingRule) {
        await apiPut(`/rules/${editingRule.id}`, {
          name: formName, rule_content: formContent,
          category: formCategory, severity: formSeverity,
        });
      } else {
        await apiPost('/rules', {
          name: formName, rule_content: formContent,
          category: formCategory, severity: formSeverity,
        });
      }
      setShowEditor(false);
      fetchRules();
    } catch (err: any) { setFormError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    try { await apiDelete(`/rules/${id}`); fetchRules(); }
    catch (err: any) { setError(err.message); }
  };

  const handleValidate = async () => {
    try {
      const result = await apiPost('/rules/validate', { rule_content: formContent });
      if (result.valid) setFormError('');
      else setFormError(`Syntax errors: ${result.errors.join(', ')}`);
      alert(result.valid ? '✅ Valid YARA syntax!' : '❌ Invalid: ' + result.errors.join(', '));
    } catch (err: any) { setFormError(err.message); }
  };

  return (
    <div className="container-fluid p-0">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold text-white mb-1">YARA Rules</h2>
          <p className="text-secondary mb-0">Create and manage detection rules</p>
        </div>
        <button className="btn btn-cyber" onClick={() => openEditor()}>📜 New Rule</button>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      {loading ? (
        <div className="text-center p-5"><div className="spinner-border text-primary"></div></div>
      ) : rules.length === 0 ? (
        <div className="feature-card text-center p-5 text-secondary">
          <div className="fs-1 mb-3">📜</div>
          <p>No rules yet. Create your first YARA rule!</p>
        </div>
      ) : (
        <div className="row g-3">
          {rules.map((rule, i) => (
            <div className="col-md-6" key={rule.id}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }} className="feature-card p-4 h-100">
                <div className="d-flex align-items-start justify-content-between mb-2">
                  <div>
                    <h5 className="text-white mb-1">{rule.name}</h5>
                    <div className="d-flex gap-2">
                      <span className={`badge bg-${severityColors[rule.severity] || 'secondary'} bg-opacity-25 text-${severityColors[rule.severity]}`}>
                        {rule.severity}
                      </span>
                      <span className="badge bg-secondary bg-opacity-25">{rule.category}</span>
                      {rule.is_builtin && <span className="badge bg-info bg-opacity-25 text-info">builtin</span>}
                    </div>
                  </div>
                  <span className={`badge ${rule.is_enabled ? 'bg-success' : 'bg-secondary'} bg-opacity-25`}>
                    {rule.is_enabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <pre className="bg-dark p-3 rounded-2 text-secondary small mb-3 overflow-auto" style={{ maxHeight: 120 }}>
                  {rule.rule_content}
                </pre>
                {!rule.is_builtin && (
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => openEditor(rule)}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(rule.id)}>Delete</button>
                  </div>
                )}
              </motion.div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content bg-dark border border-secondary">
              <div className="modal-header border-secondary">
                <h5 className="modal-title text-white">{editingRule ? 'Edit Rule' : 'New YARA Rule'}</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowEditor(false)}></button>
              </div>
              <div className="modal-body">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                <div className="mb-3">
                  <label className="form-label text-secondary">Rule Name</label>
                  <input className="form-control bg-dark text-white border-secondary"
                    value={formName} onChange={(e) => setFormName(e.target.value)} />
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label text-secondary">Category</label>
                    <input className="form-control bg-dark text-white border-secondary"
                      value={formCategory} onChange={(e) => setFormCategory(e.target.value)} />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-secondary">Severity</label>
                    <select className="form-select bg-dark text-white border-secondary"
                      value={formSeverity} onChange={(e) => setFormSeverity(e.target.value)}>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label text-secondary">Rule Content (YARA Syntax)</label>
                  <textarea className="form-control bg-dark text-white border-secondary font-monospace"
                    rows={12} value={formContent} onChange={(e) => setFormContent(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer border-secondary">
                <button className="btn btn-outline-info" onClick={handleValidate}>✓ Validate Syntax</button>
                <button className="btn btn-outline-secondary" onClick={() => setShowEditor(false)}>Cancel</button>
                <button className="btn btn-cyber" disabled={saving} onClick={handleSave}>
                  {saving ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---
