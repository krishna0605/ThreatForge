'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mfaStep, setMfaStep] = useState(false);
  const [totpCode, setTotpCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await login(email, password, mfaStep ? totpCode : undefined);

    if (result.success) {
      router.push('/dashboard');
    } else if (result.mfa_required) {
      setMfaStep(true);
      setTotpCode('');
    } else {
      setError(result.error || 'Login failed');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center selection:bg-primary selection:text-white overflow-hidden">
      {/* Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: `linear-gradient(rgba(0,143,57,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0,143,57,0.07) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        backgroundImage: `linear-gradient(rgba(0,143,57,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,143,57,0.025) 1px, transparent 1px)`,
        backgroundSize: '10px 10px',
      }} />

      {/* Ambient Orbs */}
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-5%] w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[-5%] w-[700px] h-[700px] bg-secondary/[0.03] rounded-full blur-[180px]" />
      </div>

      {/* CRT */}
      <div className="fixed inset-0 crt-overlay z-50 opacity-20 pointer-events-none" />

      {/* Theme Toggle — top right */}
      <div className="fixed top-5 right-5 z-40">
        <ThemeToggle />
      </div>

      {/* System Diagnostic — bottom right */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-3 py-1.5 glass-panel border border-gray-200 dark:border-gray-700 text-[10px] font-mono text-text-muted dark:text-gray-500 tracking-wider"
      >
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
        SYSTEM_DIAGNOSTIC: OK
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md mx-auto px-5">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-8"
        >
          <motion.span
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="material-icons text-primary text-5xl inline-block mb-3 cursor-default"
          >
            security
          </motion.span>
          <h1 className="font-display text-3xl font-bold tracking-[0.15em] text-text-main dark:text-white">
            THREAT<span className="text-primary">FORGE</span>
          </h1>
          <p className="font-mono text-[11px] text-text-muted dark:text-gray-500 mt-2 uppercase tracking-[0.2em]">
            Restricted Access /// Authorization Required
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="glass-panel p-8 md:p-10 border border-gray-200 dark:border-gray-700 relative overflow-hidden"
        >
          {/* Corner Brackets */}
          <div className="absolute top-0 left-0 w-5 h-5 border-l-2 border-t-2 border-primary/40" />
          <div className="absolute top-0 right-0 w-5 h-5 border-r-2 border-t-2 border-primary/40" />
          <div className="absolute bottom-0 left-0 w-5 h-5 border-l-2 border-b-2 border-primary/40" />
          <div className="absolute bottom-0 right-0 w-5 h-5 border-r-2 border-b-2 border-primary/40" />

          {/* Header */}
          <div className="flex items-center justify-between mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
            <h2 className="font-display text-xl font-bold text-text-main dark:text-white uppercase tracking-wider">
              System Login
            </h2>
            <span className="text-[10px] font-mono text-primary font-bold tracking-wider bg-primary/5 border border-primary/20 px-2 py-0.5">
              SECURE_CHANNEL
            </span>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-mono flex items-center gap-2"
            >
              <span className="material-icons text-sm">error_outline</span>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!mfaStep ? (
              <>
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-[10px] font-mono font-bold text-text-main dark:text-gray-300 uppercase tracking-[0.15em] mb-2">
                    Username / System ID <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">
                      badge
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="USR_ID_0000"
                      id="email"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 font-mono text-sm text-text-main dark:text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-[10px] font-mono font-bold text-text-main dark:text-gray-300 uppercase tracking-[0.15em] mb-2">
                    Access Key <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">
                      vpn_key
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••••••"
                      id="password"
                      className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 font-mono text-sm text-text-main dark:text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Remember + Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 accent-primary"
                    />
                    <span className="text-xs font-mono text-text-muted dark:text-gray-400 group-hover:text-text-main dark:group-hover:text-white transition-colors">
                      Remember Session
                    </span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-mono text-primary hover:underline no-underline transition-all"
                  >
                    Forgot Credentials?
                  </Link>
                </div>
              </>
            ) : (
              /* MFA TOTP Step */
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <div className="text-center mb-2">
                  <span className="material-symbols-outlined text-primary text-4xl mb-2 block">security_key</span>
                  <p className="font-mono text-xs text-text-muted dark:text-gray-400">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-text-main dark:text-gray-300 uppercase tracking-[0.15em] mb-2">
                    Verification Code <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">
                      pin
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      autoFocus
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      placeholder="000000"
                      maxLength={6}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 font-mono text-2xl text-center tracking-[0.5em] text-text-main dark:text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all duration-300"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setMfaStep(false); setError(''); setTotpCode(''); }}
                  className="w-full text-center font-mono text-xs text-text-muted dark:text-gray-500 hover:text-primary transition-colors"
                >
                  ← Back to login
                </button>
              </motion.div>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isSubmitting || isLoading || (mfaStep && totpCode.length !== 6)}
              whileHover={{ y: -2, boxShadow: '0 8px 25px rgba(0,143,57,0.3)' }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="w-full py-3.5 bg-primary text-white font-display font-bold uppercase tracking-[0.2em] text-sm disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="material-icons text-sm"
                  >
                    sync
                  </motion.span>
                ) : (
                  <span className="material-symbols-outlined text-sm">{mfaStep ? 'security_key' : 'verified_user'}</span>
                )}
                {isSubmitting ? 'Verifying...' : mfaStep ? 'Verify Code' : 'Secure Login'}
              </span>
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Signup Link */}
          <div className="text-center">
            <p className="text-xs font-mono text-text-muted dark:text-gray-500 mb-3">
              New personnel?
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-2.5 border border-gray-300 dark:border-gray-600 font-display font-bold uppercase tracking-[0.15em] text-xs text-text-main dark:text-white hover:border-primary hover:text-primary transition-all duration-300 no-underline"
            >
              <span className="material-symbols-outlined text-sm">person_add</span>
              Initialize New Account
            </Link>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center mt-8 space-y-1"
        >
          <p className="text-[10px] font-mono text-gray-400 dark:text-gray-600 tracking-wider">
            ENCRYPTION: AES-256 &nbsp;•&nbsp; PROTOCOL: TLS 1.3 &nbsp;•&nbsp; ZONE: US-EAST
          </p>
          <p className="text-[10px] font-mono text-gray-400 dark:text-gray-600">
            UNAUTHORIZED ACCESS IS A FEDERAL OFFENSE
          </p>
        </motion.div>
      </div>
    </div>
  );
}
