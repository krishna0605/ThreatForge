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

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, delay: i * 0.12, type: "spring" as const, stiffness: 100 },
  }),
};

/* ───── Data ───── */
const teamMembers = [
  {
    name: "Krishna Kapoor",
    role: "Founder & Lead Developer",
    icon: "person",
    bio: "Full-stack developer passionate about cybersecurity and AI. Building the future of threat detection, one line of code at a time.",
    skills: ["React", "Python", "Machine Learning", "Cloud Architecture"],
    color: "primary",
  },
];

const techStack = [
  { icon: "code", name: "Next.js", category: "Frontend", color: "text-white", bg: "bg-black dark:bg-white/10" },
  { icon: "palette", name: "Tailwind CSS", category: "Styling", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { icon: "storage", name: "Supabase", category: "Backend", color: "text-green-400", bg: "bg-green-500/10" },
  { icon: "psychology", name: "scikit-learn", category: "ML Engine", color: "text-orange-400", bg: "bg-orange-500/10" },
  { icon: "cloud", name: "FastAPI", category: "API Layer", color: "text-teal-400", bg: "bg-teal-500/10" },
  { icon: "lock", name: "JWT + MFA", category: "Auth", color: "text-yellow-400", bg: "bg-yellow-500/10" },
];

const milestones = [
  {
    year: "2024",
    title: "Concept Born",
    description: "ThreatForge was conceptualized as an AI-powered threat detection platform to bridge the gap between enterprise security and accessibility.",
    icon: "lightbulb",
  },
  {
    year: "2024",
    title: "Core Engine Built",
    description: "Developed the foundational scanning engine with malware detection, network anomaly analysis, and steganography detection capabilities.",
    icon: "build",
  },
  {
    year: "2025",
    title: "ML Integration",
    description: "Integrated machine learning models trained on real-world threat data, achieving 99.98% accuracy in threat classification.",
    icon: "model_training",
  },
  {
    year: "2025",
    title: "Platform Launch",
    description: "Full platform launch with real-time dashboard, multi-factor authentication, and comprehensive reporting system.",
    icon: "rocket_launch",
  },
];

const stats = [
  { label: "Lines of Code", value: "50K+", icon: "code" },
  { label: "ML Accuracy", value: "99.98%", icon: "psychology" },
  { label: "Scan Types", value: "3", icon: "radar" },
  { label: "API Endpoints", value: "25+", icon: "api" },
];

/* ───── Component ───── */
export default function AboutPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-secondary/30 bg-secondary/5 mb-8"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
                </span>
                <span className="font-mono text-xs text-secondary tracking-widest uppercase">About Us</span>
              </motion.div>

              {/* Title */}
              <motion.h1
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={1}
                className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-text-main dark:text-white leading-[1.1] mb-6"
              >
                The People Behind{" "}
                <span className="relative inline-block">
                  <span className="text-primary">ThreatForge</span>
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
                A passion project built from the ground up — combining{" "}
                <span className="text-primary font-bold">artificial intelligence</span>,{" "}
                <span className="text-secondary font-bold">modern engineering</span>, and a deep
                commitment to making cybersecurity accessible to everyone.
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
                <span className="text-secondary">$</span> cat /about/team.json
                <span className="animate-pulse text-secondary">█</span>
                <span className="w-8 h-px bg-gray-300 dark:bg-gray-600" />
              </motion.div>
            </motion.div>

            {/* Background accents */}
            <div className="absolute top-20 right-10 w-32 h-32 border border-secondary/10 rounded-full animate-[spin_30s_linear_infinite] pointer-events-none" />
            <div className="absolute bottom-20 left-10 w-48 h-48 border border-primary/10 rounded-full animate-[spin_40s_linear_infinite_reverse] pointer-events-none" />
          </section>

          {/* ═══════════════ STATS BAR ═══════════════ */}
          <section className="mb-32">
            <div className="glass-panel border border-gray-200 dark:border-primary/15 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-primary opacity-40" />
              <div className="relative p-8 md:p-12 grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    className="text-center group cursor-default"
                  >
                    <motion.span
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="material-icons text-primary text-3xl mb-3 block"
                    >
                      {stat.icon}
                    </motion.span>
                    <div className="text-3xl md:text-4xl font-display font-bold text-text-main dark:text-white mb-1 group-hover:text-primary transition-colors duration-300">
                      {stat.value}
                    </div>
                    <div className="text-[10px] font-mono text-text-muted dark:text-gray-500 uppercase tracking-[0.15em]">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══════════════ FOUNDER ═══════════════ */}
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
                The Creator
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-text-main dark:text-white">
                Meet the Founder
              </h2>
            </motion.div>

            {teamMembers.map((member, i) => (
              <motion.div
                key={member.name}
                variants={scaleIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                custom={i}
                className="max-w-2xl mx-auto"
              >
                <div className="glass-panel border border-primary/20 p-8 md:p-12 relative overflow-hidden group">
                  {/* Glow accents */}
                  <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-secondary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="absolute top-0 left-0 px-3 py-1 bg-primary text-white text-[10px] font-mono tracking-wider">
                    TEAM_LEAD
                  </div>

                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 mt-4">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute -inset-2 rounded-full border border-dashed border-primary/30"
                      />
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary/40 flex items-center justify-center"
                      >
                        <span className="material-icons text-primary text-5xl drop-shadow-[0_0_12px_rgba(0,143,57,0.5)]">
                          {member.icon}
                        </span>
                      </motion.div>
                    </div>

                    {/* Info */}
                    <div className="text-center md:text-left">
                      <h3 className="text-2xl font-display font-bold text-text-main dark:text-white mb-1">
                        {member.name}
                      </h3>
                      <p className="font-mono text-sm text-primary mb-4">{member.role}</p>
                      <p className="font-mono text-sm text-text-muted dark:text-gray-400 leading-relaxed mb-5">
                        {member.bio}
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        {member.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-[11px] font-mono text-primary"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </section>

          {/* ═══════════════ TECH STACK ═══════════════ */}
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
                Under the Hood
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-text-main dark:text-white">
                Tech Stack
              </h2>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {techStack.map((tech, i) => (
                <motion.div
                  key={tech.name}
                  variants={scaleIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  custom={i}
                  whileHover={{ y: -6, transition: { duration: 0.3 } }}
                  className="group glass-panel p-6 border border-gray-200 dark:border-gray-700/50 hover:border-primary/40 transition-all duration-300 cursor-default text-center"
                >
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                    className={`w-14 h-14 rounded-2xl ${tech.bg} mx-auto mb-4 flex items-center justify-center`}
                  >
                    <span className={`material-icons ${tech.color} text-2xl`}>
                      {tech.icon}
                    </span>
                  </motion.div>
                  <h4 className="font-display font-bold text-base text-text-main dark:text-white mb-1 group-hover:text-primary transition-colors duration-300">
                    {tech.name}
                  </h4>
                  <p className="font-mono text-[11px] text-text-muted dark:text-gray-500 uppercase tracking-wider">
                    {tech.category}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ═══════════════ JOURNEY TIMELINE ═══════════════ */}
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
                Our Journey
              </span>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-text-main dark:text-white">
                Key Milestones
              </h2>
            </motion.div>

            <div className="relative max-w-3xl mx-auto">
              {/* Vertical line */}
              <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-secondary/30 to-transparent md:-translate-x-px" />

              <div className="space-y-14">
                {milestones.map((item, i) => (
                  <motion.div
                    key={item.title}
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
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                      className="absolute left-6 md:left-1/2 w-4 h-4 bg-primary rounded-full border-3 border-white dark:border-gray-900 -translate-x-2 mt-1 z-10 shadow-[0_0_16px_rgba(0,143,57,0.6)]"
                    />

                    {/* Content */}
                    <div className={`ml-14 md:ml-0 md:w-[calc(50%-3rem)] ${i % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.3 }}
                        className="glass-panel p-6 border border-gray-200 dark:border-gray-700/50 group hover:border-primary/40 transition-colors duration-300"
                      >
                        <div className={`flex items-center gap-3 mb-3 ${i % 2 === 0 ? "md:justify-end" : ""}`}>
                          <span className="font-mono text-[10px] tracking-[0.3em] text-secondary font-bold">
                            {item.year}
                          </span>
                        </div>
                        <div className={`flex items-center gap-3 mb-2 ${i % 2 === 0 ? "md:justify-end" : ""}`}>
                          <motion.span
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.6 }}
                            className="material-icons text-primary text-xl"
                          >
                            {item.icon}
                          </motion.span>
                          <h3 className="text-lg font-display font-bold text-text-main dark:text-white group-hover:text-primary transition-colors">
                            {item.title}
                          </h3>
                        </div>
                        <p className="font-mono text-sm text-text-muted dark:text-gray-400 leading-relaxed">
                          {item.description}
                        </p>
                      </motion.div>
                    </div>

                    {/* Spacer */}
                    <div className="hidden md:block md:w-[calc(50%-3rem)]" />
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══════════════ MISSION PANEL ═══════════════ */}
          <section className="mb-32">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8 }}
              className="relative glass-panel border border-primary/20 p-10 md:p-16 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
              <div className="absolute -top-16 -left-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-secondary/10 rounded-full blur-3xl" />
              <div className="absolute top-0 left-0 px-3 py-1 bg-secondary text-white text-[10px] font-mono tracking-wider">
                WHY_WE_BUILD
              </div>

              <div className="relative z-10 text-center max-w-3xl mx-auto mt-4">
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={0}
                >
                  <span className="material-icons text-secondary text-5xl mb-6 block neon-pulse">
                    favorite
                  </span>
                </motion.div>
                <motion.blockquote
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={1}
                  className="text-xl md:text-2xl font-display font-bold text-text-main dark:text-white leading-relaxed mb-6"
                >
                  ThreatForge isn&apos;t just a project — it&apos;s a statement that{" "}
                  <span className="text-primary">powerful security tools</span> shouldn&apos;t be
                  locked behind enterprise paywalls. Everyone deserves protection in the
                  digital age.
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
                  KRISHNA KAPOOR
                  <span className="w-12 h-px bg-gray-300 dark:bg-gray-700" />
                </motion.div>
              </div>
            </motion.div>
          </section>

          {/* ═══════════════ CTA ═══════════════ */}
          <section className="mb-28">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7 }}
              className="relative glass-panel p-10 md:p-16 border border-primary/20 text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-primary/5" />
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />

              <div className="relative z-10">
                <motion.h2
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={0}
                  className="text-3xl md:text-4xl font-display font-bold text-text-main dark:text-white mb-4"
                >
                  Want to See It in Action?
                </motion.h2>
                <motion.p
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={1}
                  className="font-mono text-sm text-text-muted dark:text-gray-400 max-w-lg mx-auto mb-8"
                >
                  Experience the power of AI-driven threat detection firsthand.
                  Create your free account and start scanning today.
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
                    play_arrow
                  </span>
                  Try ThreatForge Free
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
