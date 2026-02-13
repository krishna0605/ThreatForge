import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Not Found | ThreatForge',
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-4">
      <div className="font-mono text-primary text-6xl font-bold mb-4 glitch-effect" data-text="404">404</div>
      <h2 className="text-2xl font-display font-bold text-text-main dark:text-white mb-2">Page Not Found</h2>
      <p className="text-text-muted dark:text-gray-400 max-w-md mb-8 font-mono text-sm">
        The requested resource could not be found on this server. It may have been moved or deleted.
      </p>
      <Link 
        href="/dashboard"
        className="px-6 py-2.5 bg-primary hover:bg-green-600 text-white font-mono text-sm rounded shadow-neon transition-all hover:scale-105"
      >
        RETURN_TO_DASHBOARD
      </Link>
    </div>
  );
}
