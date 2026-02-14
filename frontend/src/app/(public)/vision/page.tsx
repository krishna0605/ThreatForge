"use client";

import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

/* ───── Animation Variants ───── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { duration: 0.8, delay: i * 0.1 },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, delay: i * 0.12, type: "spring" as const, stiffness: 100 },
  }),
};

/* ───── Data ───── */
const pillars = [
  {
    icon: "psychology",
    title: "AI-First Security",
    description:
      "We believe the future of cybersecurity lies in adaptive intelligence. Our neural engines learn, evolve, and anticipate threats before they materialize.",
    gradient: "from-primary/20 to-primary/5",
    borderColor: "border-primary/30",
    iconColor: "text-primary",
  },
  {
    icon: "speed",
    title: "Real-Time Response",
    description:
      "Millisecond threat detection and automated mitigation. In the battle against cyber threats, every microsecond counts.",
    gradient: "from-secondary/20 to-secondary/5",
    borderColor: "border-secondary/30",
    iconColor: "text-secondary",
  },
  {
    icon: "shield",
    title: "Zero-Trust Architecture",
    description:
      "Never trust, always verify. Every request is authenticated, authorized, and encrypted end-to-end — no exceptions.",
    gradient: "from-blue-500/20 to-blue-500/5",
    borderColor: "border-blue-500/30",
    iconColor: "text-blue-500",
  },
  {
    icon: "hub",
    title: "Scalable Infrastructure",
    description:
      "From startups to enterprises, ThreatForge scales effortlessly. Distributed architecture means no single point of failure.",
    gradient: "from-purple-500/20 to-purple-500/5",
    borderColor: "border-purple-500/30",
    iconColor: "text-purple-500",
  },
];

const timeline = [
  {
    phase: "PHASE 01",
    title: "Anomaly Detection Engine",
    description: "Deep learning models trained on millions of threat signatures to identify zero-day vulnerabilities in real time.",
    status: "DEPLOYED",
    statusColor: "text-green-500",
  },
  {
    phase: "PHASE 02",
    title: "Neural Sandbox Isolation",
    description: "Automated quarantine and execution of suspicious payloads in virtualized, air-gapped environments.",
    status: "DEPLOYED",
    statusColor: "text-green-500",
  },
  {
    phase: "PHASE 03",
    title: "Predictive Threat Intelligence",
    description: "Forecasting attack vectors using behavioral analysis and global threat telemetry data fusion.",
    status: "IN PROGRESS",
    statusColor: "text-yellow-500",
  },
  {
    phase: "PHASE 04",
    title: "Autonomous Defense Network",
    description: "Self-healing mesh network that automatically redistributes security resources to neutralize active threats.",
    status: "PLANNING",
    statusColor: "text-blue-400",
  },
];

const values = [
  { icon: "visibility", label: "Transparency", desc: "Open security practices. No black boxes." },
  { icon: "groups", label: "Collaboration", desc: "Security is a team effort. We build together." },
  { icon: "rocket_launch", label: "Innovation", desc: "Pushing boundaries of what's possible." },
  { icon: "lock", label: "Privacy", desc: "Your data is yours. Always encrypted, never sold." },
  { icon: "eco", label: "Sustainability", desc: "Efficient algorithms, minimal carbon footprint." },
  { icon: "public", label: "Accessibility", desc: "Enterprise-grade security for everyone." },
];

/* ───── Component ───── */
export default function VisionPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

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
        <div className="absolute top-[-15%] left-[5%] w-[700px] h-[700px] bg-primary/[0.04] rounded-full blur-[160px]" />
        <div className="absolute bottom-[-15%] right-[5%] w-[800px] h-[800px] bg-secondary/[0.03] rounded-full blur-[180px]" />
        <div className="absolute top-[40%] left-[50%] w-[500px] h-[500px] bg-primary/[0.02] rounded-full blur-[200px]" />
      </div>

      {/* ── CRT Scanline ─── */}
      <div className="fixed inset-0 crt-overlay z-50 opacity-20 pointer-events-none" />

      {/* ── Main Content ─── */}
      <div className="max-w-7xl mx-auto px-5 md:px-10 flex flex-col min-h-screen relative z-10">
        <Header />

        <main className="flex-grow">
          {/* ═══════════════ HERO ═══════════════ */}
          <section ref={heroRef} className="relative pt-16 pb-28 overflow-hidden">
            <motion.div
              style={{ y: heroY, opacity: heroOpacity }}
              className="text-center max-w-4xl mx-auto"
            >
              {/* Badge */}
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
                <span className="font-mono text-xs text-primary tracking-widest uppercase">Our Vision</span>
              </motion.div>

              {/* Title */}
              <motion.h1
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={1}
                className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-text-main dark:text-white leading-[1.1] mb-6"
              >
                Building the Future of{" "}
                <span className="relative inline-block">
                  <span className="text-primary">Cyber Defense</span>
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1, delay: 1.2, ease: "easeOut" }}
                    className="absolute bottom-1 left-0 h-[3px] bg-primary/40 rounded-full"
                  />
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={2}
                className="text-lg md:text-xl font-mono text-text-muted dark:text-gray-400 leading-relaxed max-w-2xl mx-auto mb-10"
              >
                ThreatForge was born from a singular purpose — to create an AI-driven security
                platform that doesn&apos;t just react to threats, but{" "}
                <span className="text-primary font-bold">anticipates</span> and{" "}
                <span className="text-secondary font-bold">neutralizes</span> them before impact.
              </motion.p>

              {/* Decorative terminal line */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={3}
                className="inline-flex items-center gap-3 font-mono text-xs text-text-muted dark:text-gray-500"
              >
                <span className="w-8 h-px bg-gray-300 dark:bg-gray-600" />
                <span className="text-primary">$</span> initializing_vision_protocol
                <span className="animate-pulse text-primary">█</span>
                <span className="w-8 h-px bg-gray-300 dark:bg-gray-600" />
              </motion.div>
            </motion.div>

            {/* Background accent shapes */}
            <div className="absolute top-20 left-10 w-32 h-32 border border-primary/10 rounded-full animate-[spin_30s_linear_infinite] pointer-events-none" />
            <div className="absolute bottom-20 right-10 w-48 h-48 border border-secondary/10 rounded-full animate-[spin_40s_linear_infinite_reverse] pointer-events-none" />
          </section>

          {/* ═══════════════ PILLARS ═══════════════ */}
          <section className="mb-32">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              custom={0}
              className="text-center mb-16"
            >
              <span className="font-mono text-xs text-primary tracking-[0.3em] uppercase block mb-3">
                Core Pillars
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-text-main dark:text-white">
                What Drives Us
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pillars.map((pillar, i) => (
                <motion.div
                  key={pillar.title}
                  variants={scaleIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  custom={i}
                  whileHover={{ y: -6, transition: { duration: 0.3 } }}
                  className={`group relative glass-panel p-8 border ${pillar.borderColor} overflow-hidden cursor-default`}
                >
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${pillar.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  <div className="relative z-10">
                    {/* Animated Icon Container */}
                    <div className="relative w-16 h-16 mb-6">
                      {/* Pulsing glow backdrop */}
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.3, 0.15] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${pillar.gradient} blur-xl`}
                      />
                      {/* Spinning orbit ring */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 12 + i * 4, repeat: Infinity, ease: "linear" }}
                        className={`absolute -inset-1 rounded-2xl border border-dashed ${pillar.borderColor} opacity-30 group-hover:opacity-70 transition-opacity duration-500`}
                      />
                      {/* Icon box */}
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
                        whileHover={{ scale: 1.15, rotate: 10 }}
                        className={`relative w-full h-full rounded-2xl border ${pillar.borderColor} bg-gradient-to-br ${pillar.gradient} flex items-center justify-center backdrop-blur-sm`}
                      >
                        <span className={`material-icons ${pillar.iconColor} text-3xl drop-shadow-[0_0_8px_currentColor]`}>
                          {pillar.icon}
                        </span>
                      </motion.div>
                    </div>
                    <h3 className="text-xl font-display font-bold text-text-main dark:text-white mb-3 group-hover:text-primary transition-colors duration-300">
                      {pillar.title}
                    </h3>
                    <p className="font-mono text-sm text-text-muted dark:text-gray-400 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>

                  {/* Corner accent */}
                  <div className={`absolute top-0 right-0 w-16 h-16 ${pillar.borderColor} border-b border-l opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                </motion.div>
              ))}
            </div>
          </section>

          {/* ═══════════════ MISSION STATEMENT ═══════════════ */}
          <section className="mb-32 relative">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1 }}
              className="relative glass-panel border border-primary/20 p-10 md:p-16 overflow-hidden"
            >
              {/* Background accents */}
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-secondary/10 rounded-full blur-3xl" />
              <div className="absolute top-0 left-0 px-3 py-1 bg-primary text-white text-[10px] font-mono tracking-wider">
                MISSION_STATEMENT
              </div>

              <div className="relative z-10 text-center max-w-3xl mx-auto mt-4">
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={0}
                >
                  <span className="material-icons text-primary text-5xl mb-6 block neon-pulse">
                    security
                  </span>
                </motion.div>
                <motion.blockquote
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={1}
                  className="text-2xl md:text-3xl font-display font-bold text-text-main dark:text-white leading-relaxed mb-6"
                >
                  &ldquo;To democratize enterprise-grade cybersecurity through
                  artificial intelligence — making the digital world{" "}
                  <span className="text-primary">safer</span>,{" "}
                  <span className="text-secondary">smarter</span>, and more{" "}
                  <span className="text-blue-500">resilient</span> for everyone.&rdquo;
                </motion.blockquote>
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={2}
                  className="flex items-center justify-center gap-3 font-mono text-xs text-text-muted dark:text-gray-500"
                >
                  <span className="w-12 h-px bg-gray-300 dark:bg-gray-700" />
                  THE THREATFORGE TEAM
                  <span className="w-12 h-px bg-gray-300 dark:bg-gray-700" />
                </motion.div>
              </div>
            </motion.div>
          </section>

          {/* ═══════════════ ROADMAP TIMELINE ═══════════════ */}
          <section className="mb-32">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              custom={0}
              className="text-center mb-16"
            >
              <span className="font-mono text-xs text-primary tracking-[0.3em] uppercase block mb-3">
                Development Roadmap
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-text-main dark:text-white">
                Evolution Timeline
              </h2>
            </motion.div>

            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-secondary/30 to-transparent md:-translate-x-px" />

              <div className="space-y-12">
                {timeline.map((item, i) => (
                  <motion.div
                    key={item.phase}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    custom={i}
                    className={`relative flex flex-col md:flex-row items-start gap-6 md:gap-12 ${
                      i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                    }`}
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-6 md:left-1/2 w-3 h-3 bg-primary rounded-full border-2 border-white dark:border-gray-900 -translate-x-1.5 mt-2 z-10 shadow-[0_0_12px_rgba(0,143,57,0.5)]" />

                    {/* Content card */}
                    <div className={`ml-14 md:ml-0 md:w-[calc(50%-3rem)] ${i % 2 === 0 ? "md:text-right md:pr-0" : "md:text-left md:pl-0"}`}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.3 }}
                        className="glass-panel p-6 border border-gray-200 dark:border-gray-700/50 group hover:border-primary/40 transition-colors duration-300"
                      >
                        <div className={`flex items-center gap-3 mb-3 ${i % 2 === 0 ? "md:justify-end" : ""}`}>
                          <span className="font-mono text-[10px] tracking-[0.3em] text-primary font-bold">
                            {item.phase}
                          </span>
                          <span className={`font-mono text-[10px] tracking-wider ${item.statusColor} font-bold px-2 py-0.5 rounded-full border ${
                            item.status === "DEPLOYED" ? "border-green-500/30 bg-green-500/5" :
                            item.status === "IN PROGRESS" ? "border-yellow-500/30 bg-yellow-500/5" :
                            "border-blue-400/30 bg-blue-400/5"
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <h3 className="text-lg font-display font-bold text-text-main dark:text-white mb-2 group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="font-mono text-sm text-text-muted dark:text-gray-400 leading-relaxed">
                          {item.description}
                        </p>
                      </motion.div>
                    </div>

                    {/* Spacer for alternating layout */}
                    <div className="hidden md:block md:w-[calc(50%-3rem)]" />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══════════════ VALUES GRID ═══════════════ */}
          <section className="mb-32">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              custom={0}
              className="text-center mb-16"
            >
              <span className="font-mono text-xs text-primary tracking-[0.3em] uppercase block mb-3">
                Our DNA
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-text-main dark:text-white">
                Core Values
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {values.map((val, i) => (
                <motion.div
                  key={val.label}
                  variants={fadeIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  custom={i}
                  whileHover={{ y: -4 }}
                  className="group glass-panel p-6 border border-gray-200 dark:border-gray-700/50 hover:border-primary/40 transition-all duration-300 cursor-default"
                >
                  <motion.span
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="material-icons text-primary text-3xl mb-4 block group-hover:drop-shadow-[0_0_8px_rgba(0,143,57,0.5)] transition-all duration-300"
                  >
                    {val.icon}
                  </motion.span>
                  <h4 className="font-display font-bold text-base text-text-main dark:text-white mb-1 group-hover:text-primary transition-colors duration-300">
                    {val.label}
                  </h4>
                  <p className="font-mono text-xs text-text-muted dark:text-gray-400 leading-relaxed">
                    {val.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ═══════════════ CTA SECTION ═══════════════ */}
          <section className="mb-28">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8 }}
              className="relative glass-panel p-10 md:p-16 border border-primary/20 text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl" />

              <div className="relative z-10">
                <motion.h2
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={0}
                  className="text-3xl md:text-4xl font-display font-bold text-text-main dark:text-white mb-4"
                >
                  Ready to Join the Mission?
                </motion.h2>
                <motion.p
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={1}
                  className="font-mono text-sm text-text-muted dark:text-gray-400 max-w-lg mx-auto mb-8"
                >
                  Be part of the next generation of cyber defense. Start protecting your
                  digital infrastructure today.
                </motion.p>
                <motion.a
                  href="/signup"
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={2}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-3 px-8 py-3 bg-primary text-white font-bold tracking-widest uppercase text-sm hover:bg-primary/90 transition-colors duration-300 no-underline group"
                >
                  <span className="material-icons text-lg group-hover:translate-x-1 transition-transform duration-300">
                    rocket_launch
                  </span>
                  Get Started Free
                </motion.a>
              </div>
            </motion.div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
