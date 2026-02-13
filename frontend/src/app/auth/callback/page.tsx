'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [status, setStatus] = useState('Authenticating...');

  useEffect(() => {
    // If auth finishes and we have a user
    if (!isLoading) {
       if (isAuthenticated && user) {
          setStatus('Redirecting to dashboard...');
          router.push('/dashboard');
       } else {
          // If we are not authenticated after loading finishes, something went wrong
          // OR AuthContext is still processing the onAuthStateChange (which sets isLoading=true)
          // We'll give it a moment, but if it settles to false/false, we go back to login
          const timer = setTimeout(() => {
              if (!isAuthenticated) {
                  console.error("Authentication failed or timed out");
                  router.push('/login?error=auth_failed');
              }
          }, 3000); // 3s grace period for onAuthStateChange to kick in
          return () => clearTimeout(timer);
       }
    }
  }, [isAuthenticated, isLoading, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-6 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="text-center">
            <h2 className="font-display font-bold text-lg text-text-main dark:text-white mb-2">Processing Security Credentials</h2>
            <p className="font-mono text-sm text-text-muted dark:text-gray-400">{status}</p>
        </div>
      </div>
    </div>
  );
}
