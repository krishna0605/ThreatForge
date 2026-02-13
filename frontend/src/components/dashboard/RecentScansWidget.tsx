'use client';

import Widget from './Widget';
import Link from 'next/link';

interface ScanItem {
  id: string;
  filename?: string;
  threats_found: number;
}

export default function RecentScansWidget({ scans }: { scans: ScanItem[] }) {
  return (
    <Widget id="LIST_04">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base font-bold text-text-main dark:text-white">Recent Scans</h3>
        <Link href="/scans" className="text-[10px] font-mono text-primary hover:underline no-underline tracking-wider">View All</Link>
      </div>
      <div className="space-y-2">
        {scans.length === 0 ? (
          <p className="text-xs font-mono text-text-muted dark:text-gray-500 py-4 text-center">No recent scans found</p>
        ) : (
          scans.map((scan) => {
            const statusColor = scan.threats_found > 0 ? 'text-red-500' : 'text-green-500';
            const statusLabel = scan.threats_found > 0 ? 'MAL' : 'CLEAN';
            return (
              <Link
                key={scan.id}
                href={`/scans/${scan.id}`}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors no-underline group"
              >
                <span className="material-symbols-outlined text-lg text-gray-400 group-hover:text-primary transition-colors">description</span>
                <span className="font-mono text-xs text-text-main dark:text-white flex-1 truncate">{scan.filename || 'Unknown'}</span>
                <span className={`text-[10px] font-mono font-bold tracking-wider ${statusColor}`}>● {statusLabel}</span>
              </Link>
            );
          })
        )}
      </div>
    </Widget>
  );
}
