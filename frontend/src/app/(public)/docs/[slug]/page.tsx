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
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,143,57,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,143,57,0.025) 1px, transparent 1px)
          `,
          backgroundSize: "10px 10px",
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
      <div className="max-w-7xl mx-auto px-5 md:px-10 flex flex-col min-h-screen relative z-10">
        <Header />

        <main className="flex-grow pt-8 pb-16">
          {/* ── Breadcrumb Bar ─── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 mb-8 font-mono text-xs text-text-muted dark:text-gray-500"
          >
            <Link href="/docs" className="hover:text-primary transition-colors no-underline flex items-center gap-1">
              <span className="material-icons text-sm">home</span>
              <span>Docs</span>
            </Link>
            <span className="material-icons text-[14px]">chevron_right</span>
            <span className="text-text-muted dark:text-gray-600">{section.group}</span>
            <span className="material-icons text-[14px]">chevron_right</span>
            <span className="text-primary font-medium">{section.title}</span>
          </motion.div>

          {/* ── Layout: Sidebar + Content ─── */}
          <div className="flex gap-10">
            {/* Sidebar TOC */}
            <aside className="hidden lg:block w-60 shrink-0">
              <nav className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-3 scrollbar-hide">
                {/* Back button */}
                <Link
                  href="/docs"
                  className="flex items-center gap-2 mb-6 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700/50 hover:border-primary/40 bg-white/30 dark:bg-white/[0.02] text-xs font-mono text-text-muted dark:text-gray-400 hover:text-primary transition-all no-underline group"
                >
                  <span className="material-icons text-sm group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
                  All Sections
                </Link>

                {/* Section header */}
                <div className="flex items-center gap-2 mb-4 px-3">
                  <span className="text-[10px] font-mono text-text-muted dark:text-gray-600 tracking-[0.2em] uppercase">
                    Navigation
                  </span>
                  <div className="flex-grow h-px bg-gray-200 dark:bg-gray-700/50" />
                </div>

                {/* Section list */}
                <ul className="space-y-1">
                  {docSections.map((s, i) => {
                    const isActive = s.slug === slug;
                    const isCurrentGroup = s.group === section.group;

                    return (
                      <li key={s.slug}>
                        <Link
                          href={`/docs/${s.slug}`}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono no-underline transition-all duration-200 group ${
                            isActive
                              ? "bg-primary/10 text-primary border border-primary/20 font-bold"
                              : isCurrentGroup
                              ? "text-text-main dark:text-gray-300 hover:bg-primary/5 hover:text-primary border border-transparent"
                              : "text-text-muted dark:text-gray-500 hover:text-text-main dark:hover:text-gray-300 border border-transparent"
                          }`}
                        >
                          {/* Active indicator */}
                          {isActive && (
                            <motion.div
                              layoutId="sidebar-active"
                              className="w-1 h-4 bg-primary rounded-full shrink-0"
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                          )}
                          <span className={`font-mono text-[10px] ${isActive ? "text-primary" : "text-gray-400 dark:text-gray-600"} shrink-0 w-4 text-right`}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className={`truncate ${isActive ? "" : "group-hover:translate-x-0.5 transition-transform"}`}>
                            {s.title}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                {/* Terminal footer */}
                <div className="mt-6 px-3 pt-4 border-t border-gray-200 dark:border-gray-700/30">
                  <div className="font-mono text-[9px] text-text-muted dark:text-gray-600 leading-relaxed">
                    <span className="text-primary">$</span> systemctl status forge-docs
                    <br />
                    <span className="text-green-500">●</span> active (running)
                    <br />
                    <span className="text-primary">$</span> Section {sectionIndex + 1} of {docSections.length}
                  </div>
                </div>
              </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-grow max-w-3xl overflow-hidden">
              {/* Section header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.gradient}/10 border border-gray-200/50 dark:border-gray-700/30 flex items-center justify-center`}>
                    <span className={`material-icons ${section.color} text-2xl`}>{section.icon}</span>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] text-text-muted dark:text-gray-500 tracking-widest uppercase mb-0.5">
                      Section {String(sectionIndex + 1).padStart(2, "0")} · {section.group}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-display font-bold text-text-main dark:text-white">
                      {section.title}
                    </h1>
                  </div>
                </div>
                <p className="font-mono text-sm text-text-muted dark:text-gray-400 ml-[60px]">
                  {section.description}
                </p>
              </motion.div>

              {/* Section Content */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <SectionComponent />
              </motion.div>

              {/* ── Prev / Next Navigation ─── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700/30"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Previous */}
                  {prev ? (
                    <Link
                      href={`/docs/${prev.slug}`}
                      className="group glass-panel p-5 border border-gray-200 dark:border-gray-700/50 hover:border-primary/40 transition-all duration-300 no-underline"
                    >
                      <div className="flex items-center gap-2 mb-2 text-text-muted dark:text-gray-500 font-mono text-[10px] tracking-widest uppercase">
                        <span className="material-icons text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        Previous
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`material-icons ${prev.color} text-lg`}>{prev.icon}</span>
                        <span className="font-display font-bold text-text-main dark:text-white group-hover:text-primary transition-colors">
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
                      className="group glass-panel p-5 border border-gray-200 dark:border-gray-700/50 hover:border-primary/40 transition-all duration-300 no-underline text-right"
                    >
                      <div className="flex items-center justify-end gap-2 mb-2 text-text-muted dark:text-gray-500 font-mono text-[10px] tracking-widest uppercase">
                        Next
                        <span className="material-icons text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        <span className="font-display font-bold text-text-main dark:text-white group-hover:text-primary transition-colors">
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
                        <span className="font-display font-bold text-primary">
                          Back to Table of Contents
                        </span>
                        <span className="material-icons text-primary text-lg">home</span>
                      </div>
                    </Link>
                  )}
                </div>
              </motion.div>

              {/* Mobile nav to all sections */}
              <div className="lg:hidden mt-8">
                <Link
                  href="/docs"
                  className="flex items-center justify-center gap-2 py-3 glass-panel border border-gray-200 dark:border-gray-700/50 hover:border-primary/30 font-mono text-xs text-text-muted dark:text-gray-400 hover:text-primary transition-all no-underline"
                >
                  <span className="material-icons text-sm">grid_view</span>
                  View All Sections
                </Link>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
