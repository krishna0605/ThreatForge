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
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="my-8 rounded-xl overflow-hidden border border-gray-200 dark:border-primary/10"
    >
      {caption && (
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <span className="font-mono text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] font-bold">{caption}</span>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
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
              <tr
                key={rowIdx}
                className="border-b border-gray-100 dark:border-gray-800/50 last:border-0 hover:bg-primary/[0.03] dark:hover:bg-primary/[0.05] transition-colors duration-150"
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
