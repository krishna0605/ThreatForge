"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
};
const pop: Variants = {
  hidden: { opacity: 0, scale: 0, rotate: -20 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { type: "spring", stiffness: 200, damping: 16 },
  },
};

const integrations = [
  { icon: "cloud_queue", name: "AWS Cloud" },
  { icon: "window", name: "Azure" },
  { icon: "travel_explore", name: "Google Cloud" },
  { icon: "anchor", name: "Kubernetes" },
  { icon: "chat_bubble", name: "Slack Ops" },
  { icon: "deployed_code", name: "Docker" },
];

export default function IntegrationEcosystem() {
  return (
    <section className="mb-28 py-16 glass-panel border border-gray-200 dark:border-gray-700/50 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 pt-2"
      >
        <span className="inline-block mb-4 px-3 py-1 border border-primary/20 bg-primary/5 text-[10px] font-mono text-primary uppercase tracking-[0.2em] font-bold">
          System Compatibility
        </span>
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-3 text-text-main dark:text-white">
          Seamless Integration Ecosystem
        </h2>
        <p className="font-mono text-text-muted dark:text-gray-400 max-w-xl mx-auto text-sm">
          Deploy ThreatForge across your entire stack. Native connectors for
          all major cloud providers and DevOps tools.
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={container}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto px-4"
      >
        {integrations.map((item, i) => (
          <motion.div
            key={i}
            variants={pop}
            whileHover={{
              y: -6,
              boxShadow: "0 8px 25px rgba(0,143,57,0.12)",
              borderColor: "rgba(0,143,57,0.3)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex flex-col items-center justify-center p-5 glass-panel border border-gray-200 dark:border-gray-700 cursor-default group"
          >
            <div className="w-10 h-10 mb-3 flex items-center justify-center grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300">
              <span className="material-symbols-outlined text-3xl text-primary">
                {item.icon}
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-gray-500 dark:text-gray-400 group-hover:text-text-main dark:group-hover:text-white transition-colors duration-300">
              {item.name}
            </span>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-10 text-center"
      >
        <Link
          href="#"
          className="inline-flex items-center gap-2 text-primary font-mono text-xs hover:underline transition-colors group no-underline uppercase tracking-wider"
        >
          View all 50+ integrations
          <motion.span
            className="material-icons text-sm"
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            arrow_forward
          </motion.span>
        </Link>
      </motion.div>
    </section>
  );
}
