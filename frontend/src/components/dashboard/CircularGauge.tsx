'use client';

import { motion } from 'framer-motion';

export default function CircularGauge({ value, label, subtitle, color }: { value: number; label: string; subtitle: string; color: string }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="6" />
          <motion.circle
            cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: offset }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-lg font-bold text-text-main dark:text-white">{value}%</span>
        </div>
      </div>
      <p className="font-display text-sm font-bold text-text-main dark:text-white mt-3">{label}</p>
      <p className="font-mono text-[10px] text-text-muted dark:text-gray-500">{subtitle}</p>
    </div>
  );
}
