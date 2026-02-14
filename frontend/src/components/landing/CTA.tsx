"use client";

import Link from "next/link";

import { motion } from "framer-motion";

export default function CTA() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mb-16 relative max-w-4xl mx-auto"
    >
      <div className="glass-panel p-10 md:p-14 border border-primary/40 text-center relative overflow-hidden group hover:border-primary transition-colors duration-500">
        {/* Background rotating icon */}
        <div className="absolute top-0 right-0 p-4 opacity-[0.06]">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="material-symbols-outlined text-[120px] text-primary inline-block"
          >
            verified_user
          </motion.span>
        </div>

        {/* Bottom accent bar */}
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="font-display text-3xl md:text-4xl font-bold mb-5 text-text-main dark:text-white relative z-10 leading-tight"
        >
          Ready to secure your perimeter?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="font-mono text-text-muted dark:text-gray-400 mb-10 max-w-lg mx-auto relative z-10 text-sm"
        >
          Join thousands of security professionals using ThreatForge to
          monitor, detect, and neutralize threats in real-time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-center items-center gap-4 relative z-10 mb-12"
        >
          <Link href="/signup" passHref legacyBehavior>
            <motion.a
              whileHover={{ y: -3, boxShadow: "0 12px 30px rgba(0,143,57,0.35)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="px-8 py-3 bg-primary text-white font-bold font-display uppercase tracking-widest text-sm w-full sm:w-auto overflow-hidden group/btn relative inline-block cursor-pointer no-underline"
            >
              <span className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
              <span className="relative">Initialize Protection</span>
            </motion.a>
          </Link>

          <motion.button
            whileHover={{ y: -3, borderColor: "rgba(0,143,57,0.5)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="px-8 py-3 bg-white/80 dark:bg-transparent text-text-main dark:text-white border border-gray-300 dark:border-gray-600 font-bold font-display uppercase tracking-widest text-sm w-full sm:w-auto hover:text-primary dark:hover:text-primary transition-colors duration-300"
          >
            Contact Sales
          </motion.button>
        </motion.div>

        {/* Email subscription */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="max-w-md mx-auto glass-panel p-5 border border-gray-200 dark:border-gray-700 relative z-10"
        >
          <label className="block font-mono text-[10px] font-bold text-secondary mb-2 uppercase tracking-wider flex justify-between">
            <span>System Update Subscription</span>
            <span className="text-gray-400 font-normal">v2.4.0</span>
          </label>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 px-3 py-2 font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-text-main dark:text-white placeholder-gray-400 transition-all duration-300"
              type="email"
              placeholder="enter_email_address..."
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-secondary text-white px-4 py-2 font-display uppercase font-bold text-xs hover:bg-blue-600 transition-colors duration-300"
            >
              Subscribe
            </motion.button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 font-mono">
            * Weekly threat intelligence briefings. No spam protocols detected.
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
}
