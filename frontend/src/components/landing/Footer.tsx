"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const links = ["About", "GitHub", "Docs", "Privacy", "Terms"];

export default function Footer() {
  return (
    <motion.footer
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={container}
      className="py-10 mt-8 border-t border-gray-200 dark:border-gray-800 relative"
    >
      <div className="absolute -top-px left-0 w-2 h-2 border-l border-t border-primary/40" />
      <div className="absolute -top-px right-0 w-2 h-2 border-r border-t border-primary/40" />

      <div className="flex flex-col md:flex-row justify-between items-center text-xs font-mono text-text-muted dark:text-gray-500">
        <motion.div
          variants={fadeUp}
          className="flex flex-wrap justify-center gap-5 mb-3 md:mb-0"
        >
          <span className="text-primary font-bold text-[10px] tracking-wider">NAV:</span>
          {links.map((link, i) => (
            <motion.span key={link} variants={fadeUp} className="contents">
              {i > 0 && <span className="text-gray-300 dark:text-gray-700">·</span>}
              <Link
                href="#"
                className="hover:text-primary transition-colors duration-300 no-underline"
              >
                {link}
              </Link>
            </motion.span>
          ))}
        </motion.div>
        <motion.div
          variants={fadeUp}
          className="text-[10px] opacity-60 flex items-center gap-2"
        >
          <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" />
          © 2026 ThreatForge. All systems operational.
        </motion.div>
      </div>
    </motion.footer>
  );
}
