"use client";

import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { motion } from "framer-motion";
import Link from "next/link";
import { docSections } from "./sections";

const COLS = 4;

export default function DocsPage() {
  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-primary selection:text-white">
      {/* ── Grid Background ─── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,143,57,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,143,57,0.07) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* ── Ambient Glow ─── */}
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-20%] right-[10%] w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[10%] w-[700px] h-[700px] bg-blue-500/[0.03] rounded-full blur-[160px]" />
      </div>

      {/* ── CRT Scanline ─── */}
      <div className="fixed inset-0 crt-overlay z-50 opacity-20 pointer-events-none" />

      {/* ── Content ─── */}
      <div className="max-w-6xl mx-auto px-5 md:px-10 flex flex-col min-h-screen relative z-10">
        <Header />

        <main className="flex-grow flex flex-col justify-center py-8">
          {/* ── Title Row ─── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex items-end justify-between mb-8"
          >
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <span className="font-mono text-[10px] text-primary tracking-[0.3em] uppercase">
                  Documentation
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-text-main dark:text-white">
                The Definitive <span className="text-primary">Compendium</span>
              </h1>
            </div>
            <span className="font-mono text-[10px] text-text-muted dark:text-gray-600 hidden sm:flex items-center gap-1.5">
              <span className="text-primary">$</span> cat /docs/index
              <span className="animate-pulse text-primary">█</span>
            </span>
          </motion.div>

          {/* ── Section Grid ─── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="glass-panel border border-gray-200 dark:border-gray-700/40 overflow-hidden"
          >
            {/* Header row */}
            <div className="px-5 py-2.5 border-b border-gray-200 dark:border-gray-700/30 bg-black/[0.02] dark:bg-white/[0.015] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-icons text-primary text-sm">menu_book</span>
                <span className="font-mono text-[10px] text-text-muted dark:text-gray-500 tracking-widest uppercase">
                  Table of Contents
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-[10px] text-text-muted dark:text-gray-600">
                  {docSections.length} sections
                </span>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500/50" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                  <div className="w-2 h-2 rounded-full bg-green-500/50" />
                </div>
              </div>
            </div>

            {/* Grid of sections */}
            <div
              className="grid gap-px bg-gray-100 dark:bg-gray-800/30"
              style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
            >
              {docSections.map((section, i) => (
                <Link
                  key={section.slug}
                  href={`/docs/${section.slug}`}
                  className="no-underline block group"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.02, ease: "easeOut" }}
                    className="flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-[#0d1117] hover:bg-primary/[0.04] dark:hover:bg-primary/[0.06] transition-colors duration-150 cursor-pointer"
                  >
                    {/* Number */}
                    <span className="font-mono text-[10px] text-text-muted dark:text-gray-600 tabular-nums w-5 text-right shrink-0 group-hover:text-primary transition-colors">
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    {/* Icon */}
                    <span className={`material-icons ${section.color} text-lg shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                      {section.icon}
                    </span>

                    {/* Title */}
                    <span className="text-[13px] font-display font-semibold text-text-main dark:text-gray-200 group-hover:text-primary transition-colors truncate">
                      {section.title}
                    </span>

                    {/* Arrow on hover */}
                    <span className="material-icons text-sm text-primary ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 shrink-0">
                      chevron_right
                    </span>
                  </motion.div>
                </Link>
              ))}

              {/* Fill remaining cells to complete the grid */}
              {Array.from({ length: (COLS - (docSections.length % COLS)) % COLS }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-white dark:bg-[#0d1117] px-4 py-3.5" />
              ))}
            </div>
          </motion.div>

          {/* ── Footer info ─── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-between mt-3 px-1"
          >
            <span className="font-mono text-[10px] text-text-muted dark:text-gray-600">
              Click any section to read · Navigate with prev/next
            </span>
            <span className="font-mono text-[10px] text-text-muted dark:text-gray-600">
              <span className="text-green-500">●</span> All sections loaded
            </span>
          </motion.div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
