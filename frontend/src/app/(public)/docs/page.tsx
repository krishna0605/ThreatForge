"use client";

import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";

/* ───── Animation Variants ───── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, delay: i * 0.1, type: "spring" as const, stiffness: 100 },
  }),
};

/* ───── Data ───── */
const docCategories = [
  {
    title: "Getting Started",
    icon: "flag",
    description: "Installation, configuration, and your first scan.",
    articles: ["Quick Start Guide", "System Requirements", "CLI Installation", "Docker Deployment"],
    color: "text-primary",
    borderColor: "group-hover:border-primary/40",
    bg: "bg-primary/5",
  },
  {
    title: "Core Concepts",
    icon: "lightbulb",
    description: "Understand the technology behind ThreatForge.",
    articles: ["Architecture Overview", "AI Detection Engine", "Threat Scoring Model", "Zero-Trust Principles"],
    color: "text-secondary",
    borderColor: "group-hover:border-secondary/40",
    bg: "bg-secondary/5",
  },
  {
    title: "API Reference",
    icon: "api",
    description: "Complete reference for our REST and GraphQL APIs.",
    articles: ["Authentication", "Scan Endpoints", "Report Data", "Webhooks"],
    color: "text-blue-400",
    borderColor: "group-hover:border-blue-400/40",
    bg: "bg-blue-400/5",
  },
  {
    title: "Guides & Tutorials",
    icon: "school",
    description: "Step-by-step tutorials for common security scenarios.",
    articles: ["Setting up CI/CD", "Custom Rule Creation", "Integrating with Slack", "Audit Logs"],
    color: "text-purple-400",
    borderColor: "group-hover:border-purple-400/40",
    bg: "bg-purple-400/5",
  },
];

const quickLinks = [
  { label: "Install CLI", code: "npm install -g threatforge-cli" },
  { label: "Docker Pull", code: "docker pull threatforge/scanner" },
  { label: "Python SDK", code: "pip install threatforge-sdk" },
];

/* ───── Component ───── */
export default function DocsPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  
  const [searchQuery, setSearchQuery] = useState("");

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
      
      {/* ── Ambient Glow Orbs ─── */}
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-20%] right-[10%] w-[600px] h-[600px] bg-primary/[0.04] rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[10%] w-[700px] h-[700px] bg-blue-500/[0.03] rounded-full blur-[160px]" />
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
              className="text-center max-w-3xl mx-auto"
            >
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/5 mb-6"
              >
                <span className="material-icons text-blue-400 text-sm">library_books</span>
                <span className="font-mono text-xs text-blue-400 tracking-widest uppercase">Documentation Hub</span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={1}
                className="text-4xl md:text-6xl font-display font-bold text-text-main dark:text-white mb-6"
              >
                How can we <span className="text-primary">help</span> you?
              </motion.h1>

              {/* Search Bar */}
              <motion.div 
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={2}
                className="relative max-w-2xl mx-auto mb-10 group"
              >
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center bg-white/50 dark:bg-black/40 border border-gray-200 dark:border-gray-700 backdrop-blur-md rounded-full px-6 py-4 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all duration-300">
                  <span className="material-icons text-text-muted dark:text-gray-400 mr-3">search</span>
                  <input 
                    type="text" 
                    placeholder="Search guides, API docs, or error codes..." 
                    className="flex-grow bg-transparent border-none outline-none font-mono text-sm text-text-main dark:text-white placeholder:text-text-muted dark:placeholder:text-gray-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-text-muted border border-gray-200 dark:border-gray-700 rounded px-2 py-1">
                    <span>CTRL</span><span>K</span>
                  </div>
                </div>
              </motion.div>

              {/* Quick Install Copy */}
              <motion.div
                 variants={fadeUp}
                 initial="hidden"
                 animate="visible"
                 custom={3}
                 className="flex flex-wrap justify-center gap-4"
              >
                {quickLinks.map((link) => (
                  <div key={link.label} className="flex items-center gap-3 px-4 py-2 bg-black/5 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-gray-800 backdrop-blur-sm group cursor-pointer hover:border-primary/30 transition-colors">
                    <span className="text-xs font-bold text-text-muted dark:text-gray-400 uppercase tracking-wider">{link.label}</span>
                    <span className="w-px h-3 bg-gray-300 dark:bg-gray-700" />
                    <code className="font-mono text-xs text-primary">{link.code}</code>
                    <span className="material-icons text-[14px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity -ml-1">content_copy</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </section>

          {/* ═══════════════ CATEGORIES GRID ═══════════════ */}
          <section className="mb-32">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {docCategories.map((cat, i) => (
                  <motion.div
                    key={cat.title}
                    variants={scaleIn}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    custom={i}
                    whileHover={{ y: -4 }}
                    className="group relative glass-panel p-8 border border-gray-200 dark:border-gray-700/50 hover:border-primary/30 overflow-hidden cursor-default transition-all duration-300"
                  >
                    <div className={`absolute top-0 right-0 p-3 rounded-bl-2xl ${cat.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                      <span className="material-icons text-primary/40 text-lg">arrow_outward</span>
                    </div>

                    <div className="flex items-start gap-4 mb-6">
                      <div className={`p-3 rounded-xl ${cat.bg} border border-transparent ${cat.borderColor}`}>
                        <span className={`material-icons ${cat.color} text-2xl`}>{cat.icon}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-display font-bold text-text-main dark:text-white mb-1 group-hover:text-primary transition-colors">
                          {cat.title}
                        </h3>
                        <p className="font-mono text-xs text-text-muted dark:text-gray-400">
                          {cat.description}
                        </p>
                      </div>
                    </div>

                    <ul className="space-y-3">
                      {cat.articles.map((article) => (
                        <li key={article} className="flex items-center gap-2 group/link cursor-pointer">
                          <span className="material-icons text-[14px] text-text-muted group-hover/link:text-primary transition-colors">description</span>
                          <span className="text-sm text-text-main dark:text-gray-300 font-medium group-hover/link:text-primary group-hover/link:underline decoration-primary/30 underline-offset-4 transition-all">
                            {article}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
             </div>
          </section>

          {/* ═══════════════ HELP FOOTER ═══════════════ */}
          <section className="mb-20">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="glass-panel p-8 border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6"
            >
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <span className="material-icons text-yellow-500">support_agent</span>
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-text-main dark:text-white">Still need help?</h4>
                    <p className="font-mono text-xs text-text-muted dark:text-gray-400">Our support team is available 24/7 for enterprise customers.</p>
                  </div>
               </div>
               <div className="flex gap-4">
                  <button className="px-6 py-2 rounded-lg bg-transparent border border-gray-300 dark:border-gray-700 hover:border-primary hover:text-primary transition-colors text-sm font-bold uppercase tracking-wide">
                    Contact Support
                  </button>
                  <button className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors text-sm font-bold uppercase tracking-wide">
                    Join Discord
                  </button>
               </div>
            </motion.div>
          </section>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
