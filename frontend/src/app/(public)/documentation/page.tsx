"use client";

import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { AccordionPanel } from "@/components/documentation/AccordionPanel";
import { Scorecard } from "@/components/documentation/Scorecard";

/* ─── Animation Variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

/* ─── Data ─── */
const NAV_SECTIONS = [
  { id: "overview", label: "Overview", icon: "shield" },
  { id: "architecture", label: "Architecture", icon: "hub" },
  { id: "tech-stack", label: "Tech Stack", icon: "code" },
  { id: "security", label: "Security", icon: "lock" },
  { id: "detection", label: "Detection", icon: "radar" },
  { id: "database", label: "Database", icon: "storage" },
  { id: "api", label: "API", icon: "api" },
  { id: "roadmap", label: "Roadmap", icon: "rocket_launch" },
];

const TECH_STACK = [
  { category: "Frontend", items: [
    { name: "Next.js 16", icon: "web", desc: "App Router, RSC, Streaming SSR", color: "from-black to-gray-700" },
    { name: "React 19", icon: "widgets", desc: "Server Components, React Compiler", color: "from-cyan-500 to-blue-500" },
    { name: "Tailwind CSS 4", icon: "palette", desc: "Utility-first styling engine", color: "from-teal-400 to-cyan-500" },
    { name: "Framer Motion 12", icon: "animation", desc: "Spring physics animations", color: "from-purple-500 to-pink-500" },
  ]},
  { category: "Backend", items: [
    { name: "Python 3.11", icon: "terminal", desc: "PEP 659 adaptive interpreter, +25% speed", color: "from-yellow-500 to-blue-500" },
    { name: "Flask 3.1", icon: "dns", desc: "Blueprint architecture, WSGI", color: "from-gray-600 to-gray-800" },
    { name: "FastAPI", icon: "bolt", desc: "ML microservice, async inference", color: "from-green-500 to-teal-500" },
    { name: "Gunicorn + Gevent", icon: "sync", desc: "Pre-fork workers bypass GIL", color: "from-emerald-500 to-green-700" },
  ]},
  { category: "Data & ML", items: [
    { name: "PostgreSQL 16", icon: "database", desc: "MVCC, RLS, ACID, 14 tables", color: "from-blue-600 to-indigo-700" },
    { name: "Redis 7", icon: "cached", desc: "Message broker, pub/sub, cache", color: "from-red-500 to-red-700" },
    { name: "scikit-learn", icon: "psychology", desc: "Random Forest, F1=0.94", color: "from-orange-500 to-amber-600" },
    { name: "YARA Engine", icon: "search", desc: "Aho-Corasick pattern matching", color: "from-rose-500 to-pink-700" },
  ]},
  { category: "Infrastructure", items: [
    { name: "Docker", icon: "inventory_2", desc: "Multi-stage builds, Compose", color: "from-blue-400 to-blue-600" },
    { name: "Supabase", icon: "cloud", desc: "Auth, RLS, Realtime, Storage", color: "from-emerald-400 to-green-600" },
    { name: "Vercel Edge", icon: "language", desc: "Global CDN, edge functions", color: "from-gray-800 to-black" },
    { name: "Grafana Stack", icon: "monitoring", desc: "Prometheus + Loki + Tempo", color: "from-orange-400 to-yellow-600" },
  ]},
];

const SCAN_PIPELINE = [
  { step: 1, title: "File Metadata", desc: "MIME type, size, creation date extraction", icon: "description", time: "~50ms" },
  { step: 2, title: "Shannon Entropy", desc: "H(X) = -Σ P(xᵢ)·log₂P(xᵢ) — randomness detection", icon: "equalizer", time: "~20ms" },
  { step: 3, title: "PE Header Analysis", desc: "Entry point, sections, imports via pefile", icon: "memory", time: "~100ms" },
  { step: 4, title: "YARA Rule Scan", desc: "Aho-Corasick automaton: O(n+m+z) matching", icon: "rule", time: "~200ms" },
  { step: 5, title: "ML Prediction", desc: "Random Forest (100 trees, 79 features) → confidence", icon: "psychology", time: "~150ms" },
  { step: 6, title: "Stego Detection", desc: "LSB analysis, chi-square test on images", icon: "image_search", time: "~80ms" },
  { step: 7, title: "Network Analysis", desc: "PCAP anomaly detection, flow statistics", icon: "lan", time: "~120ms" },
  { step: 8, title: "Threat Scoring", desc: "Weighted aggregation → score 0-100", icon: "speed", time: "~10ms" },
];

const API_GROUPS = [
  { title: "Authentication", icon: "login", badge: "10 endpoints", endpoints: [
    "POST /api/auth/signup — Register new account",
    "POST /api/auth/login — Authenticate (email/password)",
    "GET /api/auth/me — Current user profile",
    "POST /api/auth/mfa/enroll — Generate TOTP secret + QR",
    "POST /api/auth/mfa/verify-login — 2FA verification",
    "POST /api/auth/google — OAuth token exchange",
  ]},
  { title: "Scanning", icon: "radar", badge: "5 endpoints", endpoints: [
    "POST /api/scans — Upload file & start scan",
    "GET /api/scans — List scans (paginated)",
    "GET /api/scans/:id — Scan details + findings",
    "DELETE /api/scans/:id — Delete scan",
    "GET /api/scans/:id/findings — List findings",
  ]},
  { title: "YARA Rules", icon: "rule", badge: "5 endpoints", endpoints: [
    "GET /api/rules — List rules (own + builtin)",
    "POST /api/rules — Create custom rule",
    "PUT /api/rules/:id — Update rule",
    "DELETE /api/rules/:id — Delete rule",
    "POST /api/rules/validate — Validate YARA syntax",
  ]},
  { title: "Security & Sessions", icon: "admin_panel_settings", badge: "8 endpoints", endpoints: [
    "GET /api/security/sessions — List active sessions",
    "DELETE /api/security/sessions/:id — Revoke session",
    "GET /api/security/audit-logs — View audit trail",
    "GET /api/security/ip-whitelist — List whitelisted IPs",
  ]},
  { title: "ML Service (Internal)", icon: "model_training", badge: "4 endpoints", endpoints: [
    "POST /predict/malware — PE features → malicious/benign",
    "POST /predict/network — Flow features → anomaly detection",
    "POST /predict/steganography — Image stats → hidden data",
    "GET /metrics — Prometheus metrics",
  ]},
];

const ROADMAP = [
  { phase: "Q3 2026", title: "Federated Learning", desc: "Privacy-preserving ML: train locally, share only gradients. FedAvg with differential privacy.", status: "planned", icon: "share" },
  { phase: "Q4 2026", title: "Graph Neural Networks", desc: "Model threat relationships as graphs. Message-passing framework for attack campaign identification.", status: "planned", icon: "hub" },
  { phase: "Q1 2027", title: "Autonomous Response", desc: "SOAR integration: auto-quarantine, firewall rules, SIEM integration (Splunk, Elastic).", status: "concept", icon: "smart_toy" },
  { phase: "Q2 2027", title: "Advanced Detection", desc: "Dynamic sandbox, YARA-X (Rust), STIX/TAXII feeds, browser extension.", status: "concept", icon: "rocket_launch" },
];

const DB_DOMAINS = [
  { domain: "Identity", tables: "profiles, user_sessions, security_preferences, ip_whitelist", count: 4, icon: "person" },
  { domain: "Scanning", tables: "scans, scan_files, findings, rule_matches", count: 4, icon: "radar" },
  { domain: "Rules", tables: "yara_rules", count: 1, icon: "rule" },
  { domain: "Access", tables: "api_keys, audit_logs, activity_logs", count: 3, icon: "vpn_key" },
  { domain: "Comms", tables: "notifications, notification_preferences", count: 2, icon: "notifications" },
];

/* ─── Page Component ─── */
export default function DocumentationPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [activeTechTab, setActiveTechTab] = useState("Frontend");

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  /* Track active section on scroll */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    NAV_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-primary selection:text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-grid-pattern bg-grid-pattern-size opacity-40" />
        <div className="absolute top-[-15%] left-[5%] w-[700px] h-[700px] bg-primary/[0.04] rounded-full blur-[160px]" />
        <div className="absolute bottom-[-15%] right-[5%] w-[800px] h-[800px] bg-secondary/[0.03] rounded-full blur-[180px]" />
      </div>
      <div className="fixed inset-0 crt-overlay z-50 opacity-15 pointer-events-none" />

      {/* Floating Side-nav */}
      <nav className="hidden xl:flex fixed right-5 top-1/2 -translate-y-1/2 z-40 flex-col gap-1.5 items-stretch">
        <div className="glass-panel border border-gray-200 dark:border-gray-700/40 rounded-2xl p-2.5 shadow-xl shadow-black/5 dark:shadow-black/20 backdrop-blur-xl">
          {NAV_SECTIONS.map(({ id, label, icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-300 no-underline relative ${
                activeSection === id
                  ? "bg-primary/10"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800/40"
              }`}
            >
              {/* Active bar indicator */}
              {activeSection === id && (
                <motion.div
                  layoutId="activeNavBar"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,143,57,0.5)]"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <span className={`material-icons text-xl transition-all duration-200 ${
                activeSection === id ? "text-primary scale-110" : "text-gray-400 group-hover:text-text-main dark:group-hover:text-gray-300"
              }`}>
                {icon}
              </span>
              <span className={`text-sm font-mono tracking-wide transition-colors duration-200 ${
                activeSection === id ? "text-primary font-bold" : "text-text-muted group-hover:text-text-main dark:group-hover:text-gray-300"
              }`}>
                {label}
              </span>
            </a>
          ))}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-5 md:px-10 flex flex-col min-h-screen relative z-10">
        <Header />

        <main className="flex-grow pt-16 pb-24">
          {/* ════════════════════ HERO ════════════════════ */}
          <section ref={heroRef} id="overview" className="relative pb-24 scroll-mt-24">
            <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-4xl">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 mb-6">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-mono text-[10px] text-primary tracking-widest uppercase">v5.0.0 — Production Ready</span>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-6xl font-display font-bold text-text-main dark:text-white mb-6 leading-tight">
                ThreatForge <span className="text-primary italic">Documentation</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-lg font-mono text-text-muted dark:text-gray-400 max-w-2xl mb-10">
                A hybrid threat intelligence platform combining deterministic YARA analysis with probabilistic ML detection. F1-Score: 0.94 • AUC-ROC: 0.97
              </motion.p>

              {/* Quick Stats */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Readiness Score", value: "92/100", icon: "verified" },
                  { label: "Database Tables", value: "14", icon: "storage" },
                  { label: "API Endpoints", value: "35+", icon: "api" },
                  { label: "RLS Policies", value: "25+", icon: "shield" },
                ].map((stat, i) => (
                  <motion.div key={stat.label} whileHover={{ y: -4, scale: 1.02 }} className="glass-panel p-4 border border-gray-200 dark:border-gray-700/30 group cursor-default">
                    <span className="material-icons text-primary text-lg mb-2 block group-hover:scale-110 transition-transform">{stat.icon}</span>
                    <p className="text-2xl font-display font-bold text-text-main dark:text-white">{stat.value}</p>
                    <p className="text-[11px] font-mono text-text-muted uppercase tracking-wider">{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </section>

          {/* Production Readiness Scorecard */}
          <section className="py-16 border-t border-gray-100 dark:border-gray-800/30">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}>
              <h2 className="text-2xl font-display font-bold text-text-main dark:text-white mb-2">Production Readiness</h2>
              <p className="font-mono text-sm text-text-muted mb-8">Google SRE Maturity Model • DORA Framework Assessment</p>
            </motion.div>
            <Scorecard />
          </section>

          {/* ════════════════════ ARCHITECTURE ════════════════════ */}
          <section id="architecture" className="py-16 border-t border-gray-100 dark:border-gray-800/30 scroll-mt-24">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="mb-10">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-icons text-primary text-2xl">hub</span>
                <h2 className="text-2xl font-display font-bold text-text-main dark:text-white">System Architecture</h2>
              </div>
              <p className="font-mono text-sm text-text-muted">Service-Oriented Micro-Monolith • CAP Theorem Trade-offs</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {[
                { title: "Auth & Data (CP)", desc: "Strong consistency via PostgreSQL SERIALIZABLE isolation. We sacrifice availability during partitions rather than serve stale auth data.", badge: "Consistency + Partition Tolerance", icon: "lock" },
                { title: "Scanning Pipeline (AP)", desc: "Eventual consistency for task processing. Scans return HTTP 202 Accepted and are queued in Redis with at-least-once delivery.", badge: "Availability + Partition Tolerance", icon: "speed" },
              ].map((item, i) => (
                <motion.div key={item.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} whileHover={{ y: -4 }} className="glass-panel p-6 border border-gray-200 dark:border-gray-700/30 group">
                  <div className="flex items-start justify-between mb-3">
                    <span className="material-icons text-primary text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-[9px] font-bold tracking-wider">{item.badge}</span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-text-main dark:text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Container Diagram */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2} className="glass-panel p-6 border border-gray-200 dark:border-gray-700/30">
              <h3 className="font-display font-bold text-lg text-text-main dark:text-white mb-4 flex items-center gap-2">
                <span className="material-icons text-primary text-lg">account_tree</span>
                Container Architecture
              </h3>
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { tier: "Client", color: "border-blue-400", items: ["Web Browser", "API Scripts"] },
                  { tier: "Application", color: "border-primary", items: ["Next.js 16 :3000", "Flask API :5000", "FastAPI ML :7860", "Celery Workers"] },
                  { tier: "Data", color: "border-amber-400", items: ["PostgreSQL 16", "Redis 7", "S3 Storage"] },
                  { tier: "Observability", color: "border-purple-400", items: ["Prometheus", "Loki", "Tempo", "Grafana"] },
                ].map((tier) => (
                  <div key={tier.tier} className={`border-l-2 ${tier.color} pl-4`}>
                    <p className="font-mono text-xs text-text-muted uppercase tracking-wider mb-2">{tier.tier}</p>
                    {tier.items.map((item) => (
                      <p key={item} className="text-sm text-text-main dark:text-gray-300 mb-1 font-mono">{item}</p>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Request Lifecycle */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={3} className="mt-6 glass-panel p-6 border border-gray-200 dark:border-gray-700/30">
              <h3 className="font-display font-bold text-lg text-text-main dark:text-white mb-4 flex items-center gap-2">
                <span className="material-icons text-primary text-lg">timeline</span>
                Request Lifecycle
              </h3>
              <div className="flex flex-wrap gap-2 items-center">
                {["Upload File", "→", "Validate JWT", "→", "INSERT scan", "→", "LPUSH queue", "→", "Worker BRPOP", "→", "Analyze (8 steps)", "→", "ML Prediction", "→", "Write Findings", "→", "WebSocket Push"].map((step, i) => (
                  step === "→" ? <span key={i} className="text-primary font-mono text-sm">→</span> :
                  <motion.span key={i} whileHover={{ scale: 1.05, y: -2 }} className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/30 text-xs font-mono text-text-main dark:text-gray-300 cursor-default">{step}</motion.span>
                ))}
              </div>
            </motion.div>
          </section>

          {/* ════════════════════ TECH STACK ════════════════════ */}
          <section id="tech-stack" className="py-16 border-t border-gray-100 dark:border-gray-800/30 scroll-mt-24">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-icons text-primary text-2xl">code</span>
                <h2 className="text-2xl font-display font-bold text-text-main dark:text-white">Technology Stack</h2>
              </div>
              <p className="font-mono text-sm text-text-muted">Every choice evaluated on DX, community, performance, security & longevity</p>
            </motion.div>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {TECH_STACK.map(({ category }) => (
                <button key={category} onClick={() => setActiveTechTab(category)} className={`px-4 py-2 rounded-lg font-mono text-xs tracking-wider transition-all whitespace-nowrap ${ activeTechTab === category ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-gray-50 dark:bg-gray-800/50 text-text-muted hover:bg-gray-100 dark:hover:bg-gray-700/50" }`}>
                  {category}
                </button>
              ))}
            </div>

            {/* Tech Cards */}
            <AnimatePresence mode="wait">
              <motion.div key={activeTechTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {TECH_STACK.find((t) => t.category === activeTechTab)?.items.map((tech, i) => (
                  <motion.div key={tech.name} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} whileHover={{ y: -6, scale: 1.03 }} className="glass-panel p-5 border border-gray-200 dark:border-gray-700/30 group relative overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${tech.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                    <span className="material-icons text-primary text-2xl mb-3 block group-hover:scale-110 transition-transform relative z-10">{tech.icon}</span>
                    <h4 className="font-display font-bold text-text-main dark:text-white mb-1 relative z-10">{tech.name}</h4>
                    <p className="text-xs font-mono text-text-muted leading-relaxed relative z-10">{tech.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </section>

          {/* ════════════════════ SECURITY ════════════════════ */}
          <section id="security" className="py-16 border-t border-gray-100 dark:border-gray-800/30 scroll-mt-24">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-icons text-primary text-2xl">lock</span>
                <h2 className="text-2xl font-display font-bold text-text-main dark:text-white">Security Architecture</h2>
              </div>
              <p className="font-mono text-sm text-text-muted">Zero Trust (NIST SP 800-207) • Defense in Depth • Score: 95/100</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {[
                { title: "Verify Explicitly", desc: "Every request authenticated via JWT. No implicit trust based on network location.", icon: "verified_user" },
                { title: "Least Privilege", desc: "Three roles (admin, analyst, viewer). 25+ RLS policies enforce at the DB level.", icon: "admin_panel_settings" },
                { title: "Assume Breach", desc: "All internal comms encrypted. Secrets via env vars, never hardcoded.", icon: "enhanced_encryption" },
              ].map((p, i) => (
                <motion.div key={p.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} whileHover={{ y: -4 }} className="glass-panel p-5 border border-gray-200 dark:border-gray-700/30 group">
                  <span className="material-icons text-primary text-xl mb-3 block group-hover:scale-110 transition-transform">{p.icon}</span>
                  <h4 className="font-display font-bold text-text-main dark:text-white mb-1">{p.title}</h4>
                  <p className="text-xs text-text-muted leading-relaxed">{p.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="space-y-3">
              <AccordionPanel title="Password Storage — Argon2id" icon="password" badge="PHC 2015 Winner">
                <div className="space-y-3">
                  <p className="text-sm text-text-muted">Memory-hard KDF combining Argon2i (side-channel resistant) + Argon2d (GPU-cracking resistant).</p>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                    <p className="text-primary">Argon2id(Password, Salt, t=3, m=65536KB, p=4, TagLen=32)</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { param: "TimeCost", val: "3 iterations", note: "CPU cost" },
                      { param: "MemoryCost", val: "64 MB", note: "Limits GPU parallelism" },
                      { param: "Parallelism", val: "4 lanes", note: "No time-memory trade" },
                      { param: "Salt", val: "16 bytes", note: "Anti-rainbow table" },
                    ].map((p) => (
                      <div key={p.param} className="border border-gray-200 dark:border-gray-700/30 rounded-lg p-3">
                        <p className="font-mono text-[10px] text-primary uppercase tracking-wider">{p.param}</p>
                        <p className="font-display font-bold text-sm text-text-main dark:text-white">{p.val}</p>
                        <p className="text-[10px] text-text-muted">{p.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionPanel>

              <AccordionPanel title="JWT Tokens — HMAC-SHA256" icon="token" badge="RFC 7519">
                <div className="space-y-3">
                  <p className="text-sm text-text-muted">Stateless session management. Access token (15min) + Refresh token (30 days). Revocable via session JTI.</p>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                    <p className="text-primary">HMAC(K, m) = H((K&apos; ⊕ opad) ‖ H((K&apos; ⊕ ipad) ‖ m))</p>
                  </div>
                </div>
              </AccordionPanel>

              <AccordionPanel title="Multi-Factor Authentication — TOTP" icon="lock_clock" badge="RFC 6238">
                <div className="space-y-3">
                  <p className="text-sm text-text-muted">Time-based One-Time Passwords via PyOTP. 6-digit codes rotate every 30 seconds. Unified flow for email + Google OAuth.</p>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                    <p className="text-primary">TOTP(K, T) = Truncate(HMAC-SHA1(K, ⌊T/30⌋)) mod 10⁶</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["Knowledge + Possession", "30s Expiry", "Replay Detection", "Backup Recovery Codes"].map((f) => (
                      <span key={f} className="px-2 py-1 rounded-md bg-primary/5 border border-primary/10 text-[10px] font-mono text-primary">{f}</span>
                    ))}
                  </div>
                </div>
              </AccordionPanel>

              <AccordionPanel title="Transport Security — TLS 1.3" icon="https" badge="RFC 8446">
                <p className="text-sm text-text-muted">Forward secrecy via ECDHE. 1-RTT handshake. Only AEAD cipher suites (AES-256-GCM, ChaCha20-Poly1305). Eliminates all weak ciphers.</p>
              </AccordionPanel>
            </div>
          </section>

          {/* ════════════════════ DETECTION ENGINE ════════════════════ */}
          <section id="detection" className="py-16 border-t border-gray-100 dark:border-gray-800/30 scroll-mt-24">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-icons text-primary text-2xl">radar</span>
                <h2 className="text-2xl font-display font-bold text-text-main dark:text-white">Detection Engine</h2>
              </div>
              <p className="font-mono text-sm text-text-muted">8-Step Analysis Pipeline • Random Forest (n=100) • F1=0.94 • AUC=0.97</p>
            </motion.div>

            {/* Three-layer overview */}
            <div className="grid md:grid-cols-3 gap-4 mb-10">
              {[
                { layer: "Layer 1", title: "Deterministic", desc: "YARA signature matching with O(1) hash lookups", color: "border-blue-400" },
                { layer: "Layer 2", title: "Probabilistic", desc: "Random Forest classifier: 79 PE features → confidence score", color: "border-primary" },
                { layer: "Layer 3", title: "External Intel", desc: "Live VirusTotal API feeds for cross-referencing", color: "border-amber-400" },
              ].map((l, i) => (
                <motion.div key={l.layer} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} className={`border-l-2 ${l.color} pl-4`}>
                  <p className="font-mono text-[10px] text-primary uppercase tracking-wider">{l.layer}</p>
                  <h4 className="font-display font-bold text-text-main dark:text-white">{l.title}</h4>
                  <p className="text-xs text-text-muted">{l.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Pipeline Timeline */}
            <div className="relative ml-4 border-l-2 border-primary/20 space-y-6 mb-10">
              {SCAN_PIPELINE.map((step, i) => (
                <motion.div key={step.step} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={i} className="relative pl-8 group">
                  {/* Dot */}
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary group-hover:bg-primary group-hover:shadow-[0_0_12px_rgba(0,143,57,0.5)] transition-all duration-300">
                    <div className="absolute inset-1 rounded-full bg-primary" />
                  </div>
                  <div className="glass-panel p-4 border border-gray-200 dark:border-gray-700/30 group-hover:border-primary/30 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="material-icons text-primary text-base">{step.icon}</span>
                        <span className="font-mono text-[10px] text-primary/70">STEP {step.step}</span>
                        <h4 className="font-display font-bold text-sm text-text-main dark:text-white">{step.title}</h4>
                      </div>
                      <span className="text-[10px] font-mono text-text-muted bg-gray-50 dark:bg-gray-800/50 px-2 py-0.5 rounded">{step.time}</span>
                    </div>
                    <p className="text-xs text-text-muted">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ML Metrics */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="glass-panel p-6 border border-gray-200 dark:border-gray-700/30">
              <h3 className="font-display font-bold text-lg text-text-main dark:text-white mb-4 flex items-center gap-2">
                <span className="material-icons text-primary text-lg">psychology</span>
                ML Model Performance
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700/30">
                      <th className="text-left py-2 font-mono text-[10px] text-text-muted uppercase tracking-wider">Model</th>
                      <th className="text-center py-2 font-mono text-[10px] text-text-muted uppercase tracking-wider">Accuracy</th>
                      <th className="text-center py-2 font-mono text-[10px] text-text-muted uppercase tracking-wider">Precision</th>
                      <th className="text-center py-2 font-mono text-[10px] text-text-muted uppercase tracking-wider">Recall</th>
                      <th className="text-center py-2 font-mono text-[10px] text-text-muted uppercase tracking-wider">F1</th>
                      <th className="text-center py-2 font-mono text-[10px] text-text-muted uppercase tracking-wider">AUC</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-xs">
                    {[
                      { name: "Malware Detection", acc: "0.96", prec: "0.95", rec: "0.93", f1: "0.94", auc: "0.97" },
                      { name: "Network Anomaly", acc: "0.93", prec: "0.92", rec: "0.91", f1: "0.91", auc: "0.95" },
                      { name: "Steganography", acc: "0.91", prec: "0.89", rec: "0.90", f1: "0.89", auc: "0.93" },
                    ].map((m) => (
                      <tr key={m.name} className="border-b border-gray-100 dark:border-gray-800/30 hover:bg-primary/[0.02] transition-colors">
                        <td className="py-3 text-text-main dark:text-white font-display font-bold text-sm">{m.name}</td>
                        <td className="text-center py-3">{m.acc}</td>
                        <td className="text-center py-3">{m.prec}</td>
                        <td className="text-center py-3">{m.rec}</td>
                        <td className="text-center py-3 text-primary font-bold">{m.f1}</td>
                        <td className="text-center py-3 text-primary font-bold">{m.auc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </section>

          {/* ════════════════════ DATABASE ════════════════════ */}
          <section id="database" className="py-16 border-t border-gray-100 dark:border-gray-800/30 scroll-mt-24">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-icons text-primary text-2xl">storage</span>
                <h2 className="text-2xl font-display font-bold text-text-main dark:text-white">Database Design</h2>
              </div>
              <p className="font-mono text-sm text-text-muted">PostgreSQL 16 • 14 Tables • BCNF Normalized • 25+ RLS Policies</p>
            </motion.div>

            {/* ACID Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { letter: "A", name: "Atomicity", impl: "Write-Ahead Log" },
                { letter: "C", name: "Consistency", impl: "CHECK + FK refs" },
                { letter: "I", name: "Isolation", impl: "MVCC + SSI" },
                { letter: "D", name: "Durability", impl: "WAL + fsync" },
              ].map((a, i) => (
                <motion.div key={a.letter} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} whileHover={{ y: -4, scale: 1.03 }} className="glass-panel p-4 border border-gray-200 dark:border-gray-700/30 text-center group cursor-default">
                  <span className="text-3xl font-display font-bold text-primary group-hover:scale-110 inline-block transition-transform">{a.letter}</span>
                  <p className="font-display font-bold text-sm text-text-main dark:text-white">{a.name}</p>
                  <p className="text-[10px] font-mono text-text-muted">{a.impl}</p>
                </motion.div>
              ))}
            </div>

            {/* Domain Overview */}
            <div className="grid md:grid-cols-5 gap-3">
              {DB_DOMAINS.map((d, i) => (
                <motion.div key={d.domain} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} whileHover={{ y: -4 }} className="glass-panel p-4 border border-gray-200 dark:border-gray-700/30 group">
                  <span className="material-icons text-primary text-lg mb-2 block group-hover:scale-110 transition-transform">{d.icon}</span>
                  <h4 className="font-display font-bold text-sm text-text-main dark:text-white mb-1">{d.domain}</h4>
                  <p className="text-[10px] font-mono text-text-muted leading-relaxed">{d.tables}</p>
                  <span className="mt-2 inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-[9px] font-bold">{d.count} tables</span>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ════════════════════ API ════════════════════ */}
          <section id="api" className="py-16 border-t border-gray-100 dark:border-gray-800/30 scroll-mt-24">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-icons text-primary text-2xl">api</span>
                <h2 className="text-2xl font-display font-bold text-text-main dark:text-white">API Reference</h2>
              </div>
              <p className="font-mono text-sm text-text-muted">RESTful (Fielding, 2000) • 35+ Endpoints • JWT Auth • Rate Limited</p>
            </motion.div>

            <div className="space-y-3">
              {API_GROUPS.map((group) => (
                <AccordionPanel key={group.title} title={group.title} icon={group.icon} badge={group.badge}>
                  <div className="space-y-1.5">
                    {group.endpoints.map((ep) => {
                      const [method, ...rest] = ep.split(" ");
                      const [path, ...descParts] = rest.join(" ").split(" — ");
                      return (
                        <div key={ep} className="flex items-start gap-3 py-1.5 border-b border-gray-100 dark:border-gray-800/20 last:border-0">
                          <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${method === "GET" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : method === "POST" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : method === "PUT" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>{method}</span>
                          <span className="font-mono text-xs text-text-main dark:text-white">{path}</span>
                          {descParts.length > 0 && <span className="text-xs text-text-muted hidden sm:inline">— {descParts.join(" — ")}</span>}
                        </div>
                      );
                    })}
                  </div>
                </AccordionPanel>
              ))}
            </div>
          </section>

          {/* ════════════════════ ROADMAP ════════════════════ */}
          <section id="roadmap" className="py-16 border-t border-gray-100 dark:border-gray-800/30 scroll-mt-24">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-icons text-primary text-2xl">rocket_launch</span>
                <h2 className="text-2xl font-display font-bold text-text-main dark:text-white">Future Roadmap</h2>
              </div>
              <p className="font-mono text-sm text-text-muted">Federated Learning • Graph Neural Networks • Autonomous Response</p>
            </motion.div>

            <div className="relative ml-4 border-l-2 border-primary/20 space-y-8">
              {ROADMAP.map((item, i) => (
                <motion.div key={item.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={i} className="relative pl-8 group">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary group-hover:bg-primary group-hover:shadow-[0_0_12px_rgba(0,143,57,0.5)] transition-all duration-300">
                    <div className="absolute inset-1 rounded-full bg-primary" />
                  </div>
                  <motion.div whileHover={{ y: -4, scale: 1.01 }} className="glass-panel p-5 border border-gray-200 dark:border-gray-700/30 group-hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="material-icons text-primary text-lg">{item.icon}</span>
                      <span className="font-mono text-[10px] text-primary uppercase tracking-wider">{item.phase}</span>
                      <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold ${item.status === "planned" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>{item.status}</span>
                    </div>
                    <h4 className="font-display font-bold text-lg text-text-main dark:text-white mb-1">{item.title}</h4>
                    <p className="text-sm text-text-muted leading-relaxed">{item.desc}</p>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ════════════════════ FOOTER CTA ════════════════════ */}
          <motion.section variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="py-16 border-t border-gray-100 dark:border-gray-800/30 text-center">
            <span className="material-icons text-primary text-4xl mb-4 block">description</span>
            <h3 className="text-2xl font-display font-bold text-text-main dark:text-white mb-2">Full Documentation</h3>
            <p className="text-sm text-text-muted max-w-lg mx-auto mb-6">
              This page covers the key architectural decisions. For the complete 23-chapter compendium with mathematical proofs and code-level details, visit our Notion workspace.
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-xs text-text-muted">ThreatForge v5.0.0 — 92/100 Production Ready</span>
            </div>
          </motion.section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
