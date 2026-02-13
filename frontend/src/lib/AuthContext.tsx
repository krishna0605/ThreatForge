'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { User, UserSchema, AuthResponseSchema, MFARequiredSchema } from '@/lib/schemas';
import { getSecurityPreferences, apiPost } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, totp_code?: string) => Promise<{ success: boolean; error?: string; mfa_required?: boolean }>;
  signup: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<void>;
  verifyGoogleMFA: (tempToken: string, code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeoutEnabled, setTimeoutEnabled] = useState(false);
  const [timeoutMinutes, setTimeoutMinutes] = useState(15);
  // We need a way to pass the temp token to the login page if MFA is required
  // For simplicity, we can use localStorage or URL params. URL params are tricky with redirects.
  // Let's use sessionStorage for the temp token.

  // Load saved auth on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      try {
        const parsedUser = UserSchema.parse(JSON.parse(savedUser));
        setToken(savedToken);
        setUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse saved user", e);
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
      }
    }
    setIsLoading(false);
  }, []);

  // Listen for Supabase Auth changes (Google Login)
  useEffect(() => {
    // Only run this effect in browser
    if (typeof window === 'undefined') return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const currentToken = localStorage.getItem('access_token');
        if (currentToken) return;

        try {
           setIsLoading(true);
           const json = await apiPost('/auth/google', { access_token: session.access_token });
           
           if (json.status === 'success' && json.data) {
                // Check if MFA is required
                if (json.data.mfa_required && json.data.temp_token) {
                    sessionStorage.setItem('mfa_temp_token', json.data.temp_token);
                    // Redirect to login page with MFA param, the Login Page will check session storage
                    window.location.href = '/login?mfa=google';
                    return;
                }

                const result = AuthResponseSchema.safeParse(json.data);
                if (result.success) {
                    const { user, access_token, refresh_token } = result.data;
                    setUser(user);
                    setToken(access_token);
                    localStorage.setItem('access_token', access_token);
                    localStorage.setItem('refresh_token', refresh_token);
                    localStorage.setItem('user', JSON.stringify(user));
                }
           }
        } catch (e) {
            console.error("Google Exchange Failed", e);
        } finally {
            setIsLoading(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ... (Load timeout preferences - unchanged) ...

  // ... (logout - unchanged) ...

  // ... (loginWithGoogle - unchanged) ...

  const verifyGoogleMFA = useCallback(async (tempToken: string, code: string) => {
      try {
          // We need to send the temp token as Authorization header using a custom request or modifying apiPost?
          // Actually apiPost uses 'access_token' from localStorage.
          // We can temporarily set the token to be the tempToken, or just pass headers explicitly.
          // Let's use fetch directly or modify api.ts. simpler: modify apiPost or use raw fetch here.
          // Using raw fetch for this specific edge case to avoid complex api.ts changes.
          
          const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://threatforge-1.onrender.com';
          const url = `${API_BASE}/api/auth/mfa/verify-login`;
          
          const res = await fetch(url, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${tempToken}`
              },
              body: JSON.stringify({ totp_code: code })
          });
          
          const json = await res.json();
          
          if (res.ok && json.status === 'success') {
                const result = AuthResponseSchema.safeParse(json.data);
                if (result.success) {
                    const { user, access_token, refresh_token } = result.data;
                    setUser(user);
                    setToken(access_token);
                    localStorage.setItem('access_token', access_token);
                    localStorage.setItem('refresh_token', refresh_token);
                    localStorage.setItem('user', JSON.stringify(user));
                    sessionStorage.removeItem('mfa_temp_token'); // Cleanup
                    return { success: true };
                }
          }
          return { success: false, error: json.message || 'Verification failed' };

      } catch (e) {
          return { success: false, error: 'Verification error' };
      }
  }, []);



  const logout = useCallback(async () => {
    if (token) {
      apiPost('/auth/logout').catch(() => {});
    }
    // Also sign out of Supabase to clear that session
    await supabase.auth.signOut();
    
    setUser(null);
    setToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }, [token]);

  const loginWithGoogle = useCallback(async () => {
    try {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`, // We will handle this in onAuthStateChange
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            }
        });
    } catch (e) {
        console.error("Google Login Error", e);
    }
  }, []);

  const login = useCallback(async (email: string, password: string, totp_code?: string) => {
    try {
      const body: { email: string; password: string; totp_code?: string } = { email, password };
      if (totp_code) body.totp_code = totp_code;
      
      const json = await apiPost('/auth/login', body);

      if (json.status === 'success' && json.data) {
        // Check for MFA requirement
        const mfaCheck = MFARequiredSchema.safeParse(json.data);
        if (mfaCheck.success && mfaCheck.data.mfa_required) {
             return { success: false, mfa_required: true };
        }

        // Validate success response
        const result = AuthResponseSchema.safeParse(json.data);
        if (result.success) {
            const { user, access_token, refresh_token } = result.data;
            setUser(user);
            setToken(access_token);
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            localStorage.setItem('user', JSON.stringify(user));
            return { success: true };
        } else {
             console.error("Login validation failed", result.error);
             return { success: false, error: 'Invalid response from server' };
        }
      }

      return { success: false, error: json.message || 'Login failed' };
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Network error. Please try again.';
      return { success: false, error: errorMessage };
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      const json = await apiPost('/auth/signup', { email, password, display_name: displayName });

      if (json.status === 'success' && json.data) {
          const result = AuthResponseSchema.safeParse(json.data);
          if (result.success) {
            const { user, access_token, refresh_token } = result.data;
            setUser(user);
            setToken(access_token);
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            localStorage.setItem('user', JSON.stringify(user));
            return { success: true };
          } else {
             console.error("Signup validation failed", result.error);
             return { success: false, error: 'Invalid response from server' };
          }
      }

      return { success: false, error: json.message || 'Signup failed' };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Network error. Please try again.';
      return { success: false, error: errorMessage };
    }
  }, []);

  const refreshUser = useCallback(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // Idle timeout — auto-logout
  const { showWarning, remainingSeconds, dismissWarning } = useIdleTimeout({
    timeoutMinutes,
    warningMinutes: 1,
    onTimeout: logout,
    enabled: timeoutEnabled && !!user,
  });

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      isAuthenticated: !!user && !!token,
      login, signup, logout, refreshUser, loginWithGoogle, verifyGoogleMFA
    }}>
      {children}

      {/* Idle Timeout Warning Modal */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-8 max-w-sm w-full mx-4 text-center"
            >
              <div className="w-14 h-14 mx-auto mb-4 bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-orange-500 text-3xl">timer</span>
              </div>
              <h3 className="font-display text-lg font-bold text-text-main dark:text-white mb-2">
                Session Expiring
              </h3>
              <p className="font-mono text-sm text-text-muted dark:text-gray-400 mb-4">
                You will be logged out in <span className="text-orange-500 font-bold">{remainingSeconds}s</span> due to inactivity.
              </p>
              <button
                onClick={dismissWarning}
                className="w-full py-2.5 bg-primary text-white font-display font-bold uppercase tracking-[0.15em] text-xs hover:bg-primary/90 transition-colors"
              >
                Stay Logged In
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
