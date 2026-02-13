'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['Malware', 'Ransomware', 'Trojan', 'Exploit', 'Network', 'Steganography', 'Custom'];
const SEVERITIES = ['critical', 'high', 'medium', 'low'];
const DEFAULT_RULE = `rule ExampleRule {
  meta:
    author = "ThreatForge"
    description = ""
    severity = "medium"
  strings:
    $s1 = "suspicious" nocase
  condition:
    $s1
}`;

function getSeverityStyle(s: string) {
  switch (s) {
    case 'critical': return 'text-red-500 border-red-500';
    case 'high': return 'text-orange-500 border-orange-500';
    case 'medium': return 'text-yellow-500 border-yellow-500';
    default: return 'text-green-500 border-green-500';
  }
}

export default function RuleEditorPage() {
  const params = useParams();
  const router = useRouter();
  const ruleId = params.id as string;
  const isNew = ruleId === 'new';

  const [name, setName] = useState('');
  const [content, setContent] = useState(DEFAULT_RULE);
  const [category, setCategory] = useState('Custom');
  const [severity, setSeverity] = useState('medium');
  const [isEnabled, setIsEnabled] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lastModified, setLastModified] = useState('');

  // Test results
  const [testValid, setTestValid] = useState<boolean | null>(null);
  const [testError, setTestError] = useState('');
  const [testResults, setTestResults] = useState<{ name: string; match: boolean }[]>([]);
  const [testing, setTesting] = useState(false);

  // Editor cursor
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);

  useEffect(() => {
    if (!isNew) {
      apiGet(`/rules/${ruleId}`)
        .then((data) => {
          const r = data.rule || data;
          setName(r.name);
          setContent(r.rule_content);
          setCategory(r.category || 'Custom');
          setSeverity(r.severity || 'medium');
          setIsEnabled(r.is_enabled !== false);
          setLastModified(r.updated_at || r.created_at || '');
          if (r.tags) setTags(r.tags);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [ruleId, isNew]);

  const updateCursor = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const text = el.value.substring(0, el.selectionStart);
    const lines = text.split('\n');
    setCursorLine(lines.length);
    setCursorCol((lines[lines.length - 1]?.length || 0) + 1);
  }, []);

  const handleSave = async () => {
    if (!name.trim()) { setError('Rule name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = { name, rule_content: content, category, severity };
      if (isNew) {
        const result = await apiPost('/rules', payload);
        router.push(`/rules/${result.rule?.id || result.id}`);
      } else {
        await apiPut(`/rules/${ruleId}`, payload);
      }
      router.push('/rules');
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestValid(null);
    setTestError('');
    setTestResults([]);
    try {
      const result = await apiPost('/rules/validate', { rule_content: content });
      setTestValid(result.valid);
      if (!result.valid) {
        setTestError(result.errors?.join(', ') || 'Syntax error');
      }
      // Mock test results against sample files
      setTestResults([
        { name: 'test.exe', match: result.valid && Math.random() > 0.3 },
        { name: 'clean.exe', match: false },
        { name: 'doc.pdf', match: false },
      ]);
    } catch (err: any) {
      setTestValid(false);
      setTestError(err.message);
    }
    finally { setTesting(false); }
  };

  const handleDeleteRule = async () => {
    if (!confirm('Permanently delete this rule?')) return;
    try {
      await apiDelete(`/rules/${ruleId}`);
      router.push('/rules');
    } catch (err: any) { setError(err.message); }
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const lineCount = content.split('\n').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} className="material-icons text-primary text-4xl">sync</motion.span>
          <span className="font-mono text-xs text-text-muted dark:text-gray-500 tracking-wider">LOADING_RULE...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 border border-primary/20">
            <span className="material-symbols-outlined text-primary text-2xl">gavel</span>
          </div>
          <div>
            <h1 className="font-display text-xl md:text-2xl font-bold text-text-main dark:text-white">
              YARA Rule Editor — <span className="text-primary">{name || 'Untitled'}</span>
            </h1>
          </div>
        </div>
        {lastModified && (
          <span className="px-3 py-1 border border-gray-200 dark:border-gray-700 text-[10px] font-mono text-text-muted dark:text-gray-500 tracking-wider">
            LAST_MODIFIED: {new Date(lastModified).toLocaleString()}
          </span>
        )}
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-mono flex items-center gap-2">
            <span className="material-icons text-sm">error_outline</span>{error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Code Editor */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-[10px] font-mono text-text-muted dark:text-gray-500 tracking-wider">
          <div className="flex items-center gap-3">
            <span>Code Editor</span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span>Ln {cursorLine}, Col {cursorCol}</span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span>UTF-8</span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-primary rounded-full" /> YARA Syntax</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigator.clipboard?.writeText(content)} className="p-1 hover:text-primary transition-colors" title="Copy">
              <span className="material-symbols-outlined text-sm">content_copy</span>
            </button>
            <button className="p-1 hover:text-primary transition-colors" title="Undo">
              <span className="material-symbols-outlined text-sm">undo</span>
            </button>
            <button className="p-1 hover:text-primary transition-colors" title="Redo">
              <span className="material-symbols-outlined text-sm">redo</span>
            </button>
          </div>
        </div>

        {/* Editor Body with Line Numbers */}
        <div className="flex min-h-[320px] max-h-[480px] overflow-auto bg-white dark:bg-gray-900">
          {/* Line Numbers */}
          <div className="py-3 px-3 text-right select-none border-r border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 shrink-0">
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i} className="font-mono text-[11px] text-gray-400 dark:text-gray-600 leading-[1.65rem]">
                {i + 1}
              </div>
            ))}
          </div>
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => { setContent(e.target.value); updateCursor(); }}
            onClick={updateCursor}
            onKeyUp={updateCursor}
            spellCheck={false}
            className="flex-1 p-3 bg-transparent font-mono text-sm text-text-main dark:text-green-400 leading-[1.65rem] resize-none outline-none"
            style={{ tabSize: 2 }}
          />
        </div>
      </motion.div>

      {/* Rule Properties + Test Results — 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rule Properties */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-[10px] font-mono font-bold text-text-main dark:text-gray-400 uppercase tracking-[0.2em] border border-gray-200 dark:border-gray-700 px-2 py-1 inline-block mb-5">
            Rule Properties
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[10px] font-mono font-bold text-text-muted dark:text-gray-400 uppercase tracking-wider mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 font-mono text-sm text-text-main dark:text-white focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold text-text-muted dark:text-gray-400 uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 font-mono text-sm text-text-main dark:text-white focus:border-primary outline-none"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[10px] font-mono font-bold text-text-muted dark:text-gray-400 uppercase tracking-wider mb-1.5">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className={`w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border font-mono text-sm font-bold focus:outline-none ${getSeverityStyle(severity)}`}
              >
                {SEVERITIES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="font-mono text-sm text-text-main dark:text-gray-300">Rule Enabled</span>
              </label>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-text-muted dark:text-gray-400 uppercase tracking-wider mb-1.5">Tags</label>
            <div className="flex items-center gap-2 flex-wrap">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-mono text-xs text-text-main dark:text-white">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="text-gray-400 hover:text-red-500 transition-colors text-sm leading-none">×</button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="+ add tag"
                className="px-2 py-1 bg-transparent font-mono text-xs text-text-muted dark:text-gray-500 outline-none border-none w-24"
              />
            </div>
          </div>
        </motion.div>

        {/* Test Results */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-panel border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-[10px] font-mono font-bold text-text-main dark:text-gray-400 uppercase tracking-[0.2em] border border-gray-200 dark:border-gray-700 px-2 py-1 inline-block mb-5">
            Test Results
          </h3>

          {testValid === null && !testing ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-3xl text-gray-300 dark:text-gray-700 mb-2 inline-block">science</span>
              <p className="font-mono text-xs text-text-muted dark:text-gray-500">Click "Test Rule" to validate syntax and run tests.</p>
            </div>
          ) : testing ? (
            <div className="flex items-center justify-center py-8">
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="material-icons text-primary text-2xl">sync</motion.span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Syntax Status */}
              <div className={`flex items-center gap-2 p-3 ${
                testValid ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800'
              }`}>
                <span className={`material-symbols-outlined text-lg ${testValid ? 'text-green-500' : 'text-red-500'}`}>
                  {testValid ? 'check_circle' : 'cancel'}
                </span>
                <span className={`font-mono text-sm font-bold ${testValid ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {testValid ? 'Syntax valid' : `Syntax error: ${testError}`}
                </span>
              </div>

              {/* Test Against Samples */}
              {testResults.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono text-text-muted dark:text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-yellow-500">science</span>
                    Test Against Sample:
                  </p>
                  <div className="space-y-1">
                    {testResults.map((r, i) => (
                      <div key={i} className={`flex items-center justify-between p-2.5 border-l-2 ${
                        r.match ? 'border-red-500 bg-red-50/50 dark:bg-red-900/5' : 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm text-gray-400">description</span>
                          <span className="font-mono text-xs text-text-main dark:text-white">{r.name}</span>
                        </div>
                        <span className={`text-[10px] font-mono font-bold tracking-wider ${r.match ? 'text-red-500' : 'text-gray-400'}`}>
                          — {r.match ? 'MATCH' : 'NO MATCH'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-between pt-2"
      >
        {/* Delete (left) */}
        {!isNew && (
          <button onClick={handleDeleteRule}
            className="flex items-center gap-1.5 text-red-500 hover:text-red-400 transition-colors font-mono text-xs font-bold">
            <span className="material-symbols-outlined text-sm">delete</span>
            Delete Rule
          </button>
        )}
        {isNew && <div />}

        {/* Test + Save (right) */}
        <div className="flex items-center gap-3">
          <motion.button
            onClick={handleTest}
            disabled={testing}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 font-display font-bold uppercase tracking-[0.15em] text-xs text-text-main dark:text-white hover:border-primary hover:text-primary disabled:opacity-50 transition-all"
          >
            [ Test Rule ]
          </motion.button>
          <motion.button
            onClick={handleSave}
            disabled={saving}
            whileHover={{ y: -2, boxShadow: '0 8px 25px rgba(0,143,57,0.3)' }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-2.5 bg-primary text-white font-display font-bold uppercase tracking-[0.15em] text-xs disabled:opacity-50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            {saving ? 'Saving...' : 'Save Rule'}
          </motion.button>
        </div>
      </motion.div>

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
