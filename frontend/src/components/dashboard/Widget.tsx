'use client';

import { motion } from 'framer-motion';

export default function Widget({ id, children, className = '' }: { id: string; children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`glass-panel border border-gray-200 dark:border-gray-700 p-6 relative overflow-hidden ${className}`}
    >
      <span className="absolute top-2 left-3 text-[9px] font-mono text-gray-400 dark:text-gray-600 tracking-wider">WIDGET_ID: {id}</span>
      <div className="mt-3">{children}</div>
    </motion.div>
  );
}
