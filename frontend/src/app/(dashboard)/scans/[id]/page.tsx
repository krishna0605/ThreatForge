'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiGet, apiPost } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
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
    suspicious_dns?: string[];
    iocs_found?: string[];
    [key: string]: unknown;
  };
  rule_matches?: { rule_name: string; matched_strings: string[] }[];
}

interface ScanOptions {
  enable_ml?: boolean;
  enable_yara?: boolean;
  enable_entropy?: boolean;
  enable_pe?: boolean;
  enable_stego?: boolean;
  enable_pcap?: boolean;
  [key: string]: unknown;
}

interface PeSection {
  name: string;
  entropy: number;
  size: number;
}

interface ScanDetail {
  id: string; status: string; scan_type: string; total_files: number;
  threats_found: number; duration_seconds: number;
  created_at: string; completed_at: string;
  options?: ScanOptions;
  files: { filename: string; file_hash_sha256: string; mime_type: string; file_size: number; entropy: number }[];
  findings: Finding[];
}

function getThreatLevel(score: number): { label: string; color: string; bg: string; border: string } {
  if (score >= 67) return { label: 'HIGH', color: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500' };
  if (score >= 34) return { label: 'MEDIUM', color: 'text-yellow-500', bg: 'bg-yellow-500', border: 'border-yellow-500' };
  return { label: 'LOW', color: 'text-green-500', bg: 'bg-green-500', border: 'border-green-500' };
}

function getSeverityDot(s: string) {
  switch (s) {
    case 'critical': case 'high': return 'bg-red-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-green-500';
    default: return 'bg-blue-500';
  }
}

function getSeverityBadge(s: string) {
  const colors: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-500 border-red-500/20',
    high: 'bg-red-500/10 text-red-400 border-red-400/20',
    medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    low: 'bg-green-500/10 text-green-500 border-green-500/20',
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };
  return colors[s] || colors.info;
}

export default function ScanDetailPage() {
  const params = useParams();
  const scanId = params.id as string;
  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');
  const [exporting, setExporting] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleExportPdf = () => {
    if (!scan) return;
    setExporting(true);
    try {
      generatePdfReport(scan);
    } catch (e) {
      console.error('PDF export failed:', e);
    }
    setTimeout(() => setExporting(false), 1500);
  };

  const handleShareLink = async () => {
    if (!scan) return;
    setShareLoading(true);
    try {
      const res = await apiPost(`/scans/${scanId}/share`) as { share_url: string };
      setShareUrl(res.share_url);
      setShareModal(true);
    } catch (e: unknown) {
      console.error('Share failed:', e);
      const msg = e instanceof Error ? e.message : 'Unknown error';
      alert('Failed to create share link: ' + msg);
    } finally {
      setShareLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchScan = useCallback(() => {
    apiGet(`/scans/${scanId}`)
      .then((data) => setScan(data as ScanDetail))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load scan';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [scanId]);

  useEffect(() => {
    fetchScan();
    const subscription = supabase
      .channel(`scan-${scanId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'scans', filter: `id=eq.${scanId}`,
      }, (payload) => {
        if (payload.new.status === 'completed' || payload.new.status === 'failed') {
          fetchScan();
        } else {
          setScan((prev) => prev ? { ...prev, status: payload.new.status } : null);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, [scanId, fetchScan]);

  const file = scan?.files?.[0];
  const opts = useMemo(() => (scan?.options || {}) as ScanOptions, [scan?.options]);

  // Compute threat score (0-100) from findings
  const threatScore = useMemo(() => {
    if (!scan) return 0;
    if (scan.findings.length === 0) return 0;
    const severityWeights: Record<string, number> = { critical: 30, high: 20, medium: 10, low: 5, info: 1 };
    const total = scan.findings.reduce((sum, f) => sum + (severityWeights[f.severity] || 5), 0);
    return Math.min(100, total);
  }, [scan]);

  const threatLevel = getThreatLevel(threatScore);

  // Derived categories — using CORRECT finding_type values from the backend
  const mlFindings = scan?.findings.filter(f => f.finding_type === 'malware') || [];
  const yaraFindings = scan?.findings.filter(f => f.finding_type === 'yara') || [];
  const entropyFindings = scan?.findings.filter(f => f.finding_type === 'entropy') || [];
  const peFindings = scan?.findings.filter(f => f.finding_type === 'pe_header') || [];
  const stegoFindings = scan?.findings.filter(f => f.finding_type === 'steganography') || [];
  const networkFindings = scan?.findings.filter(f => f.finding_type === 'network') || [];
  const highSeverityFindings = scan?.findings.filter(f => f.severity === 'critical' || f.severity === 'high') || [];

  // Build dynamic tabs based on which options were enabled
  // Fix: Ensure opts is typed correctly or casted if necessary, though ScanOptions interface should help.
  // The dependency array [opts] is correct if opts is stable.
  // However, opts comes from scan?.options which might be a new object every render if scan updates.
  // Since we depend on specific properties, it's better to destructure or rely on primitive values if possible,
  // but here we just ensure typing is correct.
  const TABS = useMemo(() => {
    const tabs = ['Overview'];
    // Default to true if undefined, checking explicitly for false
    if (opts?.enable_ml !== false) tabs.push('ML Results');
    if (opts?.enable_yara !== false) tabs.push('YARA Matches');
    if (opts?.enable_entropy !== false) tabs.push('Entropy');
    if (opts?.enable_pe !== false) tabs.push('PE Headers');
    if (opts?.enable_stego) tabs.push('Steganography');
    if (opts?.enable_pcap) tabs.push('Network');
    tabs.push('Strings');
    return tabs;
  }, [opts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} className="material-icons text-primary text-4xl">sync</motion.span>
          <span className="font-mono text-xs text-text-muted dark:text-gray-500 tracking-wider">LOADING_SCAN_RESULTS...</span>
        </div>
      </div>
    );
  }

  if (error) return (
    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-mono">
      <span className="material-icons text-sm mr-2 align-middle">error</span>{error}
    </div>
  );

  if (!scan) return (
    <div className="text-center py-16">
      <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-700 mb-3 inline-block">search_off</span>
      <p className="font-display text-lg text-text-main dark:text-white font-bold">Scan not found</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-xs font-mono">
        <Link href="/scans" className="text-text-muted dark:text-gray-500 hover:text-primary no-underline transition-colors">← Back to Scans</Link>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <span className="text-text-main dark:text-white">Scan #{scanId.slice(0, 8).toUpperCase()}</span>
      </motion.div>

      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-gray-400">description</span>
            <div>
              <h1 className="font-display text-xl md:text-2xl font-bold text-text-main dark:text-white">
                Scan Results — {file?.filename || 'Unknown'}
              </h1>
              <p className="font-mono text-[10px] text-text-muted dark:text-gray-500 mt-0.5 tracking-wider">
                ID: {scanId.slice(0, 16)} • Started: {new Date(scan.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-[9px] font-mono text-gray-400 uppercase tracking-wider mb-1">Status</p>
              <div className="flex items-center gap-1.5">
                {scan.status === 'running' && (
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="material-icons text-blue-500 text-xs">sync</motion.span>
                )}
                <span className={`font-mono text-xs font-bold ${
                  scan.status === 'completed' ? 'text-green-500' :
                  scan.status === 'running' ? 'text-blue-500' : 'text-red-500'
                }`}>
                  ● {scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}
                </span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-mono text-gray-400 uppercase tracking-wider mb-1">Duration</p>
              <span className="font-display text-sm font-bold text-text-main dark:text-white">{scan.duration_seconds || 0}s</span>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-mono text-gray-400 uppercase tracking-wider mb-1">Threat Level</p>
              <span className={`font-mono text-xs font-bold ${threatLevel.color}`}>● {threatLevel.label}</span>
            </div>
          </div>
        </div>

        {/* Threat Score Bar */}
        <div className={`p-4 border ${threatScore > 0 ? threatLevel.border : 'border-green-500'} bg-gray-50 dark:bg-gray-900/50`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-display text-sm font-bold text-text-main dark:text-white uppercase tracking-wider">Threat Score</span>
            <span className={`font-display text-xl font-bold ${threatScore > 0 ? threatLevel.color : 'text-green-500'}`}>
              {threatScore}/100 {threatScore >= 67 ? 'MALICIOUS' : threatScore >= 34 ? 'SUSPICIOUS' : 'CLEAN'}
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${threatScore}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className={`h-full ${threatScore > 0 ? threatLevel.bg : 'bg-green-500'}`}
              style={{
                backgroundImage: threatScore >= 67
                  ? 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.15) 8px)'
                  : 'none',
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-all duration-200 whitespace-nowrap ${
              activeTab === tab
                ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-text-main dark:text-white font-bold border-b-transparent -mb-px relative z-10'
                : 'border-transparent text-text-muted dark:text-gray-500 hover:text-primary'
            }`}
          >
            [{tab}]
          </button>
        ))}
      </div>

      {/* Main Content — 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">

          {/* File Metadata */}
          {(activeTab === 'Overview' || activeTab === 'PE Headers') && file && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-panel border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-bold text-text-main dark:text-white">File Metadata</h3>
                <span className="material-symbols-outlined text-sm text-gray-400">info</span>
              </div>
              <div className="space-y-3 font-mono text-xs">
                {[
                  { label: 'Name:', value: file.filename },
                  { label: 'Size:', value: `${(file.file_size / (1024*1024)).toFixed(1)} MB (${file.file_size.toLocaleString()} bytes)` },
                  { label: 'SHA-256:', value: file.file_hash_sha256 || 'N/A', mono: true },
                  { label: 'Type:', value: file.mime_type || 'Unknown' },
                ].map((row, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-text-muted dark:text-gray-500 w-20 shrink-0">{row.label}</span>
                    <span className={`text-text-main dark:text-white ${row.mono ? 'break-all' : ''}`}>{row.value}</span>
                  </div>
                ))}
                <div className="flex gap-4 items-center">
                  <span className="text-text-muted dark:text-gray-500 w-20 shrink-0">Entropy:</span>
                  <span className="text-text-main dark:text-white">{file.entropy?.toFixed(2) || 'N/A'}</span>
                  {file.entropy && file.entropy > 7 && (
                    <span className="px-2 py-0.5 text-[9px] font-bold tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">
                      HIGH — LIKELY PACKED
                    </span>
                  )}
                  {file.entropy && file.entropy > 6 && file.entropy <= 7 && (
                    <span className="px-2 py-0.5 text-[9px] font-bold tracking-wider bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                      MODERATE
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════ ML Predictions ═══════════════ */}
          {(activeTab === 'Overview' || activeTab === 'ML Results') && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-panel border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-base font-bold text-text-main dark:text-white">ML Predictions</h3>
                <span className="material-symbols-outlined text-sm text-gray-400">smart_toy</span>
              </div>
              {mlFindings.length > 0 ? (
                <div className="space-y-4">
                  {mlFindings.map((f) => (
                    <div key={f.id} className="border-l-2 pl-4 py-2" style={{ borderColor: f.severity === 'high' || f.severity === 'critical' ? '#ef4444' : f.severity === 'medium' ? '#f59e0b' : '#22c55e' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${getSeverityDot(f.severity)}`} />
                        <span className="font-mono text-sm font-bold text-text-main dark:text-white">{f.title}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-bold tracking-wider border ${getSeverityBadge(f.severity)}`}>
                          {f.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-text-muted dark:text-gray-500 ml-4">
                        {f.description}
                        {f.confidence != null && ` (${(f.confidence * 100).toFixed(1)}% confidence)`}
                      </p>
                      {(f.details?.reasons as string[] | undefined) && (
                        <div className="ml-4 mt-2 space-y-1">
                          {(f.details?.reasons as string[] || []).map((r, i) => (
                            <p key={i} className="font-mono text-[10px] text-yellow-500">▸ {r}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 py-3">
                  <span className="material-symbols-outlined text-green-500">check_circle</span>
                  <span className="font-mono text-sm text-green-500">No ML-based threats detected</span>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════ YARA Matches ═══════════════ */}
          {(activeTab === 'Overview' || activeTab === 'YARA Matches') && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-panel border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-base font-bold text-text-main dark:text-white">YARA Matches ({yaraFindings.length})</h3>
                <span className="material-symbols-outlined text-sm text-gray-400">policy</span>
              </div>
              {yaraFindings.length > 0 ? (
                <div className="space-y-4">
                  {yaraFindings.map((f, i) => (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="border-l-2 pl-4 py-2"
                      style={{ borderColor: f.severity === 'high' || f.severity === 'critical' ? '#ef4444' : f.severity === 'medium' ? '#f59e0b' : '#22c55e' }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${getSeverityDot(f.severity)}`} />
                        <span className="font-mono text-sm font-bold text-text-main dark:text-white">rule {f.title}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-bold tracking-wider border ${getSeverityBadge(f.severity)}`}>
                          {f.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-text-muted dark:text-gray-500 ml-4">| {f.description}</p>
                      {f.rule_matches && f.rule_matches.length > 0 && (
                        <div className="ml-4 mt-2">
                          {f.rule_matches.map((rm, ri) => (
                            <p key={ri} className="font-mono text-[10px] text-yellow-500">
                              ▸ Matched: {rm.rule_name} ({rm.matched_strings?.length || 0} strings)
                            </p>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 py-3">
                  <span className="material-symbols-outlined text-green-500">check_circle</span>
                  <span className="font-mono text-sm text-green-500">No YARA rule matches found</span>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════ Entropy Analysis ═══════════════ */}
          {(activeTab === 'Entropy') && file && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-panel border border-gray-200 dark:border-gray-700 p-6"
            >
              <h3 className="font-display text-base font-bold text-text-main dark:text-white mb-4">Entropy Analysis</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-text-muted dark:text-gray-400">File Entropy</span>
                  <span className="font-display text-2xl font-bold text-text-main dark:text-white">{file.entropy?.toFixed(4) || 'N/A'}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((file.entropy || 0) / 8) * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full ${(file.entropy || 0) > 7 ? 'bg-red-500' : (file.entropy || 0) > 6 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  />
                </div>
                <p className="font-mono text-[10px] text-gray-400">
                  {(file.entropy || 0) > 7 ? 'High entropy suggests packing, encryption, or compression.' :
                   (file.entropy || 0) > 6 ? 'Moderate entropy — normal for compiled binaries.' :
                   'Low entropy — typical for text/data files.'}
                </p>
              </div>
              {/* Entropy findings */}
              {entropyFindings.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-mono text-xs font-bold text-text-main dark:text-white uppercase tracking-wider">Findings</h4>
                  {entropyFindings.map((f) => (
                    <div key={f.id} className="flex items-start gap-2 py-1">
                      <span className={`w-2 h-2 rounded-full mt-1 ${getSeverityDot(f.severity)}`} />
                      <div>
                        <p className="font-mono text-xs text-text-main dark:text-white">{f.title}</p>
                        <p className="font-mono text-[10px] text-text-muted dark:text-gray-500">{f.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════ PE Headers ═══════════════ */}
          {activeTab === 'PE Headers' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-panel border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-bold text-text-main dark:text-white">PE Header Analysis</h3>
                <span className="material-symbols-outlined text-sm text-gray-400">memory</span>
              </div>
              {peFindings.length > 0 ? (
                <div className="space-y-4">
                  {peFindings.map((f) => (
                    <div key={f.id} className="border-l-2 pl-4 py-2" style={{ borderColor: f.severity === 'high' || f.severity === 'critical' ? '#ef4444' : f.severity === 'medium' ? '#f59e0b' : '#22c55e' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${getSeverityDot(f.severity)}`} />
                        <span className="font-mono text-sm font-bold text-text-main dark:text-white">{f.title}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-bold tracking-wider border ${getSeverityBadge(f.severity)}`}>
                          {f.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-text-muted dark:text-gray-500 ml-4">{f.description}</p>
                      {f.details?.suspicious_apis && (
                        <div className="ml-4 mt-2 flex flex-wrap gap-1">
                          {(f.details.suspicious_apis as string[]).map((api, i) => (
                            <span key={i} className="px-2 py-0.5 text-[9px] font-mono bg-red-500/10 text-red-400 border border-red-400/20">{api}</span>
                          ))}
                        </div>
                      )}
                      {f.details?.pe_info?.sections && (
                        <div className="ml-4 mt-3">
                          <p className="font-mono text-[10px] text-text-muted dark:text-gray-500 mb-1">PE Sections:</p>
                          <div className="space-y-1">
                            {(f.details.pe_info.sections as PeSection[]).map((sec: PeSection, i: number) => (
                              <div key={i} className="flex items-center gap-3 font-mono text-[10px]">
                                <span className="text-text-main dark:text-white w-16">{sec.name}</span>
                                <span className="text-text-muted dark:text-gray-500">Entropy: {sec.entropy?.toFixed(2)}</span>
                                <span className="text-text-muted dark:text-gray-500">Size: {sec.size?.toLocaleString()}</span>
                                {sec.entropy > 7.5 && (
                                  <span className="px-1 py-0.5 text-[8px] bg-red-500/10 text-red-500 border border-red-500/20">PACKED</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 py-3">
                  <span className="material-symbols-outlined text-green-500">check_circle</span>
                  <span className="font-mono text-sm text-green-500">No PE header anomalies detected</span>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════ Steganography Analysis ═══════════════ */}
          {activeTab === 'Steganography' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-panel border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-bold text-text-main dark:text-white">Steganography Analysis</h3>
                <span className="material-symbols-outlined text-sm text-gray-400">image_search</span>
              </div>
              {stegoFindings.length > 0 ? (
                <div className="space-y-4">
                  {stegoFindings.map((f) => (
                    <div key={f.id} className="border-l-2 border-red-500 pl-4 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${getSeverityDot(f.severity)}`} />
                        <span className="font-mono text-sm font-bold text-text-main dark:text-white">{f.title}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-bold tracking-wider border ${getSeverityBadge(f.severity)}`}>
                          {f.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-text-muted dark:text-gray-500 ml-4">{f.description}</p>
                      {f.details?.stego_analysis && (
                        <div className="ml-4 mt-3 space-y-2">
                          <div className="flex items-center gap-4 font-mono text-[10px]">
                            <span className="text-text-muted dark:text-gray-500">Confidence:</span>
                            <div className="flex items-center gap-2 flex-1">
                              <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                <div className="h-full bg-red-500" style={{ width: `${(f.details.stego_analysis.confidence || 0) * 100}%` }} />
                              </div>
                              <span className="text-red-400">{((f.details.stego_analysis.confidence || 0) * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 font-mono text-[10px]">
                            <span className="text-text-muted dark:text-gray-500">Method:</span>
                            <span className="text-yellow-500 font-bold">{f.details.stego_analysis.method || 'Unknown'}</span>
                          </div>
                          {f.details.stego_analysis.indicators && (
                            <div className="mt-1 space-y-1">
                              {(f.details.stego_analysis.indicators as string[]).map((ind, i) => (
                                <p key={i} className="font-mono text-[10px] text-yellow-500">▸ {ind}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 py-3">
                  <span className="material-symbols-outlined text-green-500">check_circle</span>
                  <span className="font-mono text-sm text-green-500">
                    {file?.mime_type?.startsWith('image') ? 'No hidden data detected in image' : 'File is not an image — steganography analysis skipped'}
                  </span>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════ Network Analysis ═══════════════ */}
          {activeTab === 'Network' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-panel border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-bold text-text-main dark:text-white">Network Traffic Analysis</h3>
                <span className="material-symbols-outlined text-sm text-gray-400">lan</span>
              </div>
              {networkFindings.length > 0 ? (
                <div className="space-y-4">
                  {networkFindings.map((f) => (
                    <div key={f.id} className="border-l-2 pl-4 py-2" style={{ borderColor: f.severity === 'critical' ? '#ef4444' : f.severity === 'high' ? '#ef4444' : '#f59e0b' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${getSeverityDot(f.severity)}`} />
                        <span className="font-mono text-sm font-bold text-text-main dark:text-white">{f.title}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-bold tracking-wider border ${getSeverityBadge(f.severity)}`}>
                          {f.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-text-muted dark:text-gray-500 ml-4">{f.description}</p>
                      {f.details?.suspicious_dns && (
                        <div className="ml-4 mt-2">
                          <p className="font-mono text-[10px] text-text-muted dark:text-gray-500 mb-1">Suspicious DNS:</p>
                          {(f.details.suspicious_dns as string[]).map((dns, i) => (
                            <p key={i} className="font-mono text-[10px] text-red-400">▸ {dns}</p>
                          ))}
                        </div>
                      )}
                      {f.details?.iocs_found && (
                        <div className="ml-4 mt-2">
                          <p className="font-mono text-[10px] text-text-muted dark:text-gray-500 mb-1">IOCs Detected:</p>
                          {(f.details.iocs_found as string[]).map((ioc, i) => (
                            <p key={i} className="font-mono text-[10px] text-red-400">▸ {ioc}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 py-3">
                  <span className="material-symbols-outlined text-green-500">check_circle</span>
                  <span className="font-mono text-sm text-green-500">
                    {file?.filename?.match(/\.(pcap|pcapng|cap)$/i) ? 'No network anomalies detected' : 'File is not a PCAP — network analysis skipped'}
                  </span>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════ Strings Analysis ═══════════════ */}
          {activeTab === 'Strings' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-panel border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-bold text-text-main dark:text-white">String Extraction</h3>
                <span className="material-symbols-outlined text-sm text-gray-400">text_snippet</span>
              </div>
              {/* Strings come from scan findings or as metadata — find the matching entry */}
              {(() => {
                // Look for string data in the scan response findings details
                const strFinding = scan.findings.find(f => f.details?.strings);
                const strData = strFinding?.details?.strings;
                if (!strData) {
                  return (
                    <div className="flex items-center gap-3 py-3">
                      <span className="material-symbols-outlined text-green-500">check_circle</span>
                      <span className="font-mono text-sm text-green-500">No suspicious strings found in file</span>
                    </div>
                  );
                }
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Total Strings', value: strData.total_strings || 0, icon: 'numbers' },
                        { label: 'Suspicious', value: (strData.suspicious_strings || []).length, icon: 'warning', danger: true },
                        { label: 'URLs Found', value: (strData.urls || []).length, icon: 'link' },
                        { label: 'IPs Found', value: (strData.ips || []).length, icon: 'dns' },
                      ].map((stat, i) => (
                        <div key={i} className="p-3 border border-gray-200 dark:border-gray-700 text-center">
                          <span className={`material-symbols-outlined text-sm ${stat.danger ? 'text-yellow-500' : 'text-gray-400'}`}>{stat.icon}</span>
                          <p className={`font-display text-lg font-bold ${stat.danger && stat.value > 0 ? 'text-yellow-500' : 'text-text-main dark:text-white'}`}>{stat.value}</p>
                          <p className="font-mono text-[9px] text-text-muted dark:text-gray-500 uppercase tracking-wider">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                    {(strData.urls || []).length > 0 && (
                      <div>
                        <h4 className="font-mono text-xs font-bold text-text-main dark:text-white mb-2 uppercase tracking-wider">URLs</h4>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {(strData.urls || []).map((url: string, i: number) => (
                            <p key={i} className="font-mono text-[10px] text-yellow-500 break-all">▸ {url}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    {(strData.ips || []).length > 0 && (
                      <div>
                        <h4 className="font-mono text-xs font-bold text-text-main dark:text-white mb-2 uppercase tracking-wider">IP Addresses</h4>
                        <div className="flex flex-wrap gap-1">
                          {(strData.ips || []).map((ip: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 text-[9px] font-mono bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">{ip}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(strData.emails || []).length > 0 && (
                      <div>
                        <h4 className="font-mono text-xs font-bold text-text-main dark:text-white mb-2 uppercase tracking-wider">Email Addresses</h4>
                        <div className="space-y-1">
                          {(strData.emails || []).map((email: string, i: number) => (
                            <p key={i} className="font-mono text-[10px] text-blue-400">▸ {email}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    {(strData.registry_keys || []).length > 0 && (
                      <div>
                        <h4 className="font-mono text-xs font-bold text-text-main dark:text-white mb-2 uppercase tracking-wider">Registry Keys</h4>
                        <div className="space-y-1">
                          {(strData.registry_keys || []).map((key: string, i: number) => (
                            <p key={i} className="font-mono text-[10px] text-red-400 break-all">▸ {key}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    {(strData.suspicious_strings || []).length > 0 && (
                      <div>
                        <h4 className="font-mono text-xs font-bold text-text-main dark:text-white mb-2 uppercase tracking-wider">Suspicious Strings</h4>
                        <div className="space-y-1 max-h-60 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 p-3 border border-gray-200 dark:border-gray-700">
                          {(strData.suspicious_strings || []).map((s: string, i: number) => (
                            <p key={i} className="font-mono text-[10px] text-text-main dark:text-gray-300 break-all">{s}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </div>

        {/* Right Column (1/3) — Sidebar */}
        <div className="space-y-6">

          {/* Remediation Card */}
          {highSeverityFindings.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="border border-red-200 dark:border-red-800 overflow-hidden"
            >
              <div className="bg-red-500 px-4 py-2.5">
                <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  Remediation Required
                </h3>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/10">
                <p className="font-mono text-xs text-red-900 dark:text-red-300 mb-3 font-bold">
                  This file is highly suspicious. Recommended actions:
                </p>
                <ol className="list-decimal pl-4 space-y-2 font-mono text-[11px] text-red-800 dark:text-red-400 leading-relaxed">
                  <li>Do <strong>NOT execute</strong> this file on any production system.</li>
                  <li><strong>Quarantine immediately</strong> to prevent lateral movement.</li>
                  <li>Submit hash to VirusTotal for secondary confirmation.</li>
                  <li>Check system logs for related indicators of compromise (IOCs).</li>
                </ol>
                <motion.button
                  whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(239,68,68,0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-4 py-2.5 bg-red-500 text-white font-display font-bold uppercase tracking-[0.15em] text-xs flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">shield</span>
                  Quarantine Now
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="border border-green-200 dark:border-green-800 overflow-hidden"
            >
              <div className="bg-green-500 px-4 py-2.5">
                <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  File Appears Safe
                </h3>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/10">
                <p className="font-mono text-xs text-green-800 dark:text-green-300">
                  No critical or high severity findings detected. This file appears safe for use.
                </p>
              </div>
            </motion.div>
          )}

          {/* Findings Summary sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel border border-gray-200 dark:border-gray-700 p-5"
          >
            <h3 className="font-display text-sm font-bold text-text-main dark:text-white mb-4">Findings Summary</h3>
            <div className="space-y-2">
              {[
                { label: 'ML Predictions', count: mlFindings.length, icon: 'smart_toy' },
                { label: 'YARA Matches', count: yaraFindings.length, icon: 'policy' },
                { label: 'Entropy', count: entropyFindings.length, icon: 'analytics' },
                { label: 'PE Headers', count: peFindings.length, icon: 'memory' },
                { label: 'Steganography', count: stegoFindings.length, icon: 'image_search' },
                { label: 'Network', count: networkFindings.length, icon: 'lan' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between font-mono text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs text-gray-400">{item.icon}</span>
                    <span className="text-text-muted dark:text-gray-500">{item.label}</span>
                  </div>
                  <span className={`font-bold ${item.count > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                    {item.count > 0 ? item.count : '✓'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Scan Config sidebar */}
          {scan.options && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-panel border border-gray-200 dark:border-gray-700 p-5"
            >
              <h3 className="font-display text-sm font-bold text-text-main dark:text-white mb-4">Scan Configuration</h3>
              <div className="space-y-2">
                {[
                  { label: 'ML Detection', enabled: opts.enable_ml !== false },
                  { label: 'YARA Matching', enabled: opts.enable_yara !== false },
                  { label: 'Entropy Analysis', enabled: opts.enable_entropy !== false },
                  { label: 'PE Inspection', enabled: opts.enable_pe !== false },
                  { label: 'Steganography', enabled: !!opts.enable_stego },
                  { label: 'Network/PCAP', enabled: !!opts.enable_pcap },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-text-muted dark:text-gray-500">{item.label}</span>
                    <span className={`font-bold ${item.enabled ? 'text-green-500' : 'text-gray-400'}`}>
                      {item.enabled ? 'ON' : 'OFF'}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="space-y-2"
          >
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportPdf}
              disabled={exporting}
              className="w-full py-2.5 glass-panel border border-gray-200 dark:border-gray-700 font-display font-bold text-xs uppercase tracking-wider text-text-main dark:text-white hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">{exporting ? 'hourglass_empty' : 'download'}</span>
              {exporting ? 'Generating PDF...' : 'Export PDF Report'}
            </motion.button>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleShareLink}
              disabled={shareLoading}
              className="w-full py-2.5 glass-panel border border-gray-200 dark:border-gray-700 font-display font-bold text-xs uppercase tracking-wider text-text-main dark:text-white hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">{shareLoading ? 'hourglass_empty' : 'share'}</span>
              {shareLoading ? 'Creating Link...' : 'Share Report Link'}
            </motion.button>
          </motion.div>

          {/* Share Modal */}
          <AnimatePresence>
            {shareModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShareModal(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full shadow-2xl"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-base font-bold text-text-main dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">share</span>
                      Share Report
                    </h3>
                    <button onClick={() => setShareModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                  <p className="font-mono text-[11px] text-text-muted dark:text-gray-500 mb-4">
                    Anyone with this link can view the scan results (expires in 7 days).
                  </p>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 font-mono text-[11px] text-text-main dark:text-white rounded-none"
                    />
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={copyToClipboard}
                      className={`px-4 py-2 font-display font-bold text-xs uppercase tracking-wider flex items-center gap-1 transition-all ${
                        copied
                          ? 'bg-green-500 text-white'
                          : 'bg-primary text-white hover:bg-green-600'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
                      {copied ? 'Copied!' : 'Copy'}
                    </motion.button>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted dark:text-gray-500">
                    <span className="material-symbols-outlined text-xs">schedule</span>
                    Link expires in 7 days
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 pb-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          <span className="text-[10px] font-mono text-gray-400 dark:text-gray-600">System Operational | v2.4.1-stable</span>
        </div>
        <span className="text-[10px] font-mono text-gray-400 dark:text-gray-600">© 2026 ThreatForge. Internal Use Only.</span>
      </div>
    </div>
  );
}
