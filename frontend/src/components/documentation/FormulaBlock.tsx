"use client";

import { motion } from "framer-motion";

interface FormulaBlockProps {
  formula: string;
  label: string;
  description?: string;
}

export const FormulaBlock = ({ formula, label, description }: FormulaBlockProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="my-8 glass-panel rounded-xl p-6 border border-primary/10 text-center relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <span className="font-mono text-[9px] text-primary/60 uppercase tracking-[0.3em] block mb-3">{label}</span>
      <div className="font-mono text-sm md:text-base text-text-main dark:text-white leading-relaxed py-2 whitespace-pre-wrap break-words">
        {formula}
      </div>
      {description && (
        <p className="mt-3 font-mono text-xs text-text-muted dark:text-gray-500 max-w-xl mx-auto leading-relaxed">
          {description}
        </p>
      )}
    </motion.div>
  );
};
