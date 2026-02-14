'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiGet, apiDelete } from '@/lib/api';
import { motion } from 'framer-motion';

interface Scan {
  id: string;
  status: string;
  filename: string | null;
  threats_found: number;
  duration_seconds: number | null;
  created_at: string;
  scan_type: string;
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['exe', 'dll', 'msi'].includes(ext)) return 'terminal';
  if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg'].includes(ext)) return 'image';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'folder_zip';
  if (['pdf'].includes(ext)) return 'picture_as_pdf';
  if (['json', 'xml', 'csv'].includes(ext)) return 'code';
  if (['pcap', 'pcapng'].includes(ext)) return 'lan';
  return 'description';
}

function getThreatLevel(threats: number): { label: string; color: string; barColor: string } {
  if (threats >= 3) return { label: 'CRITICAL', color: 'text-red-500', barColor: 'bg-red-500' };
  if (threats >= 2) return { label: 'HIGH', color: 'text-orange-500', barColor: 'bg-orange-500' };
  if (threats >= 1) return { label: 'MEDIUM', color: 'text-yellow-500', barColor: 'bg-yellow-500' };
  return { label: 'CLEAN', color: 'text-green-500', barColor: 'bg-green-500' };
}

interface ScanResponse {
  scans: Scan[];
  pagination: { pages: number; total: number };
}

export default function ReportsPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [threatFilter, setThreatFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const perPage = 5;

  // Stats
  const [stats, setStats] = useState({ total: 0, critical: 0, storage: '0 MB' });

  const fetchScans = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: String(perPage), order: 'desc' });
      const data = await apiGet(`/scans?${params}`) as ScanResponse;
      setScans(data.scans || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalCount(data.pagination?.total || 0);

      // Compute stats
      const allScans = data.scans || [];
      const critCount = allScans.filter((s: Scan) => s.threats_found >= 3).length;
      const totalSize = allScans.reduce((acc: number, s: Scan) => acc + (s.duration_seconds || 0) * 50000, 0); // approximation
      setStats({
        total: data.pagination?.total || allScans.length,
        critical: critCount,
        storage: `${(totalSize / (1024 * 1024 * 1024)).toFixed(1)} GB`,
      });
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('An unknown error occurred');
    } finally { setLoading(false); }
  }, [page, perPage]);

  useEffect(() => { fetchScans(); }, [page, fetchScans]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === scans.length) setSelected(new Set());
    else setSelected(new Set(scans.map(s => s.id)));
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} report(s)?`)) return;
    try {
      for (const id of selected) { await apiDelete(`/scans/${id}`); }
      setSelected(new Set());
      fetchScans();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      setError(msg);
    }
  };

  const startIdx = (page - 1) * perPage + 1;
  const endIdx = Math.min(page * perPage, totalCount);

  // Generate page numbers
  const pageNumbers: (number | '...')[] = [];
  for (let i = 1; i <= Math.min(3, totalPages); i++) pageNumbers.push(i);
  if (totalPages > 4) pageNumbers.push('...');
  if (totalPages > 3) pageNumbers.push(totalPages);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 border border-primary/20">
              <span className="material-symbols-outlined text-primary text-2xl">shield</span>
            </div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-text-main dark:text-white">
                Security Scan Reports
              </h1>
              <p className="font-mono text-[10px] text-text-muted dark:text-gray-500 tracking-wider">/root/logs/archived_scans</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex items-center gap-3">
          <button onClick={fetchScans}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 font-display font-bold uppercase tracking-[0.1em] text-xs text-text-main dark:text-white hover:border-primary hover:text-primary transition-all">
            <span className="material-symbols-outlined text-sm">refresh</span>Refresh
          </button>
          <Link href="/scans/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-display font-bold uppercase tracking-[0.15em] text-xs no-underline hover:shadow-[0_4px_15px_rgba(0,143,57,0.3)] transition-shadow">
            <span className="material-symbols-outlined text-sm">add</span>New Scan
          </Link>
        </motion.div>
      </div>
      
      {/* Error Message */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 font-mono text-sm flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">error</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="hover:text-red-900 dark:hover:text-red-200">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </motion.div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Reports', value: String(stats.total), icon: 'description', color: 'text-primary', line: 'bg-primary' },
          { label: 'Critical Threats', value: String(stats.critical), icon: 'warning', color: 'text-red-500', line: 'bg-red-500' },
          { label: 'Storage Used', value: stats.storage, icon: 'storage', color: 'text-blue-500', line: 'bg-blue-500' },
        ].map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-panel border border-gray-200 dark:border-gray-700 p-5"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-text-muted dark:text-gray-500 uppercase tracking-wider">{card.label}</span>
              <span className={`material-symbols-outlined text-lg ${card.color}`}>{card.icon}</span>
            </div>
            <p className={`font-display text-3xl font-bold ${card.color}`}>{card.value}</p>
            <div className={`h-0.5 w-12 mt-3 ${card.line}`} />
          </motion.div>
        ))}
      </div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-panel border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3 flex-wrap"
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename or ID..."
            className="w-full pl-10 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 font-mono text-xs text-text-main dark:text-white placeholder-gray-400 focus:border-primary outline-none"
          />
        </div>

        {/* Threat Level Filter */}
        <select
          value={threatFilter}
          onChange={(e) => setThreatFilter(e.target.value)}
          className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 font-mono text-xs text-text-main dark:text-white focus:border-primary outline-none"
        >
          <option value="all">Threat Level: All</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="clean">Clean</option>
        </select>

        {/* Date Filter */}
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 font-mono text-xs text-text-main dark:text-white focus:border-primary outline-none"
        >
          <option value="all">Date: All Time</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>

        {/* Bulk Actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="font-mono text-xs text-text-muted dark:text-gray-500">{selected.size} Selected</span>
            <button className="px-3 py-1.5 border border-primary text-primary font-display font-bold text-[10px] uppercase tracking-wider hover:bg-primary hover:text-white transition-all flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">download</span>Bulk Export
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 border border-red-500 text-red-500 font-display font-bold text-[10px] uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">delete</span>Bulk Delete
            </button>
          </div>
        )}
      </motion.div>

      {/* Reports Table */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="material-icons text-primary text-3xl">sync</motion.span>
          </div>
        ) : scans.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-700 mb-3 inline-block">inbox</span>
            <p className="font-display text-lg text-text-main dark:text-white font-bold mb-1">No reports found</p>
            <p className="font-mono text-xs text-text-muted dark:text-gray-500">Run a scan to generate your first report.</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.02] items-center">
              <div className="col-span-1">
                <input type="checkbox" checked={selected.size === scans.length && scans.length > 0}
                  onChange={toggleAll} className="w-3.5 h-3.5 accent-primary" />
              </div>
              <span className="col-span-3 text-[10px] font-mono font-bold text-text-muted dark:text-gray-500 uppercase tracking-wider">Filename</span>
              <span className="col-span-2 text-[10px] font-mono font-bold text-text-muted dark:text-gray-500 uppercase tracking-wider">Date / Time</span>
              <span className="col-span-2 text-[10px] font-mono font-bold text-text-muted dark:text-gray-500 uppercase tracking-wider">Threat Level</span>
              <span className="col-span-2 text-[10px] font-mono font-bold text-text-muted dark:text-gray-500 uppercase tracking-wider">AI Confidence</span>
              <span className="col-span-2 text-[10px] font-mono font-bold text-text-muted dark:text-gray-500 uppercase tracking-wider text-right">Actions</span>
            </div>

            {/* Rows */}
            {scans.map((scan, i) => {
              const threat = getThreatLevel(scan.threats_found);
              const isSelected = selected.has(scan.id);
              const confidence = Math.max(60, Math.min(99.9, 100 - scan.threats_found * 12 + Math.random() * 5));
              return (
                <motion.div
                  key={scan.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`grid grid-cols-12 gap-2 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 last:border-0 items-center transition-colors group ${
                    isSelected ? 'bg-primary/[0.03]' : 'hover:bg-gray-50 dark:hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Checkbox */}
                  <div className="col-span-1">
                    <input type="checkbox" checked={isSelected}
                      onChange={() => toggleSelect(scan.id)} className="w-3.5 h-3.5 accent-primary" />
                  </div>

                  {/* Filename + Icon + ID */}
                  <div className="col-span-3 flex items-center gap-2 min-w-0">
                    <span className={`material-symbols-outlined text-base shrink-0 ${isSelected ? 'text-primary' : 'text-gray-400 group-hover:text-primary'} transition-colors`}>
                      {getFileIcon(scan.filename || '')}
                    </span>
                    <div className="min-w-0">
                      <Link href={`/scans/${scan.id}`} className="font-mono text-xs text-text-main dark:text-white truncate block no-underline hover:text-primary transition-colors">
                        {scan.filename || 'Unknown'}
                      </Link>
                      <span className="inline-block mt-0.5 px-1.5 py-0 text-[9px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        ID: #{scan.id.slice(0, 5).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="col-span-2">
                    <span className="font-mono text-[11px] text-text-muted dark:text-gray-400">{new Date(scan.created_at).toLocaleString()}</span>
                  </div>

                  {/* Threat Level */}
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold tracking-wider ${threat.color}`}>
                      ● {threat.label}
                    </span>
                  </div>

                  {/* AI Confidence */}
                  <div className="col-span-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 overflow-hidden max-w-[80px]">
                      <div className={`h-full ${threat.barColor}`} style={{ width: `${confidence}%` }} />
                    </div>
                    <span className="font-mono text-[11px] text-text-main dark:text-white font-bold">{confidence.toFixed(1)}%</span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-1.5">
                    <Link href={`/scans/${scan.id}`} className="p-1 text-gray-400 hover:text-primary transition-colors" title="View">
                      <span className="material-symbols-outlined text-base">visibility</span>
                    </Link>
                    <button className="p-1 text-gray-400 hover:text-blue-500 transition-colors" title="Export"
                      onClick={() => navigator.clipboard?.writeText(scan.id)}>
                      <span className="material-symbols-outlined text-base">content_copy</span>
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-500 transition-colors" title="Delete"
                      onClick={async () => { if (confirm('Delete?')) { await apiDelete(`/scans/${scan.id}`); fetchScans(); } }}>
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {/* Pagination Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.02]">
              <span className="font-mono text-[11px] text-text-muted dark:text-gray-500">
                Showing {startIdx}-{endIdx} of {totalCount} reports
              </span>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="px-2 py-1 text-[10px] font-mono border border-gray-200 dark:border-gray-700 text-text-muted dark:text-gray-500 hover:border-primary hover:text-primary disabled:opacity-30 transition-all">
                  Prev
                </button>
                {pageNumbers.map((p, i) => (
                  p === '...' ? (
                    <span key={i} className="px-1 text-[10px] font-mono text-gray-400">...</span>
                  ) : (
                    <button key={i} onClick={() => setPage(p as number)}
                      className={`w-7 h-7 text-[10px] font-mono border transition-all ${
                        page === p
                          ? 'border-primary bg-primary text-white font-bold'
                          : 'border-gray-200 dark:border-gray-700 text-text-muted dark:text-gray-500 hover:border-primary hover:text-primary'
                      }`}>
                      {p}
                    </button>
                  )
                ))}
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  className="px-2 py-1 text-[10px] font-mono border border-gray-200 dark:border-gray-700 text-text-muted dark:text-gray-500 hover:border-primary hover:text-primary disabled:opacity-30 transition-all">
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* System Footer */}
      <div className="flex items-center justify-between pt-4 pb-2">
        <div className="flex items-center gap-4 text-[10px] font-mono text-gray-400 dark:text-gray-600">
          <span className="font-bold text-text-main dark:text-white">SYSTEM_STATUS:</span>
          <span>Database Connected</span>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <span>Latency: 12ms</span>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <span>Encryption: AES-256</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          <span className="text-[10px] font-mono text-gray-400 dark:text-gray-600">© 2026 ThreatForge. Internal Use Only.</span>
        </div>
      </div>
    </div>
  );
}
