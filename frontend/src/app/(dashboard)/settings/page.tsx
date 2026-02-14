'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import {
  changePassword, enrollMFA, verifyMFA, disableMFA,
  getSecuritySessions, revokeSession,
  getSecurityPreferences, updateSecurityPreferences,
  getIpWhitelist, addIpWhitelist, removeIpWhitelist,
  getNotificationPrefs, updateNotificationPrefs, sendTestNotification,

} from '@/lib/api';

interface IpEntry {
  id: string;
  cidr_range: string;
  label?: string;
  created_at?: string;
}

interface Session {
  id: string;
  ip_address: string;
  browser?: string;
  os?: string;
  created_at: string;
  is_current?: boolean;
}

interface NotificationPrefs {
  email_threat_alerts: boolean;
  email_scan_completions: boolean;
  email_weekly_digest: boolean;
  push_critical_alerts: boolean;
  push_scan_updates: boolean;
}

/* ───── Tab Definitions ───── */
const TABS = [
  { key: 'general', label: 'General', icon: 'tune' },
  { key: 'security', label: 'Security', icon: 'verified_user' },
  { key: 'notifications', label: 'Notifications', icon: 'notifications' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

/* ───── Toggle Component ───── */
function Toggle({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button id={id} onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}>
      <motion.div
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
      />
    </button>
  );
}

/* ───── Main Page ───── */
interface SecurityPreferences {
  session_timeout_enabled: boolean;
  ip_whitelist_enabled: boolean;
  audit_logging_enabled: boolean;
}

interface IpListResponse {
  entries: IpEntry[];
}

interface SessionListResponse {
  sessions: Session[];
}

interface MfaEnrollResponse {
  data?: { qr_uri: string; secret: string };
  qr_uri?: string;
  secret?: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 border border-primary/20">
            <span className="material-symbols-outlined text-primary text-2xl">settings</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-text-main dark:text-white">
                System Settings
              </h1>
              <span className="px-2 py-0.5 bg-primary text-white text-[9px] font-mono font-bold tracking-wider">ADMIN_MODE</span>
            </div>
            <p className="font-mono text-[10px] text-text-muted dark:text-gray-500 tracking-wider mt-0.5">&gt; Configure platform parameters &amp; third-party connectors</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-display text-xs font-bold text-text-main dark:text-white uppercase tracking-wider">Administrator</p>
            <p className="font-mono text-[9px] text-text-muted dark:text-gray-500">session_id: {user?.id?.slice(0, 6) || 'D093_A1'}</p>
          </div>
          <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-gray-500 text-lg">person</span>
          </div>
        </div>
      </motion.div>

      {/* Layout: Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
        {/* Left Sidebar */}
        <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <nav className="space-y-0.5">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm font-mono transition-all ${
                  activeTab === tab.key
                    ? 'text-primary font-bold bg-primary/5 border-l-2 border-primary'
                    : 'text-text-muted dark:text-gray-500 hover:text-text-main dark:hover:text-white border-l-2 border-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-base">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* System Status */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <p className="text-[9px] font-mono text-text-muted dark:text-gray-600 uppercase tracking-wider mb-2">System Status</p>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span className="text-text-muted dark:text-gray-500">API:</span>
                <span className="text-green-500 font-bold">Operational</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span className="text-text-muted dark:text-gray-500">Webhooks:</span>
                <span className="text-green-500 font-bold">Active</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Content */}
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === 'general' && <GeneralTab key="general" />}
            {activeTab === 'security' && <SecurityTab key="security" />}
            {activeTab === 'notifications' && <NotificationsTab key="notifications" />}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 pb-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 text-[10px] font-mono text-gray-400 dark:text-gray-600">
          <span className="font-bold text-text-main dark:text-white">SYSTEM_DIAGNOSTICS:</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Database: OK</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Neural Engine: OK</span>
        </div>
        <span className="text-[10px] font-mono text-gray-400 dark:text-gray-600">© 2026 ThreatForge. Internal Configuration Panel.</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   GENERAL TAB
   ═══════════════════════════════════════════════════════════ */
function GeneralTab() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [org, setOrg] = useState('ThreatForge Security');
  const [timezone, setTimezone] = useState('UTC');
  const [theme, setTheme] = useState('system');
  const [language, setLanguage] = useState('en');

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      {/* Profile */}
      <div className="glass-panel border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-display text-base font-bold text-text-main dark:text-white mb-4">Profile Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-mono font-bold text-text-muted dark:text-gray-400 uppercase tracking-wider mb-1.5">Display Name</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 font-mono text-sm text-text-main dark:text-white focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold text-text-muted dark:text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
            <input type="email" value={user?.email || ''} disabled
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 font-mono text-sm text-gray-400 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold text-text-muted dark:text-gray-400 uppercase tracking-wider mb-1.5">Organization</label>
            <input type="text" value={org} onChange={e => setOrg(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 font-mono text-sm text-text-main dark:text-white focus:border-primary outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold text-text-muted dark:text-gray-400 uppercase tracking-wider mb-1.5">Role</label>
            <input type="text" value={user?.role || 'Administrator'} disabled
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 font-mono text-sm text-gray-400 cursor-not-allowed" />
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="glass-panel border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-display text-base font-bold text-text-main dark:text-white mb-4">Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-mono font-bold text-text-muted dark:text-gray-400 uppercase tracking-wider mb-1.5">Timezone</label>
            <select value={timezone} onChange={e => setTimezone(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 font-mono text-sm text-text-main dark:text-white focus:border-primary outline-none">
              <option value="UTC">UTC</option>
              <option value="EST">EST (UTC-5)</option>
              <option value="PST">PST (UTC-8)</option>
              <option value="IST">IST (UTC+5:30)</option>
              <option value="CET">CET (UTC+1)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold text-text-muted dark:text-gray-400 uppercase tracking-wider mb-1.5">Theme</label>
            <select value={theme} onChange={e => setTheme(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 font-mono text-sm text-text-main dark:text-white focus:border-primary outline-none">
              <option value="system">System Default</option>
              <option value="dark">Dark Mode</option>
              <option value="light">Light Mode</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold text-text-muted dark:text-gray-400 uppercase tracking-wider mb-1.5">Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 font-mono text-sm text-text-main dark:text-white focus:border-primary outline-none">
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="de">Deutsch</option>
              <option value="ja">日本語</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <motion.button whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(0,143,57,0.3)' }} whileTap={{ scale: 0.98 }}
          className="px-8 py-2.5 bg-primary text-white font-display font-bold uppercase tracking-[0.15em] text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">save</span>Save Changes
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SECURITY TAB — Fully Functional
   ═══════════════════════════════════════════════════════════ */
function SecurityTab() {
  const { user } = useAuth();

  // ── Change Password ──
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleChangePassword = async () => {
    setPwMsg(null);
    if (!currentPw || !newPw) return setPwMsg({ type: 'err', text: 'All fields are required' });
    if (newPw.length < 8) return setPwMsg({ type: 'err', text: 'Min 8 characters' });
    if (newPw !== confirmPw) return setPwMsg({ type: 'err', text: 'Passwords do not match' });
    setPwLoading(true);
    try {
      await changePassword(currentPw, newPw, confirmPw);
      setPwMsg({ type: 'ok', text: 'Password changed successfully' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to change password';
      setPwMsg({ type: 'err', text: msg });
    } finally { setPwLoading(false); }
  };

  // ── 2FA ──
  const [mfaStep, setMfaStep] = useState<'idle' | 'enrolling' | 'qr' | 'disabling'>('idle');
  const [qrUri, setQrUri] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaMsg, setMfaMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [mfaEnabled, setMfaEnabled] = useState(user?.mfa_enabled ?? false);

  const handleEnrollMFA = async () => {
    setMfaStep('enrolling'); setMfaMsg(null);
    try {
      const response = await enrollMFA() as MfaEnrollResponse;
      const mfaData = response.data || response;
      if (!mfaData.qr_uri || !mfaData.secret) throw new Error('Invalid MFA data');
      setQrUri(mfaData.qr_uri);
      setMfaSecret(mfaData.secret);
      setMfaStep('qr');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Enrollment failed';
      setMfaMsg({ type: 'err', text: msg }); setMfaStep('idle');
    }
  };

  const handleVerifyMFA = async () => {
    setMfaMsg(null);
    if (mfaCode.length !== 6) return setMfaMsg({ type: 'err', text: 'Enter 6-digit code' });
    try {
      await verifyMFA(mfaCode);
      setMfaEnabled(true); setMfaStep('idle'); setMfaCode('');
      setMfaMsg({ type: 'ok', text: '2FA enabled successfully!' });
      // Update stored user
      const stored = localStorage.getItem('user');
      if (stored) { const u = JSON.parse(stored); u.mfa_enabled = true; localStorage.setItem('user', JSON.stringify(u)); }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Verification failed';
      setMfaMsg({ type: 'err', text: msg });
    }
  };

  const handleDisableMFA = async () => {
    setMfaMsg(null);
    if (mfaCode.length !== 6) return setMfaMsg({ type: 'err', text: 'Enter current 6-digit code to disable' });
    try {
      await disableMFA(mfaCode);
      window.location.reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Disable failed';
      setMfaMsg({ type: 'err', text: msg }); // Use setMfaMsg as setError is not defined
    }
  };

  // ── Security Preferences ──
  const [sessionTimeout, setSessionTimeout] = useState(true);
  const [ipWhitelistEnabled, setIpWhitelistEnabled] = useState(false);
  const [auditLog, setAuditLog] = useState(false);



  useEffect(() => {
    getSecurityPreferences().then((p: unknown) => {
      const prefs = p as SecurityPreferences;
      setSessionTimeout(prefs.session_timeout_enabled ?? true);
      setIpWhitelistEnabled(prefs.ip_whitelist_enabled ?? false);
      setAuditLog(prefs.audit_logging_enabled ?? false);
    }).catch(() => {});
  }, []);

  const handlePrefChange = async (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    try { await updateSecurityPreferences({ [key]: value }); } catch { setter(!value); }
  };

  // ── IP Whitelist ──
  // ── IP Whitelist ──
  const [ipEntries, setIpEntries] = useState<IpEntry[]>([]);
  const [newCidr, setNewCidr] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [ipMsg, setIpMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (ipWhitelistEnabled) {
      getIpWhitelist().then((d: unknown) => setIpEntries((d as IpListResponse).entries || [])).catch(() => {});
    }
  }, [ipWhitelistEnabled]);

  const handleAddIp = async () => {
    setIpMsg(null);
    if (!newCidr.trim()) return setIpMsg({ type: 'err', text: 'CIDR range required' });
    try {
      const res = await addIpWhitelist(newCidr.trim(), newLabel.trim()) as { entry: IpEntry };
      setIpEntries(prev => [res.entry, ...prev]);
      setNewCidr(''); setNewLabel('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to add IP';
      setIpMsg({ type: 'err', text: msg });
    }
  };

  const handleRemoveIp = async (id: string) => {
    try {
      await removeIpWhitelist(id);
      setIpEntries(prev => prev.filter(e => e.id !== id));
    } catch { /* silent */ }
  };

  // ── Active Sessions ──
  // ── Active Sessions ──
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  useEffect(() => {
    getSecuritySessions().then((d: unknown) => { setSessions((d as SessionListResponse).sessions || []); setSessionsLoading(false); }).catch(() => setSessionsLoading(false));
  }, []);

  const handleRevoke = async (id: string) => {
    try {
      await revokeSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch { /* silent */ }
  };

  const timeAgo = (iso: string) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const inputCls = 'w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 font-mono text-sm text-text-main dark:text-white focus:border-primary outline-none';
  const lblCls = 'block text-[10px] font-mono font-bold text-text-muted dark:text-gray-400 uppercase tracking-wider mb-1.5';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

      {/* ─── Change Password ─── */}
      <div className="glass-panel border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-display text-base font-bold text-text-main dark:text-white mb-4">Change Password</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
          <div className="md:col-span-2">
            <label className={lblCls}>Current Password</label>
            <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" className={inputCls} />
          </div>
          <div>
            <label className={lblCls}>New Password</label>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••" className={inputCls} />
          </div>
          <div>
            <label className={lblCls}>Confirm Password</label>
            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" className={inputCls} />
          </div>
        </div>
        {pwMsg && (
          <p className={`mt-2 font-mono text-xs ${pwMsg.type === 'ok' ? 'text-green-500' : 'text-red-500'}`}>{pwMsg.text}</p>
        )}
        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={handleChangePassword} disabled={pwLoading}
          className="mt-4 px-6 py-2 border border-primary text-primary font-display font-bold uppercase tracking-[0.1em] text-xs hover:bg-primary hover:text-white transition-all disabled:opacity-50">
          {pwLoading ? 'Updating...' : 'Update Password'}
        </motion.button>
      </div>

      {/* ─── Two-Factor Authentication ─── */}
      <div className="glass-panel border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-display text-base font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">security</span>
          Two-Factor Authentication (2FA)
          {mfaEnabled && <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-500 text-[9px] font-mono font-bold">ACTIVE</span>}
        </h3>

        {mfaMsg && (
          <p className={`mb-3 font-mono text-xs ${mfaMsg.type === 'ok' ? 'text-green-500' : 'text-red-500'}`}>{mfaMsg.text}</p>
        )}

        {!mfaEnabled && mfaStep === 'idle' && (
          <div>
            <p className="font-mono text-xs text-text-muted dark:text-gray-500 mb-3">Add an extra layer of security by requiring a TOTP code from Google Authenticator or similar apps.</p>
            <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={handleEnrollMFA}
              className="px-6 py-2 bg-primary text-white font-display font-bold uppercase tracking-[0.1em] text-xs">
              Enable 2FA
            </motion.button>
          </div>
        )}

        {mfaStep === 'enrolling' && (
          <p className="font-mono text-xs text-text-muted animate-pulse">Generating secret...</p>
        )}

        {mfaStep === 'qr' && (
          <div className="space-y-4">
            <p className="font-mono text-xs text-text-muted dark:text-gray-500">Scan this QR code with Google Authenticator, Authy, or any TOTP app:</p>
            <div className="inline-block p-4 bg-white border border-gray-200">
              <QRCodeSVG value={qrUri} size={180} />
            </div>
            <div>
              <p className="font-mono text-[10px] text-text-muted dark:text-gray-500 mb-1">Or enter this key manually:</p>
              <code className="font-mono text-xs text-primary bg-primary/5 px-2 py-1 border border-primary/20 select-all">{mfaSecret}</code>
            </div>
            <div className="max-w-xs">
              <label className={lblCls}>Verification Code</label>
              <input type="text" value={mfaCode} onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000" maxLength={6} className={inputCls + ' tracking-[0.5em] text-center text-lg'} />
            </div>
            <div className="flex gap-3">
              <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={handleVerifyMFA}
                className="px-6 py-2 bg-primary text-white font-display font-bold uppercase tracking-[0.1em] text-xs">
                Verify & Enable
              </motion.button>
              <button onClick={() => { setMfaStep('idle'); setMfaCode(''); }}
                className="px-4 py-2 font-mono text-xs text-text-muted hover:text-text-main">
                Cancel
              </button>
            </div>
          </div>
        )}

        {mfaEnabled && mfaStep === 'idle' && (
          <div className="space-y-3">
            <p className="font-mono text-xs text-green-500">✓ Two-factor authentication is active on this account.</p>
            <button onClick={() => setMfaStep('disabling')}
              className="font-mono text-xs text-red-500 hover:underline">Disable 2FA</button>
          </div>
        )}

        {mfaStep === 'disabling' && (
          <div className="space-y-3">
            <p className="font-mono text-xs text-text-muted dark:text-gray-500">Enter a current TOTP code to disable 2FA:</p>
            <div className="max-w-xs">
              <input type="text" value={mfaCode} onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000" maxLength={6} className={inputCls + ' tracking-[0.5em] text-center text-lg'} />
            </div>
            <div className="flex gap-3">
              <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={handleDisableMFA}
                className="px-6 py-2 bg-red-500 text-white font-display font-bold uppercase tracking-[0.1em] text-xs">
                Confirm Disable
              </motion.button>
              <button onClick={() => { setMfaStep('idle'); setMfaCode(''); }}
                className="px-4 py-2 font-mono text-xs text-text-muted hover:text-text-main">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Security Preferences ─── */}
      <div className="glass-panel border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-display text-base font-bold text-text-main dark:text-white mb-5 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">shield</span> Security Preferences
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-sm font-bold text-text-main dark:text-white">Session Auto-Timeout</p>
              <p className="font-mono text-[11px] text-text-muted dark:text-gray-500 mt-0.5">Log out inactive users after 15 minutes.</p>
            </div>
            <Toggle checked={sessionTimeout} onChange={v => handlePrefChange('session_timeout_enabled', v, setSessionTimeout)} id="sessionTimeout" />
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-sm font-bold text-text-main dark:text-white">IP Whitelisting</p>
              <p className="font-mono text-[11px] text-text-muted dark:text-gray-500 mt-0.5">Restrict API access to defined CIDR blocks.</p>
            </div>
            <Toggle checked={ipWhitelistEnabled} onChange={v => handlePrefChange('ip_whitelist_enabled', v, setIpWhitelistEnabled)} id="ipWhitelist" />
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-sm font-bold text-text-main dark:text-white">Verbose Audit Logging</p>
              <p className="font-mono text-[11px] text-text-muted dark:text-gray-500 mt-0.5">Record all read/write operations (High Storage).</p>
            </div>
            <Toggle checked={auditLog} onChange={v => handlePrefChange('audit_logging_enabled', v, setAuditLog)} id="auditLog" />
          </div>
        </div>
      </div>

      {/* ─── IP Whitelist Management ─── */}
      <AnimatePresence>
        {ipWhitelistEnabled && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass-panel border border-gray-200 dark:border-gray-700 p-6 overflow-hidden">
            <h3 className="font-display text-base font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">vpn_lock</span> IP Whitelist
            </h3>

            {/* Add form */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <input type="text" value={newCidr} onChange={e => setNewCidr(e.target.value)}
                  placeholder="192.168.1.0/24" className={inputCls} />
              </div>
              <div className="flex-1">
                <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
                  placeholder="Label (optional)" className={inputCls} />
              </div>
              <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} onClick={handleAddIp}
                className="px-4 py-2 bg-primary text-white font-display font-bold uppercase tracking-[0.1em] text-xs whitespace-nowrap">
                + Add
              </motion.button>
            </div>
            {ipMsg && <p className={`mb-3 font-mono text-xs ${ipMsg.type === 'ok' ? 'text-green-500' : 'text-red-500'}`}>{ipMsg.text}</p>}

            {/* Entries list */}
            <div className="space-y-2">
              {ipEntries.length === 0 && (
                <p className="font-mono text-xs text-text-muted dark:text-gray-500">No IP ranges configured yet.</p>
              )}
              {ipEntries.map(entry => (
                <div key={entry.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-gray-400 text-sm">language</span>
                    <div>
                      <p className="font-mono text-xs text-text-main dark:text-white">{entry.cidr_range}</p>
                      {entry.label && <p className="font-mono text-[10px] text-gray-400">{entry.label}</p>}
                    </div>
                  </div>
                  <button onClick={() => handleRemoveIp(entry.id)}
                    className="text-[10px] font-mono text-red-500 hover:underline">REMOVE</button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Active Sessions ─── */}
      <div className="glass-panel border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-display text-base font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">devices</span> Active Sessions
        </h3>
        <div className="space-y-3">
          {sessionsLoading && <p className="font-mono text-xs text-text-muted animate-pulse">Loading sessions...</p>}
          {!sessionsLoading && sessions.length === 0 && (
            <p className="font-mono text-xs text-text-muted dark:text-gray-500">No active sessions found.</p>
          )}
          {sessions.map(s => (
            <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-gray-400 text-base">
                  {s.os?.toLowerCase().includes('android') || s.os?.toLowerCase().includes('ios') ? 'smartphone' : 'computer'}
                </span>
                <div>
                  <p className="font-mono text-xs text-text-main dark:text-white">{s.browser} on {s.os}</p>
                  <p className="font-mono text-[10px] text-gray-400">
                    {s.ip_address} • {s.is_current ? 'Current session' : timeAgo(s.created_at)}
                  </p>
                </div>
              </div>
              {s.is_current ? (
                <span className="text-[10px] font-mono text-green-500 font-bold">CURRENT</span>
              ) : (
                <button onClick={() => handleRevoke(s.id)}
                  className="text-[10px] font-mono text-red-500 hover:underline">REVOKE</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   NOTIFICATIONS TAB
   ═══════════════════════════════════════════════════════════ */
function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    email_threat_alerts: true,
    email_scan_completions: true,
    email_weekly_digest: false,
    push_critical_alerts: true,
    push_scan_updates: false,
  });
  const [loading, setLoading] = useState(true);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    getNotificationPrefs()
      .then((data: unknown) => {
        setPrefs(p => ({ ...p, ...(data as Partial<NotificationPrefs>) }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Toggle handler — updates state + persists to API
  const handleToggle = useCallback(async (key: string, value: boolean) => {
    setPrefs(p => ({ ...p, [key]: value }));
    try {
      await updateNotificationPrefs({ [key]: value });
    } catch {
      // Revert on error
      setPrefs(p => ({ ...p, [key]: !value }));
    }
  }, []);

  // Send test notification
  const handleTest = async () => {
    setTestLoading(true);
    setTestStatus(null);
    try {
      await sendTestNotification('all');
      setTestStatus('Test notification sent! Check your email and browser.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setTestStatus(`Error: ${msg}`);
    }
    setTestLoading(false);
    setTimeout(() => setTestStatus(null), 5000);
  };

  const emailItems = [
    { key: 'email_threat_alerts', label: 'Threat Alerts', desc: 'Receive email when critical/high threats are detected.', id: 'n-emailThreats' },
    { key: 'email_scan_completions', label: 'Scan Completions', desc: 'Notify when scan jobs finish processing.', id: 'n-emailScans' },
    { key: 'email_weekly_digest', label: 'Weekly Digest', desc: 'Summary report of all scans and findings.', id: 'n-emailWeekly' },
  ];

  const pushItems = [
    { key: 'push_critical_alerts', label: 'Critical Alerts', desc: 'Real-time push for critical severity findings.', id: 'n-pushCritical' },
    { key: 'push_scan_updates', label: 'Scan Updates', desc: 'Push when scans start or complete.', id: 'n-pushScans' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="material-symbols-outlined animate-spin text-primary text-2xl">progress_activity</span>
        <span className="ml-2 font-mono text-xs text-gray-400">Loading preferences...</span>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      {/* Email */}
      <div className="glass-panel border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-display text-base font-bold text-text-main dark:text-white mb-5 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">email</span> Email Notifications
        </h3>
        <div className="space-y-4">
          {emailItems.map(item => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div>
                <p className="font-mono text-sm font-bold text-text-main dark:text-white">{item.label}</p>
                <p className="font-mono text-[11px] text-text-muted dark:text-gray-500">{item.desc}</p>
              </div>
              <Toggle checked={prefs[item.key as keyof NotificationPrefs]} onChange={(v: boolean) => handleToggle(item.key, v)} id={item.id} />
            </div>
          ))}
        </div>
      </div>

      {/* Push */}
      <div className="glass-panel border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-display text-base font-bold text-text-main dark:text-white mb-5 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">notifications_active</span> Push Notifications
        </h3>
        <div className="space-y-4">
          {pushItems.map(item => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div>
                <p className="font-mono text-sm font-bold text-text-main dark:text-white">{item.label}</p>
                <p className="font-mono text-[11px] text-text-muted dark:text-gray-500">{item.desc}</p>
              </div>
              <Toggle checked={prefs[item.key as keyof NotificationPrefs]} onChange={(v: boolean) => handleToggle(item.key, v)} id={item.id} />
            </div>
          ))}
        </div>
      </div>

      {/* Test */}
      <div className="glass-panel border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-display text-base font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">science</span> Test Notifications
        </h3>
        <p className="font-mono text-[11px] text-text-muted dark:text-gray-500 mb-4">
          Send a test notification to verify your email and push delivery are working correctly.
        </p>
        <button onClick={handleTest} disabled={testLoading}
          className="px-4 py-2 bg-primary hover:bg-primary/80 text-white font-mono text-xs tracking-widest disabled:opacity-50 transition-all">
          {testLoading ? 'SENDING...' : 'SEND TEST NOTIFICATION'}
        </button>
        {testStatus && (
          <p className={`font-mono text-[11px] mt-3 ${testStatus.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>
            {testStatus}
          </p>
        )}
      </div>
    </motion.div>
  );
}
