"use client";

import { motion, Variants } from "framer-motion";

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};
const slideUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const modules = [
  {
    title: "Deep Packet Inspection (DPI)",
    desc: "Analyzes data part of a packet as it passes an inspection point.",
  },
  {
    title: "Neural Sandbox",
    desc: "Executes potential threats in a safe, isolated environment.",
  },
  {
    title: "Zero-Trust Architecture",
    desc: "Requires strict identity verification for every person and device.",
  },
];

export default function AdvancedModules() {
  return (
    <section className="mb-28">
      <div className="flex flex-col md:flex-row gap-14 items-start">
        {/* Left — Text */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex-1"
        >
          <div className="inline-block border-b-2 border-primary mb-5 pb-1">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-text-main dark:text-white">
              Advanced Defense Modules
            </h2>
          </div>
          <p className="font-mono text-text-muted dark:text-gray-400 text-sm leading-relaxed mb-8">
            Beyond standard scanning, ThreatForge applies specialized
            kernel-level modules for deep inspection. Our proprietary &apos;Neural
            Sandbox&apos; isolates suspicious code execution in a virtualized void.
          </p>
          <motion.ul
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={container}
            className="space-y-5"
          >
            {modules.map((item, i) => (
              <motion.li
                key={i}
                variants={slideUp}
                className="flex items-start gap-3 group cursor-default"
              >
                <motion.span
                  whileHover={{ scale: 1.3, rotate: 15 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="material-symbols-outlined text-primary mt-0.5"
                >
                  check_circle
                </motion.span>
                <div>
                  <h4 className="font-bold text-text-main dark:text-white font-display text-base group-hover:text-primary transition-colors duration-300">
                    {item.title}
                  </h4>
                  <p className="text-sm text-text-muted dark:text-gray-500 font-mono">
                    {item.desc}
                  </p>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Right — Diagram */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex-1 w-full relative group/diagram"
        >
          <div className="absolute -inset-3 bg-primary/10 blur-xl rounded-xl opacity-0 group-hover/diagram:opacity-60 transition-opacity duration-500" />
          <div className="glass-panel p-6 border border-primary/20 tech-diagram-grid relative overflow-hidden">
            <div className="absolute top-0 left-0 px-3 py-1 bg-primary text-white text-[10px] font-mono tracking-wider">
              LIVE_DIAGNOSTIC
            </div>
            <div className="flex justify-between items-center mt-8 mb-4 relative z-10">
              {/* Client */}
              <div className="flex flex-col items-center">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-14 h-14 rounded border border-gray-300 dark:border-gray-600 glass-panel flex items-center justify-center mb-2"
                >
                  <span className="material-symbols-outlined text-gray-400 text-2xl">laptop_mac</span>
                </motion.div>
                <span className="text-[10px] font-mono uppercase text-gray-500">Client</span>
              </div>

              {/* Line 1 */}
              <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600 mx-3 relative">
                <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 px-2 text-[10px] font-mono text-gray-400">HTTPS/TLS</div>
              </div>

              {/* AI Core */}
              <div className="flex flex-col items-center relative">
                <div className="absolute -inset-4 border border-dashed border-primary/30 rounded-full animate-[spin_20s_linear_infinite]" />
                <div className="w-16 h-16 rounded-full border-2 border-primary bg-primary/5 flex items-center justify-center mb-2 neon-pulse">
                  <span className="material-symbols-outlined text-primary text-3xl">shield_lock</span>
                </div>
                <span className="text-[10px] font-mono uppercase font-bold text-primary">AI Core</span>
              </div>

              {/* Line 2 */}
              <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600 mx-3 relative">
                <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 px-2 text-[10px] font-mono text-gray-400">Filtered</div>
              </div>

              {/* Server */}
              <div className="flex flex-col items-center">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-14 h-14 rounded border border-secondary/50 glass-panel flex items-center justify-center mb-2"
                >
                  <span className="material-symbols-outlined text-secondary text-2xl">dns</span>
                </motion.div>
                <span className="text-[10px] font-mono uppercase text-gray-500">Server</span>
              </div>
            </div>

            {/* Log output */}
            <div className="mt-5 p-3 bg-black/5 dark:bg-black/40 border border-black/5 dark:border-white/5 font-mono text-[11px] text-text-muted dark:text-gray-400 space-y-1">
              <div className="flex justify-between border-b border-black/5 dark:border-white/5 pb-1">
                <span>Packet_ID: #9920A</span>
                <span className="text-green-600 font-bold">CLEAN</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Heuristic_Score:</span><span>0.02%</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Sandbox_Time:</span><span>12ms</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
