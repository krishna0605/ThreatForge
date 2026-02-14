"use client";

import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { docSections, getSectionBySlug, getAdjacentSections } from "../sections";

export default function DocSectionPage() {
  const params = useParams();
  const slug = params.slug as string;
  const section = getSectionBySlug(slug);
  const { prev, next } = getAdjacentSections(slug);
  const sectionIndex = docSections.findIndex((s) => s.slug === slug);

  if (!section) {
    return (
      <div className="min-h-screen relative overflow-x-hidden selection:bg-primary selection:text-white">
        <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundImage: `linear-gradient(rgba(0,143,57,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0,143,57,0.07) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
        <div className="fixed inset-0 crt-overlay z-50 opacity-20 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-5 md:px-10 flex flex-col min-h-screen relative z-10">
          <Header />
          <main className="flex-grow flex items-center justify-center">
            <div className="text-center">
              <span className="material-icons text-primary text-6xl mb-4 block">search_off</span>
              <h1 className="text-3xl font-display font-bold text-text-main dark:text-white mb-4">Section Not Found</h1>
              <p className="font-mono text-sm text-text-muted dark:text-gray-400 mb-8">The requested documentation section does not exist.</p>
              <Link href="/docs" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold tracking-widest uppercase text-xs hover:bg-primary/90 transition-colors no-underline">
                <span className="material-icons text-sm">arrow_back</span>
                Back to Docs
              </Link>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  const SectionComponent = section.component;

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
        <div className="absolute top-[-15%] left-[5%] w-[700px] h-[700px] bg-primary/[0.04] rounded-full blur-[160px]" />
        <div className="absolute bottom-[-15%] right-[5%] w-[600px] h-[600px] bg-blue-500/[0.03] rounded-full blur-[180px]" />
      </div>

      {/* ── CRT Scanline ─── */}
      <div className="fixed inset-0 crt-overlay z-50 opacity-20 pointer-events-none" />

      {/* ── Content ─── */}
      <div className="max-w-5xl mx-auto px-5 md:px-10 flex flex-col min-h-screen relative z-10">
        <Header />

        <main className="flex-grow pt-6 pb-16">
          {/* ── Top bar: back + breadcrumb ─── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-3 font-mono text-xs text-text-muted dark:text-gray-500">
              <Link
                href="/docs"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700/50 hover:border-primary/40 hover:text-primary transition-all no-underline group"
              >
                <span className="material-icons text-sm group-hover:-translate-x-0.5 transition-transform duration-200">arrow_back</span>
                <span>All Sections</span>
              </Link>
              <span className="text-gray-300 dark:text-gray-700">/</span>
              <span className="text-text-muted dark:text-gray-600">{section.group}</span>
              <span className="text-gray-300 dark:text-gray-700">/</span>
              <span className="text-primary font-medium">{section.title}</span>
            </div>

            <span className="font-mono text-[10px] text-text-muted dark:text-gray-600 hidden sm:block">
              {sectionIndex + 1} / {docSections.length}
            </span>
          </motion.div>

          {/* ── Section Header ─── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center gap-4 mb-10 pb-8 border-b border-gray-200 dark:border-gray-700/30"
          >
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${section.gradient} flex items-center justify-center shrink-0 shadow-lg`}>
              <span className="material-icons text-white text-2xl">{section.icon}</span>
            </div>
            <div>
              <div className="font-mono text-[10px] text-text-muted dark:text-gray-500 tracking-widest uppercase mb-1">
                Section {String(sectionIndex + 1).padStart(2, "0")} · {section.group}
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-text-main dark:text-white leading-tight">
                {section.title}
              </h1>
              <p className="font-mono text-sm text-text-muted dark:text-gray-400 mt-1">{section.description}</p>
            </div>
          </motion.div>

          {/* ── Section Content (full width, no sidebar) ─── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
            className="max-w-none"
          >
            <SectionComponent />
          </motion.div>

          {/* ── Prev / Next Navigation ─── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
            className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700/30"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Previous */}
              {prev ? (
                <Link
                  href={`/docs/${prev.slug}`}
                  className="group glass-panel p-5 border border-gray-200 dark:border-gray-700/50 hover:border-primary/30 transition-all duration-300 no-underline"
                >
                  <div className="flex items-center gap-2 mb-2 text-text-muted dark:text-gray-500 font-mono text-[10px] tracking-widest uppercase">
                    <span className="material-icons text-sm group-hover:-translate-x-1 transition-transform duration-200">arrow_back</span>
                    Previous
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`material-icons ${prev.color} text-lg`}>{prev.icon}</span>
                    <span className="text-sm font-display font-bold text-text-main dark:text-white group-hover:text-primary transition-colors">
                      {prev.title}
                    </span>
                  </div>
                </Link>
              ) : (
                <div />
              )}

              {/* Next */}
              {next ? (
                <Link
                  href={`/docs/${next.slug}`}
                  className="group glass-panel p-5 border border-gray-200 dark:border-gray-700/50 hover:border-primary/30 transition-all duration-300 no-underline text-right"
                >
                  <div className="flex items-center justify-end gap-2 mb-2 text-text-muted dark:text-gray-500 font-mono text-[10px] tracking-widest uppercase">
                    Next
                    <span className="material-icons text-sm group-hover:translate-x-1 transition-transform duration-200">arrow_forward</span>
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <span className="text-sm font-display font-bold text-text-main dark:text-white group-hover:text-primary transition-colors">
                      {next.title}
                    </span>
                    <span className={`material-icons ${next.color} text-lg`}>{next.icon}</span>
                  </div>
                </Link>
              ) : (
                <Link
                  href="/docs"
                  className="group glass-panel p-5 border border-primary/20 hover:border-primary/40 bg-primary/5 transition-all duration-300 no-underline text-right"
                >
                  <div className="flex items-center justify-end gap-2 mb-2 text-primary font-mono text-[10px] tracking-widest uppercase">
                    Complete
                    <span className="material-icons text-sm">check_circle</span>
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <span className="text-sm font-display font-bold text-primary">Back to Table of Contents</span>
                    <span className="material-icons text-primary text-lg">home</span>
                  </div>
                </Link>
              )}
            </div>
          </motion.div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
