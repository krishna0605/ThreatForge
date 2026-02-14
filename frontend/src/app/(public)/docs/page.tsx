"use client";

import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { docSections, docGroups } from "./sections";

/* ───── Animation Variants ───── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const cardVariant = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

/* ───── Group Icons ───── */
const groupConfig: Record<string, { icon: string; color: string }> = {
  Foundation: { icon: "foundation", color: "text-primary" },
  Architecture: { icon: "architecture", color: "text-blue-500" },
  Security: { icon: "shield", color: "text-red-500" },
  "Detection Engine": { icon: "radar", color: "text-amber-500" },
  "Frontend & API": { icon: "web", color: "text-cyan-500" },
  Operations: { icon: "engineering", color: "text-yellow-500" },
  Reliability: { icon: "health_and_safety", color: "text-orange-500" },
  Engineering: { icon: "code", color: "text-blue-500" },
  Reference: { icon: "menu_book", color: "text-gray-400" },
};

/* ───── Component ───── */
export default function DocsPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

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

      {/* ── Ambient Glow Orbs ─── */}
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-20%] right-[10%] w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[10%] w-[700px] h-[700px] bg-blue-500/[0.03] rounded-full blur-[160px]" />
        <div className="absolute top-[50%] left-[50%] w-[400px] h-[400px] bg-primary/[0.02] rounded-full blur-[200px]" />
      </div>

      {/* ── CRT Scanline ─── */}
      <div className="fixed inset-0 crt-overlay z-50 opacity-20 pointer-events-none" />

      {/* ── Main Content ─── */}
      <div className="max-w-7xl mx-auto px-5 md:px-10 flex flex-col min-h-screen relative z-10">
        <Header />

        <main className="flex-grow">
          {/* ═══════════════ HERO ═══════════════ */}
          <section ref={heroRef} className="relative pt-16 pb-20">
            <motion.div
              style={{ y: heroY, opacity: heroOpacity }}
              className="text-center max-w-4xl mx-auto"
            >
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-8"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <span className="font-mono text-xs text-primary tracking-widest uppercase">Documentation</span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={1}
                className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-text-main dark:text-white leading-[1.1] mb-6"
              >
                The Definitive{" "}
                <span className="relative inline-block">
                  <span className="text-primary">Compendium</span>
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1, delay: 1.2, ease: "easeOut" }}
                    className="absolute bottom-1 left-0 h-[3px] bg-primary/40 rounded-full"
                  />
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={2}
                className="text-lg md:text-xl font-mono text-text-muted dark:text-gray-400 leading-relaxed max-w-2xl mx-auto mb-10"
              >
                A comprehensive technical reference covering every aspect of{" "}
                <span className="text-primary font-bold">ThreatForge</span> — from architecture
                to machine learning to deployment.
              </motion.p>

              {/* Terminal line */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={3}
                className="inline-flex items-center gap-3 font-mono text-xs text-text-muted dark:text-gray-500"
              >
                <span className="w-8 h-px bg-gray-300 dark:bg-gray-600" />
                <span className="text-primary">$</span> cat /docs/table-of-contents.json
                <span className="animate-pulse text-primary">█</span>
                <span className="w-8 h-px bg-gray-300 dark:bg-gray-600" />
              </motion.div>

              {/* Stats row */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={4}
                className="flex justify-center gap-8 mt-10"
              >
                {[
                  { label: "Sections", value: "23" },
                  { label: "Components", value: "12" },
                  { label: "Topics", value: "70+" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-2xl font-display font-bold text-primary">{stat.value}</div>
                    <div className="text-[10px] font-mono text-text-muted dark:text-gray-500 uppercase tracking-[0.15em]">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Background accent circles */}
            <div className="absolute top-20 right-10 w-32 h-32 border border-primary/10 rounded-full animate-[spin_30s_linear_infinite] pointer-events-none" />
            <div className="absolute bottom-20 left-10 w-48 h-48 border border-primary/10 rounded-full animate-[spin_40s_linear_infinite_reverse] pointer-events-none" />
          </section>

          {/* ═══════════════ SECTIONS BY GROUP ═══════════════ */}
          {docGroups.map((group, gi) => {
            const sections = docSections.filter((s) => s.group === group);
            const gc = groupConfig[group] || { icon: "folder", color: "text-gray-400" };

            return (
              <section key={group} className="mb-16 last:mb-32">
                {/* Group header */}
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  custom={0}
                  className="flex items-center gap-3 mb-8"
                >
                  <div className={`w-10 h-10 rounded-xl bg-white/5 border border-gray-200 dark:border-gray-700/50 flex items-center justify-center`}>
                    <span className={`material-icons ${gc.color} text-xl`}>{gc.icon}</span>
                  </div>
                  <h2 className="text-2xl font-display font-bold text-text-main dark:text-white tracking-tight">
                    {group}
                  </h2>
                  <div className="flex-grow h-px bg-gradient-to-r from-gray-200 dark:from-gray-700/50 to-transparent ml-4" />
                  <span className="font-mono text-[10px] text-text-muted dark:text-gray-500 tracking-widest">
                    {sections.length} {sections.length === 1 ? "SECTION" : "SECTIONS"}
                  </span>
                </motion.div>

                {/* Section cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {sections.map((section, si) => (
                    <motion.div
                      key={section.slug}
                      variants={cardVariant}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, amount: 0.1 }}
                      custom={gi * 3 + si}
                    >
                      <Link
                        href={`/docs/${section.slug}`}
                        className="block group no-underline"
                      >
                        <div className="relative glass-panel p-6 border border-gray-200 dark:border-gray-700/50 hover:border-primary/40 transition-all duration-300 h-full overflow-hidden">
                          {/* Hover glow */}
                          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                          {/* Top accent bar */}
                          <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${section.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                          {/* Section number badge */}
                          <div className="absolute top-4 right-4 font-mono text-[10px] text-text-muted dark:text-gray-600 tracking-widest">
                            {String(docSections.indexOf(section) + 1).padStart(2, "0")}
                          </div>

                          {/* Icon */}
                          <div className="relative z-10 mb-4">
                            <motion.div
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              transition={{ type: "spring", stiffness: 300 }}
                              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.gradient}/10 border border-gray-200/50 dark:border-gray-700/30 flex items-center justify-center`}
                            >
                              <span className={`material-icons ${section.color} text-2xl`}>
                                {section.icon}
                              </span>
                            </motion.div>
                          </div>

                          {/* Title */}
                          <h3 className="relative z-10 text-lg font-display font-bold text-text-main dark:text-white mb-2 group-hover:text-primary transition-colors duration-300">
                            {section.title}
                          </h3>

                          {/* Description */}
                          <p className="relative z-10 font-mono text-xs text-text-muted dark:text-gray-400 leading-relaxed line-clamp-2">
                            {section.description}
                          </p>

                          {/* Read arrow */}
                          <div className="relative z-10 flex items-center gap-2 mt-4 text-primary opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-1 transition-all duration-300">
                            <span className="font-mono text-[10px] tracking-widest uppercase">Read</span>
                            <span className="material-icons text-sm">arrow_forward</span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </section>
            );
          })}
        </main>

        <Footer />
      </div>
    </div>
  );
}
