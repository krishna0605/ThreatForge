'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';

function getPasswordStrength(pw: string): { label: string; color: string; percent: number } {
  if (pw.length === 0) return { label: '', color: '', percent: 0 };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: 'WEAK', color: 'bg-red-500', percent: 20 };
  if (score <= 2) return { label: 'FAIR', color: 'bg-orange-500', percent: 40 };
  if (score <= 3) return { label: 'GOOD', color: 'bg-yellow-500', percent: 60 };
  if (score <= 4) return { label: 'STRONG', color: 'bg-green-500', percent: 80 };
  return { label: 'EXCELLENT', color: 'bg-primary', percent: 100 };
}

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [organization, setOrganization] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const { signup, isLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!agreed) {
      setError('You must agree to the Rules of Engagement');
      return;
    }

    setIsSubmitting(true);
    const result = await signup(email, password, displayName);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Signup failed');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center selection:bg-primary selection:text-white overflow-hidden py-10">
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

      {/* Theme Toggle */}
      <div className="fixed top-5 right-5 z-40">
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-lg mx-auto px-5">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-6"
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
            Secure Analyst Registration Protocol
          </p>
        </motion.div>

        {/* Access Level Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex justify-center mb-4"
        >
          <span className="inline-block px-3 py-1 border border-primary/30 bg-primary/5 text-[10px] font-mono text-primary font-bold tracking-[0.15em]">
            SYSTEM_ACCESS_LEVEL: 0
          </span>
        </motion.div>

        {/* Signup Card */}
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
          <div className="mb-8">
            <h2 className="font-display text-xl md:text-2xl font-bold text-text-main dark:text-white leading-tight">
              Initialize New Security Profile
            </h2>
            <p className="font-mono text-xs text-text-muted dark:text-gray-500 mt-1">
              Enter credentials to generate analyst identity.
            </p>
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
            {/* Full Name */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-text-main dark:text-gray-300 uppercase tracking-[0.15em] mb-2">
                Full Name <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">
                  person
                </span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 font-mono text-sm text-text-main dark:text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all duration-300"
                />
              </div>
            </div>

            {/* Work Email */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-text-main dark:text-gray-300 uppercase tracking-[0.15em] mb-2">
                Work Email <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">
                  alternate_email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="analyst@organization.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 font-mono text-sm text-text-main dark:text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all duration-300"
                />
              </div>
            </div>

            {/* Organization */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-text-main dark:text-gray-300 uppercase tracking-[0.15em] mb-2">
                Organization
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">
                  apartment
                </span>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="CyberSec Corp"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 font-mono text-sm text-text-main dark:text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all duration-300"
                />
              </div>
            </div>

            {/* Master Access Key */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-mono font-bold text-text-main dark:text-gray-300 uppercase tracking-[0.15em]">
                  Master Access Key <span className="text-primary">*</span>
                </label>
                <span className="text-[9px] font-mono text-gray-400 tracking-wider">MIN_ENTROPY: 64 BIT</span>
              </div>
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
              {/* Password Strength Meter */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${strength.percent}%` }}
                      transition={{ duration: 0.3 }}
                      className={`h-full ${strength.color}`}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] font-mono text-gray-400 tracking-wider">SECURITY ENTROPY</span>
                    <span className={`text-[9px] font-mono font-bold tracking-wider ${
                      strength.percent <= 40 ? 'text-red-500' :
                      strength.percent <= 60 ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      {strength.label}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-text-main dark:text-gray-300 uppercase tracking-[0.15em] mb-2">
                Confirm Access Key <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">
                  lock
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter access key"
                  className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border font-mono text-sm text-text-main dark:text-white placeholder-gray-400 focus:ring-1 outline-none transition-all duration-300 ${
                    confirmPassword && confirmPassword !== password
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
                      : confirmPassword && confirmPassword === password
                      ? 'border-green-400 focus:border-green-400 focus:ring-green-400'
                      : 'border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-primary'
                  }`}
                />
                {confirmPassword && (
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm ${
                    confirmPassword === password ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {confirmPassword === password ? 'check_circle' : 'cancel'}
                  </span>
                )}
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-3.5 h-3.5 mt-0.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 accent-primary"
              />
              <span className="text-xs font-mono text-text-muted dark:text-gray-400 leading-relaxed">
                I agree to the{' '}
                <Link href="#" className="text-primary hover:underline no-underline font-bold">
                  Rules of Engagement
                </Link>{' '}
                (Terms of Service) and acknowledge monitoring protocols.
              </span>
            </label>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isSubmitting || isLoading || !agreed}
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
                  <span className="material-symbols-outlined text-sm">how_to_reg</span>
                )}
                {isSubmitting ? 'Creating Profile...' : 'Create Profile'}
              </span>
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Login Link */}
          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 font-display font-bold uppercase tracking-[0.15em] text-xs text-text-main dark:text-white hover:text-primary transition-all duration-300 no-underline"
            >
              <span className="material-symbols-outlined text-sm">keyboard_return</span>
              Return to Login Console
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
            ENCRYPTED CONNECTION ESTABLISHED // HANDSHAKE_ID: #8A291F
          </p>
          <p className="text-[10px] font-mono text-gray-400 dark:text-gray-600">
            © 2026 ThreatForge. Authorized Personnel Only.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
