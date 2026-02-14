"use client";

import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { motion } from "framer-motion";
import Link from "next/link";
import { docSections, docGroups } from "./sections";

/* ───── Group Config ───── */
const groupConfig: Record<string, { icon: string; color: string; bg: string }> = {
  Foundation:        { icon: "foundation",         color: "text-primary",    bg: "bg-primary/10" },
  Architecture:      { icon: "architecture",       color: "text-blue-400",   bg: "bg-blue-500/10" },
  Security:          { icon: "shield",             color: "text-red-400",    bg: "bg-red-500/10" },
  "Detection Engine":{ icon: "radar",              color: "text-amber-400",  bg: "bg-amber-500/10" },
  "Frontend & API":  { icon: "web",                color: "text-cyan-400",   bg: "bg-cyan-500/10" },
  Operations:        { icon: "engineering",         color: "text-yellow-400", bg: "bg-yellow-500/10" },
  Reliability:       { icon: "health_and_safety",  color: "text-orange-400", bg: "bg-orange-500/10" },
  Engineering:       { icon: "code",               color: "text-indigo-400", bg: "bg-indigo-500/10" },
  Reference:         { icon: "menu_book",          color: "text-gray-400",   bg: "bg-gray-500/10" },
};

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
      <div className="max-w-7xl mx-auto px-5 md:px-10 flex flex-col min-h-screen relative z-10">
        <Header />

        <main className="flex-grow pt-8 pb-12">
          {/* ── Header Row ─── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <span className="font-mono text-[10px] text-primary tracking-[0.3em] uppercase">Documentation</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-text-main dark:text-white">
                The Definitive <span className="text-primary">Compendium</span>
              </h1>
              <p className="font-mono text-xs text-text-muted dark:text-gray-500 mt-1">
                23 sections · 12 components · Comprehensive technical reference
              </p>
            </div>

            {/* Terminal badge */}
            <div className="font-mono text-[10px] text-text-muted dark:text-gray-600 flex items-center gap-2">
              <span className="text-primary">$</span> cat /docs/index <span className="animate-pulse text-primary">█</span>
            </div>
          </motion.div>

          {/* ── Table ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="glass-panel border border-gray-200 dark:border-gray-700/40 overflow-hidden"
          >
            {/* Table Header */}
            <div className="grid grid-cols-[44px_1fr_1fr_100px] md:grid-cols-[50px_260px_1fr_120px] items-center gap-0 px-5 py-3 border-b border-gray-200 dark:border-gray-700/30 bg-black/[0.02] dark:bg-white/[0.015]">
              <span className="font-mono text-[9px] text-text-muted dark:text-gray-600 tracking-widest uppercase">#</span>
              <span className="font-mono text-[9px] text-text-muted dark:text-gray-600 tracking-widest uppercase">Section</span>
              <span className="font-mono text-[9px] text-text-muted dark:text-gray-600 tracking-widest uppercase hidden md:block">Description</span>
              <span className="font-mono text-[9px] text-text-muted dark:text-gray-600 tracking-widest uppercase text-right">Group</span>
            </div>

            {/* Table Groups */}
            {docGroups.map((group) => {
              const sections = docSections.filter((s) => s.group === group);
              const gc = groupConfig[group] || { icon: "folder", color: "text-gray-400", bg: "bg-gray-500/10" };

              return (
                <div key={group}>
                  {/* Group separator row */}
                  <div className="flex items-center gap-3 px-5 py-2 bg-black/[0.015] dark:bg-white/[0.01] border-b border-gray-100 dark:border-gray-800/50">
                    <div className={`w-6 h-6 rounded-md ${gc.bg} flex items-center justify-center`}>
                      <span className={`material-icons ${gc.color} text-sm`}>{gc.icon}</span>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-text-main dark:text-gray-300 tracking-wider uppercase">
                      {group}
                    </span>
                    <div className="flex-grow h-px bg-gray-100 dark:bg-gray-800/50" />
                    <span className="font-mono text-[9px] text-text-muted dark:text-gray-600">
                      {sections.length}
                    </span>
                  </div>

                  {/* Section rows */}
                  {sections.map((section, si) => {
                    const globalIndex = docSections.indexOf(section);
                    return (
                      <Link
                        key={section.slug}
                        href={`/docs/${section.slug}`}
                        className="no-underline block group"
                      >
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: globalIndex * 0.02 }}
                          className="grid grid-cols-[44px_1fr_1fr_100px] md:grid-cols-[50px_260px_1fr_120px] items-center gap-0 px-5 py-3 border-b border-gray-100/80 dark:border-gray-800/30 hover:bg-primary/[0.03] dark:hover:bg-primary/[0.04] transition-colors duration-200 cursor-pointer"
                        >
                          {/* Number */}
                          <span className="font-mono text-[11px] text-text-muted dark:text-gray-600 tabular-nums group-hover:text-primary transition-colors">
                            {String(globalIndex + 1).padStart(2, "0")}
                          </span>

                          {/* Title with icon */}
                          <div className="flex items-center gap-3 min-w-0 pr-4">
                            <span className={`material-icons ${section.color} text-lg shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                              {section.icon}
                            </span>
                            <span className="text-sm font-display font-semibold text-text-main dark:text-white group-hover:text-primary transition-colors truncate">
                              {section.title}
                            </span>
                          </div>

                          {/* Description */}
                          <span className="font-mono text-[11px] text-text-muted dark:text-gray-500 truncate hidden md:block pr-4">
                            {section.description}
                          </span>

                          {/* Group tag + arrow */}
                          <div className="flex items-center justify-end gap-2">
                            <span className={`hidden sm:inline px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider ${gc.bg} ${gc.color}`}>
                              {group.split(" ")[0].toUpperCase()}
                            </span>
                            <span className="material-icons text-sm text-text-muted dark:text-gray-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200">
                              arrow_forward
                            </span>
                          </div>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </motion.div>

          {/* ── Footer info ─── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-between mt-4 px-2"
          >
            <span className="font-mono text-[10px] text-text-muted dark:text-gray-600">
              {docSections.length} sections · Click any row to read
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
