"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface DataTableProps {
  headers: string[];
  rows: (string | ReactNode)[][];
  caption?: string;
  highlightColumn?: number;
  compact?: boolean;
}

export const DataTable = ({ headers, rows, caption, highlightColumn, compact = false }: DataTableProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="my-8 rounded-xl overflow-hidden border border-gray-200 dark:border-primary/10 shadow-xl"
    >
      {caption && (
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <span className="font-mono text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] font-bold">{caption}</span>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100 dark:bg-[#0d1117] border-b border-gray-200 dark:border-gray-800">
              {headers.map((header, i) => (
                <th
                  key={i}
                  className={`${compact ? "px-3 py-2" : "px-5 py-3"} font-mono text-[10px] uppercase tracking-[0.15em] font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap ${
                    highlightColumn === i ? "text-primary dark:text-primary" : ""
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-[#0d1117]">
            {rows.map((row, rowIdx) => (
              <motion.tr
                key={rowIdx}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: rowIdx * 0.03 }}
                className="border-b border-gray-100 dark:border-gray-800/50 last:border-0 hover:bg-primary/[0.03] dark:hover:bg-primary/[0.05] transition-colors group cursor-default"
              >
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className={`${compact ? "px-3 py-2" : "px-5 py-3"} font-mono text-xs text-gray-700 dark:text-gray-300 ${
                      cellIdx === 0 ? "font-semibold text-gray-900 dark:text-white" : ""
                    } ${highlightColumn === cellIdx ? "text-primary dark:text-primary font-bold" : ""}`}
                  >
                    {cell}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
