"use client";

import { motion, Variants } from "framer-motion";

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};

const drop: Variants = {
  hidden: { opacity: 0, y: -40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 150, damping: 16 },
  },
};

const partners = [
  { icon: "diamond", name: "TechCorp" },
  { icon: "shield", name: "NetSecure" },
  { icon: "hub", name: "DataFlow" },
  { icon: "grid_view", name: "SysGrid" },
  { icon: "dns", name: "CyberNode" },
];

export default function TrustedBy() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      variants={container}
      className="mb-28 py-10 glass-panel border border-gray-200 dark:border-gray-700/50 overflow-hidden"
    >
      <motion.div variants={drop} className="text-center mb-8">
        <span className="text-[10px] font-mono text-text-muted dark:text-gray-500 uppercase tracking-[0.25em] border-b border-primary/20 pb-1">
          Trusted By Enterprise Defense Systems
        </span>
      </motion.div>
      <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 px-6">
        {partners.map((p, i) => (
          <motion.div
            key={i}
            variants={drop}
            className="flex items-center gap-2 group cursor-default"
          >
            <motion.span
              whileHover={{ scale: 1.2, rotate: 8 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="material-symbols-outlined text-3xl text-gray-300 dark:text-gray-600 group-hover:text-primary transition-colors duration-300"
            >
              {p.icon}
            </motion.span>
            <span className="font-display font-bold text-lg text-gray-400 dark:text-gray-500 group-hover:text-text-main dark:group-hover:text-white transition-colors duration-300">
              {p.name}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
