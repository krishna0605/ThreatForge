"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0.4]);

  return (
    <section
      ref={ref}
      className="relative mb-28 glass-panel p-10 md:p-16 lg:p-20 text-center border border-gray-200 dark:border-primary/20 overflow-hidden"
    >
      {/* Corner brackets */}
      {[
        "top-0 left-0 border-l-2 border-t-2",
        "top-0 right-0 border-r-2 border-t-2",
        "bottom-0 left-0 border-l-2 border-b-2",
        "bottom-0 right-0 border-r-2 border-b-2",
      ].map((pos, i) => (
        <div
          key={i}
          className={`absolute w-6 h-6 ${pos} border-primary/40 neon-pulse`}
        />
      ))}

      {/* Status chip */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-10 inline-flex items-center gap-2 px-4 py-1.5 border border-secondary/30 bg-secondary/5 text-secondary dark:text-blue-400 text-xs font-mono tracking-[0.2em] rounded-sm"
      >
        <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse" />
        <span className="cursor-blink font-bold">SYSTEM_STATUS: ONLINE</span>
      </motion.div>

      {/* Headline */}
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="font-display text-5xl md:text-6xl lg:text-7xl font-bold mb-8 text-text-main dark:text-white leading-[1.1] tracking-tight"
      >
        AI-Powered Threat <br />
        <motion.span
          style={{ y: parallaxY, opacity: fade }}
          className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-500 to-secondary cursor-default"
          whileHover={{
            scale: 1.03,
            filter: "drop-shadow(0 0 20px rgba(0,143,57,0.5))",
            transition: { duration: 0.3 },
          }}
        >
          Detection Platform
        </motion.span>
      </motion.h2>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="font-mono text-text-muted dark:text-gray-400 max-w-2xl mx-auto mb-14 text-sm md:text-base leading-relaxed"
      >
        <span className="text-primary font-bold mr-1">&gt;&gt;</span>
        Initialize defense protocols. Detect malware, steganography &amp; network
        anomalies using advanced neural networks &amp; YARA rules.{" "}
        <span className="text-text-main dark:text-gray-200 bg-primary/10 px-1 font-semibold">
          Real-time infrastructure security.
        </span>
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="flex flex-col sm:flex-row justify-center gap-4"
      >
        <motion.button
          whileHover={{ y: -3, boxShadow: "0 12px 30px rgba(0,143,57,0.35)" }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="relative px-10 py-4 bg-primary text-white font-bold font-display uppercase tracking-widest text-sm overflow-hidden group"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-primary via-emerald-500 to-primary bg-[length:200%_100%] group-hover:animate-[shimmer_1.5s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="relative flex items-center gap-2">
            Get Started Free
            <motion.span
              className="material-icons text-sm"
              animate={{ x: [0, 3, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              arrow_forward
            </motion.span>
          </span>
        </motion.button>

        <motion.button
          whileHover={{ y: -3, borderColor: "rgba(0,102,204,0.6)" }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="px-10 py-4 bg-white/80 dark:bg-transparent text-primary dark:text-white border border-gray-300 dark:border-gray-600 font-bold font-display uppercase tracking-widest text-sm hover:text-secondary dark:hover:text-secondary hover:border-secondary transition-colors duration-300"
        >
          <span className="flex items-center gap-2">
            <span className="material-icons text-sm">play_circle</span>
            View Demo
          </span>
        </motion.button>
      </motion.div>
    </section>
  );
}
