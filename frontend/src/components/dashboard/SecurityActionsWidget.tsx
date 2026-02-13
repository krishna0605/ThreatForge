'use client';

import Widget from './Widget';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface ActionItem {
  id: string;
  icon: string;
  title: string;
  desc: string;
  type: string;
}

export default function SecurityActionsWidget({ actions }: { actions: ActionItem[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState<string | null>(null);

  const handleAction = async (action: ActionItem) => {
    setProcessing(action.id);

    // Simulate action processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (action.type === 'info') {
      // Info actions are just informational
      setProcessing(null);
      return;
    }

    // Mark as resolved
    setDismissed(prev => new Set(prev).add(action.id));
    setProcessing(null);
  };

  const visibleActions = actions.filter(a => !dismissed.has(a.id));

  return (
    <Widget id="ACTION_REQ" className="border-yellow-500/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base font-bold text-text-main dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-yellow-500">shield</span>
          Recommended Security Actions
        </h3>
        <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-[10px] font-mono text-yellow-600 dark:text-yellow-400 font-bold tracking-wider">
          {visibleActions.length} {visibleActions.length === 1 ? 'PENDING' : 'PENDING'}
        </span>
      </div>
      <div className="space-y-3">
        {visibleActions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/20"
          >
            <span className="material-symbols-outlined text-xl text-green-500">check_circle</span>
            <p className="font-mono text-xs text-green-700 dark:text-green-400">All actions resolved. System is secure.</p>
          </motion.div>
        ) : (
          visibleActions.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-gray-700 group hover:border-primary/30 transition-colors"
            >
              <span className="material-symbols-outlined text-xl text-yellow-500">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm font-bold text-text-main dark:text-white">{a.title}</p>
                <p className="font-mono text-[10px] text-text-muted dark:text-gray-500">{a.desc}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAction(a)}
                disabled={processing === a.id}
                className={`px-3 py-1.5 font-display font-bold text-[10px] uppercase tracking-wider transition-colors shrink-0 ${
                  processing === a.id
                    ? 'bg-gray-400 text-white cursor-wait'
                    : 'bg-primary text-white hover:bg-green-700'
                }`}
              >
                {processing === a.id ? 'Working...' : 'Fix Now'}
              </motion.button>
            </motion.div>
          ))
        )}
      </div>
    </Widget>
  );
}
