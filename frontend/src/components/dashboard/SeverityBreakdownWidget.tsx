'use client';

import Widget from './Widget';
import { motion } from 'framer-motion';

interface SeverityItem {
  level: string;
  count: number;
  pct: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  Critical: 'bg-red-500',
  High: 'bg-orange-500',
  Medium: 'bg-yellow-500',
  Low: 'bg-blue-500',
};

export default function SeverityBreakdownWidget({ data }: { data: SeverityItem[] | null }) {
  const items = data || [
    { level: 'Critical', count: 0, pct: 0 },
    { level: 'High', count: 0, pct: 0 },
    { level: 'Medium', count: 0, pct: 0 },
    { level: 'Low', count: 0, pct: 0 },
  ];

  return (
    <Widget id="BAR_03">
      <h3 className="font-display text-base font-bold text-text-main dark:text-white mb-4">Severity Breakdown</h3>
      <div className="space-y-3">
        {items.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="font-mono text-xs text-text-muted dark:text-gray-400 w-16">{s.level}</span>
            <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.max(s.pct, s.count > 0 ? 5 : 0)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: i * 0.15, ease: 'easeOut' }}
                className={`h-full ${SEVERITY_COLORS[s.level] || 'bg-gray-400'} rounded-r-sm`}
              />
            </div>
            <span className="font-display text-sm font-bold text-text-main dark:text-white w-6 text-right">{s.count}</span>
          </div>
        ))}
      </div>
    </Widget>
  );
}
