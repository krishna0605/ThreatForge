'use client';

import { useEffect } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col items-center justify-center min-h-screen bg-background-light dark:bg-[#0d1117] text-text-main dark:text-white p-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-6xl mb-4">💥</div>
            <h2 className="text-2xl font-display font-bold text-red-500">System Critical Error</h2>
            <p className="text-text-muted dark:text-gray-400 font-mono text-sm">
              A critical error occurred in the application root layout.
            </p>
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-md text-left overflow-auto max-h-40 font-mono text-xs text-red-400">
               {error.message || "Unknown error"}
            </div>
            <button
              onClick={() => reset()}
              className="px-6 py-2 bg-primary hover:bg-green-600 text-white font-mono text-sm rounded transition-colors shadow-neon"
            >
              Try to recover
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
