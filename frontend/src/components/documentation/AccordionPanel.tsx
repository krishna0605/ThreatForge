"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useState } from "react";

interface AccordionPanelProps {
  title: string;
  icon?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  badge?: string;
}

export const AccordionPanel = ({ title, icon, defaultOpen = false, children, badge }: AccordionPanelProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="border border-gray-200 dark:border-primary/10 rounded-lg overflow-hidden mb-3 bg-white dark:bg-[#0d1117]/50"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-primary/[0.03] dark:hover:bg-primary/[0.05] transition-colors duration-150 group"
      >
        <div className="flex items-center gap-3">
          {icon && (
            <span className="material-icons text-primary text-lg group-hover:scale-110 transition-transform duration-200">
              {icon}
            </span>
          )}
          <span className="font-display font-bold text-sm text-text-main dark:text-white">{title}</span>
          {badge && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-[10px] font-bold">
              {badge}
            </span>
          )}
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="material-icons text-gray-400 text-lg"
        >
          expand_more
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-gray-800/50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
