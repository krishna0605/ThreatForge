"use client";

import { motion, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const stepVariants: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 14, duration: 0.6 },
  },
};

export default function OperationalWorkflow() {
  const steps = [
    {
      step: "STEP_01",
      title: "Connect",
      icon: "cable",
      desc: "Integrate our lightweight agent into your server or cloud infrastructure via API key.",
      color: "primary",
      hoverGlow: "rgba(0, 143, 57, 0.35)",
      hoverBorder: "rgba(0, 143, 57, 0.6)",
    },
    {
      step: "STEP_02",
      title: "Analyze",
      icon: "memory",
      desc: "AI engines scan traffic patterns and file signatures in real-time against global threat databases.",
      color: "secondary",
      hoverGlow: "rgba(0, 102, 204, 0.35)",
      hoverBorder: "rgba(0, 102, 204, 0.6)",
    },
    {
      step: "STEP_03",
      title: "Protect",
      icon: "lock_person",
      desc: "Automated countermeasures deploy instantly to quarantine threats and patch vulnerabilities.",
      color: "primary",
      hoverGlow: "rgba(0, 143, 57, 0.35)",
      hoverBorder: "rgba(0, 143, 57, 0.6)",
    },
  ];

  return (
    <section className="mb-24 relative py-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 text-text-main dark:text-white">
          <span className="text-primary mr-2">///</span>Operational Workflow
        </h2>
        <p className="font-mono text-text-muted dark:text-gray-400 text-sm uppercase tracking-widest">
          Automated Defense Sequence
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
        className="relative grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        {/* Connecting Line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
          style={{ originX: 0 }}
          className="hidden md:block absolute top-12 left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-primary via-gray-300 dark:via-gray-600 to-primary z-0"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-pulse"></div>
        </motion.div>

        {steps.map((item, i) => (
          <motion.div
            key={i}
            variants={stepVariants}
            className="relative z-10 flex flex-col items-center text-center group cursor-default"
          >
            {/* Icon Box with rich hover */}
            <motion.div
              whileHover={{
                y: -10,
                scale: 1.1,
                boxShadow: `0 8px 30px ${item.hoverGlow}`,
                borderColor: item.hoverBorder,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-24 h-24 glass-panel rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center mb-6 shadow-sm transition-colors duration-300 relative"
            >
              <div
                className={`absolute -top-1 -right-1 w-3 h-3 bg-gray-200 dark:bg-gray-600 group-hover:bg-${item.color} transition-colors duration-300`}
              ></div>
              <div
                className={`absolute -bottom-1 -left-1 w-3 h-3 bg-gray-200 dark:bg-gray-600 group-hover:bg-${item.color} transition-colors duration-300`}
              ></div>
              <motion.span
                whileHover={{ rotate: [0, -10, 10, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
                className={`material-symbols-outlined text-4xl text-gray-400 group-hover:text-${item.color} transition-colors duration-300`}
              >
                {item.icon}
              </motion.span>
            </motion.div>

            <div
              className={`mb-2 font-mono text-xs font-bold text-${item.color} border border-${item.color}/20 bg-${item.color}/5 px-2 py-0.5 rounded group-hover:bg-${item.color}/10 group-hover:border-${item.color}/40 transition-all duration-300`}
            >
              {item.step}
            </div>
            <h3 className={`text-xl font-display font-bold text-text-main dark:text-white mb-2 group-hover:text-${item.color} transition-colors duration-300`}>
              {item.title}
            </h3>
            <p className="text-sm text-text-muted dark:text-gray-400 font-mono max-w-xs leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
              {item.desc}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
