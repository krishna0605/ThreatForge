"use client";

import { motion, Variants } from "framer-motion";

const starContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.3 } },
};
const starPop: Variants = {
  hidden: { opacity: 0, scale: 0, rotate: -90 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { type: "spring", stiffness: 250, damping: 12 },
  },
};

export default function Testimonial() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative py-14 px-8 glass-panel border border-gray-200 dark:border-gray-700/50 mb-28 group/quote cursor-default overflow-hidden"
    >
      {/* Left accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-secondary to-primary opacity-50 group-hover/quote:opacity-100 transition-opacity duration-500" />

      <div className="text-center relative z-10">
        <div className="inline-flex items-center gap-2 mb-6 text-primary font-mono text-[10px] uppercase tracking-[0.2em] font-bold">
          <span className="w-1.5 h-1.5 bg-primary animate-pulse rounded-full" />
          <span className="cursor-blink">FEEDBACK_LOG_ENTRY_#4921</span>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={starContainer}
          className="flex justify-center gap-1 mb-8 text-yellow-500"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.span
              key={i}
              variants={starPop}
              className="material-icons text-base"
            >
              star
            </motion.span>
          ))}
        </motion.div>

        <motion.blockquote
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-lg md:text-xl text-text-main dark:text-white font-display italic max-w-3xl mx-auto mb-6 leading-relaxed"
        >
          &quot;The best open-source threat scanner available. The YARA integration is
          a lifesaver for our SOC team.&quot;
        </motion.blockquote>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-xs text-text-muted dark:text-gray-500 font-mono uppercase tracking-[0.15em]"
        >
          <span className="text-primary font-bold mr-1">{'//'}</span>
          Trusted by security researchers worldwide
        </motion.p>
      </div>
    </motion.section>
  );
}
