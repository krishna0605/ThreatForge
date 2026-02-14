"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface DocSectionProps {
  children: ReactNode;
  id?: string;
  className?: string;
  delay?: number;
}

export const DocSection = ({ children, id, className, delay = 0 }: DocSectionProps) => {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`relative py-16 border-b border-gray-100 dark:border-primary/5 last:border-0 ${className}`}
    >
      {children}
    </motion.section>
  );
};

export default DocSection;
