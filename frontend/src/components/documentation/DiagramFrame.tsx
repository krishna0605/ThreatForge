"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface DiagramFrameProps {
  title: string;
  children: ReactNode;
  variant?: "default" | "dark";
}

export const DiagramFrame = ({ title, children, variant = "default" }: DiagramFrameProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`my-8 rounded-xl overflow-hidden border shadow-lg ${
        variant === "dark"
          ? "border-gray-700 bg-[#0d1117]"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0d1117]"
      }`}
    >
      <div className="bg-gray-50 dark:bg-gray-800/50 px-5 py-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
          {title}
        </span>
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400/20 border border-red-400/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/20 border border-yellow-400/50" />
          <div className="w-3 h-3 rounded-full bg-green-400/20 border border-green-400/50" />
        </div>
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  );
};
