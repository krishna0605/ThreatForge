'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading, loginWithGoogle, verifyMFA } = useAuth();
  const router = useRouter();  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mfaStep, setMfaStep] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [mfaSource, setMfaSource] = useState<'email' | 'google' | null>(null);

  useEffect(() => {
    // Check for MFA param from Google redirect
    const mfaParam = new URLSearchParams(window.location.search).get('mfa');
    if (mfaParam === 'google') {
        setMfaStep(true);
        setMfaSource('google');
        toast.info("Please verify your identity with 2FA to complete Google login.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Read values from DOM directly to handle browser autofill
    // (browser autofill can populate fields without triggering React onChange)
    const form = e.target as HTMLFormElement;
    const formEmail = (form.querySelector('#email') as HTMLInputElement)?.value || email;
    const formPassword = (form.querySelector('#password') as HTMLInputElement)?.value || password;

    if (mfaStep) {
        // Unified MFA Flow — works for both email and Google
        const tempToken = sessionStorage.getItem('mfa_temp_token');
        if (!tempToken) {
            setError('Session expired. Please log in again.');
            setIsSubmitting(false);
            setTimeout(() => window.location.href = '/login', 2000);
            return;
        }

        const result = await verifyMFA(tempToken, totpCode);
        if (result.success) {
            router.push('/dashboard');
        } else {
             setError(result.error || 'Verification failed');
        }
    } else {
        // Normal Login Flow — use DOM values
        const result = await login(formEmail, formPassword);

        if (result.success) {
            router.push('/dashboard');
        } else if (result.mfa_required) {
            setMfaStep(true);
            setMfaSource('email');
            setTotpCode('');
        } else {
            setError(result.error || 'Login failed');
        }
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
                      name="email"
                      autoComplete="email"
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
                      name="password"
                      autoComplete="current-password"
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
                  onClick={() => {
                    if (mfaSource === 'google') {
                      // For Google MFA, restart login entirely
                      sessionStorage.removeItem('mfa_temp_token');
                      sessionStorage.removeItem('mfa_source');
                      window.location.href = '/login';
                    } else {
                      setMfaStep(false);
                      setMfaSource(null);
                      setError('');
                      setTotpCode('');
                    }
                  }}
                  className="w-full text-center font-mono text-xs text-text-muted dark:text-gray-500 hover:text-primary transition-colors"
                >
                  ← {mfaSource === 'google' ? 'Cancel and restart' : 'Back to login'}
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
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">or continue with</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={loginWithGoogle}
            disabled={isLoading || isSubmitting}
            className="w-full py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-text-main dark:text-white font-display font-bold uppercase tracking-[0.1em] text-xs hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 flex items-center justify-center gap-3 group mb-8"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
               <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
               <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
               <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
               <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google System ID
          </button>

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
