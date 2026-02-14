'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { generatePdfReport } from '@/lib/generatePdfReport';

interface Finding {
  id: string; finding_type: string; severity: string; title: string;
  description: string; confidence: number; remediation: string;
  details?: {
    strings?: {
      total_strings?: number;
      suspicious_strings?: string[];
      urls?: string[];
      ips?: string[];
      emails?: string[];
      registry_keys?: string[];
    };
    suspicious_apis?: string[];
    pe_info?: {
      sections?: { name: string; entropy: number; size: number }[];
    };
    stego_analysis?: {
      confidence?: number;
      method?: string;
      indicators?: string[];
    };
    [key: string]: unknown;
  };
  rule_matches?: { rule_name: string; matched_strings: string[] }[];
}

interface ScanDetail {
  id: string; status: string; scan_type: string; total_files: number;
  threats_found: number; duration_seconds: number;
  created_at: string; completed_at: string; shared_at: string; expires_at: string;
  options?: {
    enable_ml?: boolean;
    enable_yara?: boolean;
    enable_entropy?: boolean;
    enable_pe?: boolean;
    enable_stego?: boolean;
    enable_pcap?: boolean;
    [key: string]: unknown;
  };
  files: { filename: string; file_hash_sha256: string; mime_type: string; file_size: number; entropy: number }[];
  findings: Finding[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/proxy';

function severityBadge(s: string) {
  const cls: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-500 border-red-500/30',
    high: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
    medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
    low: 'bg-green-500/10 text-green-500 border-green-500/30',
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  };
  return cls[s] || cls.info;
}

export default function SharedReportPage() {
  const params = useParams();
  const token = params.token as string;
  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');
  const [exporting, setExporting] = useState(false);

  const isProxy = API_BASE.startsWith('/');
  const sharedUrl = isProxy ? `${API_BASE}/shared/${token}` : `${API_BASE}/api/shared/${token}`;

  useEffect(() => {
    fetch(sharedUrl)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: 'Link invalid or expired' }));
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => setScan(data))
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : 'Failed to load report';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [token, sharedUrl]);

  const handleExportPdf = () => {
    if (!scan) return;
    setExporting(true);
    try { generatePdfReport(scan); } catch (e) { console.error(e); }
    setTimeout(() => setExporting(false), 1500);
  };

  // Categorize findings
  const mlFindings = useMemo(() => scan?.findings.filter(f => f.finding_type === 'malware') || [], [scan]);
  const yaraFindings = useMemo(() => scan?.findings.filter(f => f.finding_type === 'yara') || [], [scan]);
  const entropyFindings = useMemo(() => scan?.findings.filter(f => f.finding_type === 'entropy' && !f.details?.strings) || [], [scan]);
  const peFindings = useMemo(() => scan?.findings.filter(f => f.finding_type === 'pe_header') || [], [scan]);
  const stegoFindings = useMemo(() => scan?.findings.filter(f => f.finding_type === 'steganography') || [], [scan]);
  const networkFindings = useMemo(() => scan?.findings.filter(f => f.finding_type === 'network') || [], [scan]);
  const strFinding = useMemo(() => scan?.findings.find(f => f.details?.strings), [scan]);

  const threatScore = useMemo(() => {
    if (!scan) return 0;
    const w: Record<string, number> = { critical: 30, high: 20, medium: 10, low: 5, info: 1 };
    return Math.min(100, scan.findings.reduce((s, f) => s + (w[f.severity] || 5), 0));
  }, [scan]);

  const threatLevel = threatScore >= 67 ? 'HIGH' : threatScore >= 34 ? 'MEDIUM' : 'LOW';
  const threatColor = threatScore >= 67 ? 'text-red-500' : threatScore >= 34 ? 'text-yellow-500' : 'text-green-500';
  const barColor = threatScore >= 67 ? 'bg-red-500' : threatScore >= 34 ? 'bg-yellow-500' : 'bg-green-500';

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500 font-mono">Loading shared report...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md">
        <span className="material-symbols-outlined text-6xl text-red-400 mb-4 block">link_off</span>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Report Unavailable</h2>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    </div>
  );

  if (!scan) return null;
  const file = scan.files?.[0];
  const opts = scan.options || {};
  const tabs = ['Overview', 'Findings'];
  const expiresDate = scan.expires_at ? new Date(scan.expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const sharedDate = scan.shared_at ? new Date(scan.shared_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Share+Tech+Mono&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      <div className="bg-[#1a1a2e] text-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛡</span>
            <div>
              <h1 className="text-base font-bold tracking-wider" style={{ fontFamily: 'Share Tech Mono, monospace' }}>THREATFORGE</h1>
              <p className="text-[10px] text-gray-400 tracking-widest uppercase">Scan Report</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-gray-400">
            {sharedDate && <span>Shared: {sharedDate}</span>}
            {expiresDate && <span className="text-yellow-400">Expires: {expiresDate}</span>}
          </div>
        </div>
      </div>

      {/* Green accent bar */}
      <div className="h-1 bg-gradient-to-r from-green-400 to-emerald-500" />

      <div className="max-w-5xl mx-auto px-6 py-6">

        {/* File & Score Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 p-6 mb-6 shadow-sm"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Share Tech Mono, monospace' }}>
                Scan Results — {file?.filename || 'Unknown File'}
              </h2>
              <p className="text-xs font-mono text-gray-400 mt-1">
                ID: {scan.id.slice(0, 16)} • Started: {new Date(scan.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="text-center">
                <div className="text-[10px] text-gray-400 uppercase">Status</div>
                <div className="text-green-500 font-bold">● {scan.status}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-gray-400 uppercase">Duration</div>
                <div className="text-gray-800 font-bold">{scan.duration_seconds}s</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-gray-400 uppercase">Threat Level</div>
                <div className={`font-bold ${threatColor}`}>● {threatLevel}</div>
              </div>
            </div>
          </div>

          {/* Threat Score Bar */}
          <div className="border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider" style={{ fontFamily: 'Share Tech Mono, monospace' }}>Threat Score</span>
              <span className={`text-lg font-bold ${threatColor}`} style={{ fontFamily: 'Share Tech Mono, monospace' }}>{threatScore}/100 {threatLevel === 'HIGH' ? 'MALICIOUS' : threatLevel === 'MEDIUM' ? 'SUSPICIOUS' : 'CLEAN'}</span>
            </div>
            <div className="w-full bg-gray-100 h-3 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${threatScore}%` }} transition={{ duration: 1, ease: 'easeOut' }} className={`h-full ${barColor}`} />
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'text-gray-800 border-b-2 border-green-500'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              style={{ fontFamily: 'Share Tech Mono, monospace' }}
            >
              [{tab}]
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {activeTab === 'Overview' && (
              <>
                {/* File Metadata */}
                <div className="bg-white border border-gray-200 p-5">
                  <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2" style={{ fontFamily: 'Share Tech Mono, monospace' }}>
                    <span className="material-symbols-outlined text-sm text-gray-400">description</span>
                    File Metadata
                  </h3>
                  {file && (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Name', value: file.filename },
                        { label: 'Size', value: `${(file.file_size / (1024 * 1024)).toFixed(1)} MB (${file.file_size.toLocaleString()} bytes)` },
                        { label: 'SHA-256', value: file.file_hash_sha256 || 'N/A', span: true },
                        { label: 'Type', value: file.mime_type || 'Unknown' },
                        { label: 'Entropy', value: `${file.entropy?.toFixed(2) || 'N/A'}` },
                      ].map((item, i) => (
                        <div key={i} className={item.span ? 'col-span-2' : ''}>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">{item.label}</p>
                          <p className="text-xs font-mono text-gray-800 break-all">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scan Configuration */}
                <div className="bg-white border border-gray-200 p-5">
                  <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2" style={{ fontFamily: 'Share Tech Mono, monospace' }}>
                    <span className="material-symbols-outlined text-sm text-gray-400">settings</span>
                    Scan Configuration
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'ML Detection', on: opts.enable_ml !== false },
                      { label: 'YARA Matching', on: opts.enable_yara !== false },
                      { label: 'Entropy', on: opts.enable_entropy !== false },
                      { label: 'PE Inspection', on: opts.enable_pe !== false },
                      { label: 'Steganography', on: !!opts.enable_stego },
                      { label: 'Network/PCAP', on: !!opts.enable_pcap },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-gray-500">{item.label}</span>
                        <span className={`font-bold ${item.on ? 'text-green-500' : 'text-gray-300'}`}>{item.on ? 'ON' : 'OFF'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'Findings' && (
              <div className="space-y-4">
                {/* ML */}
                <div className="bg-white border border-gray-200 p-5">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2" style={{ fontFamily: 'Share Tech Mono, monospace' }}>
                    <span className="material-symbols-outlined text-sm text-gray-400">psychology</span>
                    ML Predictions
                  </h3>
                  {mlFindings.length > 0 ? mlFindings.map(f => (
                    <div key={f.id} className="border-l-3 border-red-500 pl-3 py-2 mb-2">
                      <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase border ${severityBadge(f.severity)}`}>{f.severity}</span>
                      <span className="ml-2 text-xs font-bold text-gray-800">{f.title}</span>
                      <p className="text-[11px] text-gray-500 mt-1">{f.description}</p>
                    </div>
                  )) : <p className="text-xs text-green-500 font-mono">✓ No ML-based threats detected</p>}
                </div>

                {/* YARA */}
                <div className="bg-white border border-gray-200 p-5">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2" style={{ fontFamily: 'Share Tech Mono, monospace' }}>
                    <span className="material-symbols-outlined text-sm text-gray-400">policy</span>
                    YARA Matches ({yaraFindings.length})
                  </h3>
                  {yaraFindings.length > 0 ? yaraFindings.map(f => (
                    <div key={f.id} className="border-l-3 border-yellow-500 pl-3 py-2 mb-2">
                      <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase border ${severityBadge(f.severity)}`}>{f.severity}</span>
                      <span className="ml-2 text-xs font-bold text-gray-800">{f.title}</span>
                      <p className="text-[11px] text-gray-500 mt-1">{f.description}</p>
                    </div>
                  )) : <p className="text-xs text-green-500 font-mono">✓ No YARA rule matches found</p>}
                </div>

                {/* Entropy */}
                {entropyFindings.length > 0 && (
                  <div className="bg-white border border-gray-200 p-5">
                    <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2" style={{ fontFamily: 'Share Tech Mono, monospace' }}>
                      <span className="material-symbols-outlined text-sm text-gray-400">analytics</span>
                      Entropy Findings
                    </h3>
                    {entropyFindings.map(f => (
                      <div key={f.id} className="border-l-3 border-orange-500 pl-3 py-2 mb-2">
                        <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase border ${severityBadge(f.severity)}`}>{f.severity}</span>
                        <span className="ml-2 text-xs font-bold text-gray-800">{f.title}</span>
                        <p className="text-[11px] text-gray-500 mt-1">{f.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* PE Headers */}
                {peFindings.length > 0 && (
                  <div className="bg-white border border-gray-200 p-5">
                    <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2" style={{ fontFamily: 'Share Tech Mono, monospace' }}>
                      <span className="material-symbols-outlined text-sm text-gray-400">memory</span>
                      PE Header Findings
                    </h3>
                    {peFindings.map(f => (
                      <div key={f.id} className="border-l-3 border-purple-500 pl-3 py-2 mb-2">
                        <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase border ${severityBadge(f.severity)}`}>{f.severity}</span>
                        <span className="ml-2 text-xs font-bold text-gray-800">{f.title}</span>
                        <p className="text-[11px] text-gray-500 mt-1">{f.description}</p>
                        {f.details?.suspicious_apis && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(f.details.suspicious_apis as string[]).map((api, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-mono border border-purple-200">{api}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Steganography */}
                {stegoFindings.length > 0 && (
                  <div className="bg-white border border-gray-200 p-5">
                    <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2" style={{ fontFamily: 'Share Tech Mono, monospace' }}>
                      <span className="material-symbols-outlined text-sm text-gray-400">image_search</span>
                      Steganography
                    </h3>
                    {stegoFindings.map(f => (
                      <div key={f.id} className="border-l-3 border-indigo-500 pl-3 py-2">
                        <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase border ${severityBadge(f.severity)}`}>{f.severity}</span>
                        <span className="ml-2 text-xs font-bold text-gray-800">{f.title}</span>
                        <p className="text-[11px] text-gray-500 mt-1">{f.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Network */}
                {networkFindings.length > 0 && (
                  <div className="bg-white border border-gray-200 p-5">
                    <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2" style={{ fontFamily: 'Share Tech Mono, monospace' }}>
                      <span className="material-symbols-outlined text-sm text-gray-400">lan</span>
                      Network Findings
                    </h3>
                    {networkFindings.map(f => (
                      <div key={f.id} className="border-l-3 border-cyan-500 pl-3 py-2 mb-2">
                        <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase border ${severityBadge(f.severity)}`}>{f.severity}</span>
                        <span className="ml-2 text-xs font-bold text-gray-800">{f.title}</span>
                        <p className="text-[11px] text-gray-500 mt-1">{f.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Strings */}
                {strFinding?.details?.strings && (
                  <div className="bg-white border border-gray-200 p-5">
                    <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2" style={{ fontFamily: 'Share Tech Mono, monospace' }}>
                      <span className="material-symbols-outlined text-sm text-gray-400">text_fields</span>
                      String Analysis
                    </h3>
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      {[
                        { label: 'Total', value: strFinding.details?.strings?.total_strings || 0 },
                        { label: 'Suspicious', value: (strFinding.details?.strings?.suspicious_strings || []).length },
                        { label: 'URLs', value: (strFinding.details?.strings?.urls || []).length },
                        { label: 'IPs', value: (strFinding.details?.strings?.ips || []).length },
                      ].map((s, i) => (
                        <div key={i} className="text-center bg-gray-50 p-2">
                          <p className="text-[10px] text-gray-400 font-mono uppercase">{s.label}</p>
                          <p className="text-base font-bold text-gray-800">{s.value}</p>
                        </div>
                      ))}
                    </div>
                    {(strFinding.details.strings.suspicious_strings || []).length > 0 && (
                      <div className="max-h-40 overflow-y-auto border border-gray-100 p-3 bg-gray-50">
                        {(strFinding.details?.strings?.suspicious_strings || []).slice(0, 30).map((s: string, i: number) => (
                          <p key={i} className="text-[10px] font-mono text-gray-600 truncate">{s}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Findings Summary */}
            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-bold text-gray-800 mb-3 uppercase tracking-wider" style={{ fontFamily: 'Share Tech Mono, monospace' }}>Findings Summary</h3>
              <div className="space-y-2">
                {[
                  { label: 'ML', count: mlFindings.length },
                  { label: 'YARA', count: yaraFindings.length },
                  { label: 'Entropy', count: entropyFindings.length },
                  { label: 'PE Headers', count: peFindings.length },
                  { label: 'Stego', count: stegoFindings.length },
                  { label: 'Network', count: networkFindings.length },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-gray-500">{item.label}</span>
                    <span className={`font-bold ${item.count > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                      {item.count > 0 ? item.count : '✓'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Download PDF */}
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportPdf}
              disabled={exporting}
              className="w-full py-3 bg-green-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-green-600 transition-all disabled:opacity-50"
              style={{ fontFamily: 'Share Tech Mono, monospace' }}
            >
              <span className="material-symbols-outlined text-sm">{exporting ? 'hourglass_empty' : 'download'}</span>
              {exporting ? 'Generating...' : 'Download PDF'}
            </motion.button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400">
            <span className="material-symbols-outlined text-xs text-yellow-500">schedule</span>
            {expiresDate ? `This report expires on ${expiresDate}` : 'Shared report'}
          </div>
          <p className="text-[10px] font-mono text-gray-400">Powered by ThreatForge • AI-Powered Threat Detection</p>
        </div>
      </div>
    </div>
  );
}
