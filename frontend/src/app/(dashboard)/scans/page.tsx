'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiGet, apiDelete } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface Scan {
  id: string; status: string; filename: string | null; threats_found: number;
  duration_seconds: number | null; created_at: string; scan_type: string;
}

function getStatusStyle(s: string) {
  switch (s) {
    case 'completed': return 'text-green-500 bg-green-500/10 border-green-500/20';
    case 'running': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    case 'failed': return 'text-red-500 bg-red-500/10 border-red-500/20';
    default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
  }
}

export default function ScansPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  const fetchScans = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: '10' });
      if (statusFilter) params.set('status', statusFilter);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await apiGet(`/scans?${params}`) as any;
      setScans(data.scans);
      setTotalPages(data.pagination.pages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load scans';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchScans(); }, [fetchScans]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this scan?')) return;
    try {
      await apiDelete(`/scans/${id}`);
      fetchScans();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      setError(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-2xl md:text-3xl font-bold text-text-main dark:text-white uppercase tracking-wider">
            Scan History
          </h1>
          <p className="font-mono text-xs text-text-muted dark:text-gray-500 mt-1">
            View and manage your past threat analysis operations.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link
            href="/scans/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-display font-bold uppercase tracking-[0.15em] text-xs no-underline hover:shadow-[0_4px_15px_rgba(0,143,57,0.3)] transition-shadow"
          >
            <span className="material-symbols-outlined text-sm">search</span>
            New Scan
          </Link>
        </motion.div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-mono flex items-center gap-2"
          >
            <span className="material-icons text-sm">error_outline</span>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Row */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono text-text-muted dark:text-gray-500 uppercase tracking-wider">Filter:</span>
        {['', 'completed', 'running', 'failed'].map((f) => (
          <button
            key={f}
            onClick={() => { setStatusFilter(f); setPage(1); }}
            className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider border transition-all duration-200 ${
              statusFilter === f
                ? 'border-primary bg-primary/5 text-primary font-bold'
                : 'border-gray-200 dark:border-gray-700 text-text-muted dark:text-gray-500 hover:border-primary/50'
            }`}
          >
            {f || 'All'}
          </button>
        ))}
      </div>

      {/* Scans Table */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-panel border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="material-icons text-primary text-3xl"
            >sync</motion.span>
          </div>
        ) : scans.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-700 mb-3 inline-block">inbox</span>
            <p className="font-display text-lg text-text-main dark:text-white font-bold mb-1">No scans found</p>
            <p className="font-mono text-xs text-text-muted dark:text-gray-500 mb-4">Start your first threat analysis operation.</p>
            <Link
              href="/scans/new"
              className="inline-flex items-center gap-2 px-4 py-2 border border-primary text-primary font-display font-bold uppercase tracking-[0.1em] text-xs no-underline hover:bg-primary hover:text-white transition-all"
            >
              <span className="material-symbols-outlined text-sm">search</span>
              Start Scan
            </Link>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.02]">
              <span className="col-span-4 text-[10px] font-mono font-bold text-text-muted dark:text-gray-500 uppercase tracking-wider">File</span>
              <span className="col-span-2 text-[10px] font-mono font-bold text-text-muted dark:text-gray-500 uppercase tracking-wider">Status</span>
              <span className="col-span-1 text-[10px] font-mono font-bold text-text-muted dark:text-gray-500 uppercase tracking-wider">Threats</span>
              <span className="col-span-1 text-[10px] font-mono font-bold text-text-muted dark:text-gray-500 uppercase tracking-wider hidden md:block">Time</span>
              <span className="col-span-2 text-[10px] font-mono font-bold text-text-muted dark:text-gray-500 uppercase tracking-wider">Date</span>
              <span className="col-span-2 text-[10px] font-mono font-bold text-text-muted dark:text-gray-500 uppercase tracking-wider text-right">Actions</span>
            </div>

            {/* Rows */}
            {scans.map((scan, i) => (
              <motion.div
                key={scan.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group items-center"
              >
                {/* File */}
                <div className="col-span-4 flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-sm text-gray-400 group-hover:text-primary transition-colors shrink-0">description</span>
                  <Link href={`/scans/${scan.id}`} className="font-mono text-xs text-text-main dark:text-white truncate no-underline hover:text-primary transition-colors">
                    {scan.filename || 'Unknown'}
                  </Link>
                </div>
                {/* Status */}
                <div className="col-span-2">
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider border ${getStatusStyle(scan.status)}`}>
                    {scan.status.toUpperCase()}
                  </span>
                </div>
                {/* Threats */}
                <div className="col-span-1">
                  <span className={`font-mono text-xs font-bold ${scan.threats_found > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {scan.threats_found}
                  </span>
                </div>
                {/* Duration */}
                <div className="col-span-1 hidden md:block">
                  <span className="font-mono text-[11px] text-text-muted dark:text-gray-500">
                    {scan.duration_seconds ? `${scan.duration_seconds}s` : '—'}
                  </span>
                </div>
                {/* Date */}
                <div className="col-span-2">
                  <span className="font-mono text-[11px] text-text-muted dark:text-gray-500">
                    {new Date(scan.created_at).toLocaleDateString()}
                  </span>
                </div>
                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <Link
                    href={`/scans/${scan.id}`}
                    className="text-[10px] font-mono text-primary hover:underline no-underline font-bold tracking-wider"
                  >
                    View Report
                  </Link>
                  <button
                    onClick={() => handleDelete(scan.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </motion.div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 py-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider border border-gray-200 dark:border-gray-700 text-text-muted dark:text-gray-500 hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  ← Prev
                </button>
                <span className="text-[10px] font-mono text-text-muted dark:text-gray-500 tracking-wider">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider border border-gray-200 dark:border-gray-700 text-text-muted dark:text-gray-500 hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
