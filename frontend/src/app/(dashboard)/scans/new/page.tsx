'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { apiUpload } from '@/lib/api';

const SCAN_OPTIONS = [
  { id: 'ml', label: 'Malware Detection (ML)', default: true },
  { id: 'stego', label: 'Steganography Analysis', default: true },
  { id: 'yara', label: 'YARA Rule Matching', default: true },
  { id: 'pcap', label: 'Network Traffic Analysis (PCAP)', default: false },
  { id: 'entropy', label: 'File Entropy Analysis', default: true },
  { id: 'pe', label: 'PE Header Inspection', default: true },
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['exe', 'dll', 'msi'].includes(ext)) return 'terminal';
  if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg'].includes(ext)) return 'image';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'folder_zip';
  if (['pdf'].includes(ext)) return 'picture_as_pdf';
  if (['pcap', 'pcapng'].includes(ext)) return 'lan';
  return 'description';
}

export default function NewScanPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [scanOptions, setScanOptions] = useState<Record<string, boolean>>(
    Object.fromEntries(SCAN_OPTIONS.map(o => [o.id, o.default]))
  );
  const [yaraRuleset, setYaraRuleset] = useState('all');
  const [highPriority, setHighPriority] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      const unique = arr.filter(f => !existing.has(f.name + f.size));
      return [...prev, ...unique];
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0) { setError('Please select at least one file'); return; }
    setError('');
    setIsScanning(true);

    try {
      // Upload each file as a separate scan
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('scan_type', 'full');
        formData.append('enable_ml', String(scanOptions.ml));
        formData.append('enable_yara', String(scanOptions.yara));
        formData.append('enable_stego', String(scanOptions.stego));
        formData.append('enable_pcap', String(scanOptions.pcap));
        formData.append('enable_entropy', String(scanOptions.entropy));
        formData.append('enable_pe', String(scanOptions.pe));
        formData.append('yara_ruleset', yaraRuleset);
        formData.append('priority', highPriority ? 'high' : 'normal');
        await apiUpload('/scans', formData);
      }
      router.push('/scans');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Scan failed';
      setError(msg);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3"
      >
        <div className="p-2 bg-primary/10 border border-primary/20">
          <span className="material-symbols-outlined text-primary text-2xl">search</span>
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-text-main dark:text-white">
          New Threat Scan
        </h1>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-mono flex items-center gap-2"
          >
            <span className="material-icons text-sm">error_outline</span>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drop Zone */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="glass-panel border border-gray-200 dark:border-gray-700 p-6"
      >
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`relative p-10 border-2 border-dashed cursor-pointer transition-all duration-300 text-center ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary/50'
          }`}
        >
          {/* Corner Brackets */}
          <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-primary/50" />
          <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-primary/50" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-primary/50" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-primary/50" />

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
          />

          <motion.span
            animate={isDragging ? { scale: 1.2, y: -5 } : { scale: 1, y: 0 }}
            className="material-symbols-outlined text-5xl text-primary/60 mb-4 inline-block"
          >
            {isDragging ? 'download' : 'folder_open'}
          </motion.span>

          <h3 className="font-display text-lg font-bold text-text-main dark:text-white mb-3">
            Drop files here or click to browse
          </h3>

          <div className="space-y-1">
            <p className="font-mono text-[11px] text-text-muted dark:text-gray-500">
              &gt;&gt; Supports: EXE, DLL, PDF, IMG, ZIP, PCAP, scripts, docs
            </p>
            <p className="font-mono text-[11px] text-text-muted dark:text-gray-500">
              &gt;&gt; Max: 50 MB per file
            </p>
          </div>
        </div>
      </motion.div>

      {/* Scan Options */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="glass-panel border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 className="font-display text-sm font-bold text-text-main dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">tune</span>
          Scan Options:
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-1">
          {/* Checkboxes */}
          <div className="space-y-3">
            {SCAN_OPTIONS.map((opt) => (
              <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={scanOptions[opt.id]}
                  onChange={(e) => setScanOptions(prev => ({ ...prev, [opt.id]: e.target.checked }))}
                  className="w-4 h-4 accent-primary border-gray-300 dark:border-gray-600"
                />
                <span className="font-mono text-sm text-text-main dark:text-gray-300 group-hover:text-primary transition-colors">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>

          {/* YARA Ruleset + Priority */}
          <div className="space-y-5 mt-4 md:mt-0">
            <div>
              <label className="block text-[10px] font-mono font-bold text-text-main dark:text-gray-400 uppercase tracking-wider mb-2">
                YARA Ruleset
              </label>
              <select
                value={yaraRuleset}
                onChange={(e) => setYaraRuleset(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 font-mono text-sm text-text-main dark:text-white focus:border-primary outline-none"
              >
                <option value="all">[All Rules]</option>
                <option value="malware">Malware Signatures</option>
                <option value="network">Network IOCs</option>
                <option value="custom">Custom Rules</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-text-main dark:text-gray-400 uppercase tracking-wider mb-2">
                Scan Priority
              </label>
              <div className="flex items-center gap-3">
                <span className={`font-mono text-xs ${!highPriority ? 'text-text-main dark:text-white font-bold' : 'text-gray-400'}`}>Normal</span>
                <button
                  type="button"
                  onClick={() => setHighPriority(!highPriority)}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${highPriority ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <motion.div
                    animate={{ x: highPriority ? 20 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow"
                  />
                </button>
                <span className={`font-mono text-xs ${highPriority ? 'text-primary font-bold' : 'text-gray-400'}`}>
                  High <span className="text-primary">↑</span>
                </span>
              </div>
              <p className="font-mono text-[10px] text-gray-400 mt-1 italic">
                * High priority allocates dedicated GPU resources.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Queued Files */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="glass-panel border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-sm font-bold text-text-main dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">queue</span>
                Queued Files:
              </h3>
              <span className="text-[10px] font-mono text-text-muted dark:text-gray-500 tracking-wider">
                [{files.length} file{files.length !== 1 ? 's' : ''} selected]
              </span>
            </div>

            <div className="space-y-1">
              {files.map((file, i) => (
                <motion.div
                  key={file.name + file.size}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors group"
                >
                  <span className="material-symbols-outlined text-lg text-gray-400 group-hover:text-primary transition-colors">
                    {getFileIcon(file.name)}
                  </span>
                  <span className="font-mono text-sm text-text-main dark:text-white flex-1 truncate">
                    {file.name}
                  </span>
                  <span className="font-mono text-xs text-text-muted dark:text-gray-500">
                    {formatSize(file.size)}
                  </span>
                  <button
                    onClick={() => removeFile(i)}
                    className="font-mono text-[10px] text-red-500 hover:text-red-400 font-bold tracking-wider transition-colors"
                  >
                    [REMOVE]
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-center gap-4"
      >
        <Link
          href="/scans"
          className="px-6 py-2.5 font-display font-bold uppercase tracking-[0.15em] text-xs text-text-main dark:text-white hover:text-primary transition-colors no-underline"
        >
          [Cancel]
        </Link>
        <motion.button
          onClick={handleSubmit}
          disabled={files.length === 0 || isScanning}
          whileHover={{ y: -2, boxShadow: '0 8px 25px rgba(0,143,57,0.3)' }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="px-8 py-3 bg-primary text-white font-display font-bold uppercase tracking-[0.2em] text-sm disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden group"
        >
          <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <span className="relative flex items-center gap-2">
            {isScanning ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="material-icons text-sm"
                >sync</motion.span>
                Scanning...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">search</span>
                Start Scan
              </>
            )}
          </span>
        </motion.button>
      </motion.div>

      {/* Footer */}
      <div className="text-center pt-4 pb-2">
        <p className="text-[10px] font-mono text-gray-400 dark:text-gray-600 tracking-wider">
          {`// SECURE_CONNECTION_ESTABLISHED | ENCRYPTION: AES-256`}
        </p>
      </div>
    </div>
  );
}
