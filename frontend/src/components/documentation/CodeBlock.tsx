"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface CodeBlockProps {
  code: string;
  language: string;
  title?: string;
}

export const CodeBlock = ({ code, language, title }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="my-6 rounded-lg overflow-hidden border border-gray-100 dark:border-primary/10 bg-[#0d1117] shadow-xl"
    >
      {/* Header */}
      <div className="px-4 py-2 bg-gray-900 flex justify-between items-center border-b border-gray-800">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
        </div>
        <div className="font-mono text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-2">
          {title && <span className="text-gray-400">{title}</span>}
          {language}
        </div>
        <button
          onClick={copyToClipboard}
          className="text-gray-500 hover:text-white transition-colors duration-150"
        >
          <span className="material-icons text-sm">{copied ? "check" : "content_copy"}</span>
        </button>
      </div>

      {/* Code */}
      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-xs md:text-sm leading-relaxed text-gray-300">
          <code>{code}</code>
        </pre>
      </div>
    </motion.div>
  );
};
