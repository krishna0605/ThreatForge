'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiGet, apiDelete } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface YaraRule {
  id: string; name: string; category: string; severity: string;
  rule_content: string; is_enabled: boolean; is_builtin: boolean;
  created_at: string;
}

function getSeverityStyle(s: string) {
  switch (s) {
    case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
    case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    case 'low': return 'text-green-500 bg-green-500/10 border-green-500/20';
    default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
  }
}

export default function RulesPage() {
  const [rules, setRules] = useState<YaraRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRules = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await apiGet('/rules') as any;
      setRules(data.rules);
      setRules(data.rules);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load rules';
      setError(msg);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchRules(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    try { await apiDelete(`/rules/${id}`); fetchRules(); }
    catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete rule';
      setError(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-text-main dark:text-white uppercase tracking-wider">
            YARA Rules
          </h1>
          <p className="font-mono text-xs text-text-muted dark:text-gray-500 mt-1">
            Create and manage threat detection rules.
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Link
            href="/rules/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-display font-bold uppercase tracking-[0.15em] text-xs no-underline hover:shadow-[0_4px_15px_rgba(0,143,57,0.3)] transition-shadow"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Rule
          </Link>
        </motion.div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-mono flex items-center gap-2">
            <span className="material-icons text-sm">error_outline</span>{error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rules Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            className="material-icons text-primary text-3xl">sync</motion.span>
        </div>
      ) : rules.length === 0 ? (
        <div className="glass-panel border border-gray-200 dark:border-gray-700 text-center py-16">
          <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-700 mb-3 inline-block">gavel</span>
          <p className="font-display text-lg text-text-main dark:text-white font-bold mb-1">No rules found</p>
          <p className="font-mono text-xs text-text-muted dark:text-gray-500 mb-4">Create your first YARA rule to start detecting threats.</p>
          <Link href="/rules/new"
            className="inline-flex items-center gap-2 px-4 py-2 border border-primary text-primary font-display font-bold uppercase tracking-[0.1em] text-xs no-underline hover:bg-primary hover:text-white transition-all">
            <span className="material-symbols-outlined text-sm">add</span>Create Rule
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule, i) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              className="glass-panel border border-gray-200 dark:border-gray-700 p-5 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Link href={`/rules/${rule.id}`} className="font-display text-base font-bold text-text-main dark:text-white no-underline hover:text-primary transition-colors">
                    {rule.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider border ${getSeverityStyle(rule.severity)}`}>
                      {rule.severity.toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider border border-gray-200 dark:border-gray-600 text-text-muted dark:text-gray-500">
                      {rule.category}
                    </span>
                    {rule.is_builtin && (
                      <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider border border-blue-200 dark:border-blue-800 text-blue-500 bg-blue-500/10">
                        BUILTIN
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${rule.is_enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className="text-[10px] font-mono text-text-muted dark:text-gray-500">
                    {rule.is_enabled ? 'Active' : 'Off'}
                  </span>
                </div>
              </div>

              {/* Code Preview */}
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-3 mb-3 overflow-auto max-h-24">
                <pre className="font-mono text-[11px] text-text-muted dark:text-gray-400 whitespace-pre-wrap m-0">{rule.rule_content}</pre>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-gray-400">{new Date(rule.created_at).toLocaleDateString()}</span>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/rules/${rule.id}`}
                    className="text-[10px] font-mono text-primary hover:underline no-underline font-bold tracking-wider">
                    EDIT
                  </Link>
                  {!rule.is_builtin && (
                    <button onClick={() => handleDelete(rule.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 pb-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          <span className="text-[10px] font-mono text-gray-400 dark:text-gray-600">SYSTEM_STATUS: ONLINE // YARA ENGINE v4.3.2</span>
        </div>
        <span className="text-[10px] font-mono text-gray-400 dark:text-gray-600">© 2026 ThreatForge. Internal Use Only.</span>
      </div>
    </div>
  );
}
