'use client';

import { useEffect } from 'react';

export default function Error({
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <div className="max-w-md space-y-4">
        <span className="material-symbols-outlined text-4xl text-red-500">error</span>
        <h2 className="text-xl font-display font-bold text-text-main dark:text-white">Something went wrong!</h2>
        <p className="text-sm font-mono text-text-muted dark:text-gray-400">
          An unexpected error occurred while loading this page.
        </p>
        <div className="flex justify-center gap-4 pt-2">
            <button
            onClick={() => reset()}
            className="px-4 py-2 bg-primary hover:bg-green-600 text-white font-mono text-xs rounded transition-colors"
            >
            Try Again
            </button>
            <a 
                href="/dashboard" 
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 hover:border-primary text-text-main dark:text-white font-mono text-xs rounded transition-colors"
            >
                Return Home
            </a>
        </div>
      </div>
    </div>
  );
}
