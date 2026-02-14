"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";

export default function Header() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 40);
  });

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`sticky top-0 z-50 flex items-center justify-between py-5 transition-all duration-500 ease-out ${
        scrolled
          ? "py-3 glass-panel -mx-5 md:-mx-10 px-5 md:px-10 shadow-lg"
          : ""
      }`}
    >
      {/* Bottom accent line */}
      <div
        className={`absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent transition-opacity duration-500 ${
          scrolled ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 group cursor-pointer no-underline">
        <div className="relative">
          <motion.span
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="material-icons text-primary text-3xl block leading-none"
          >
            security
          </motion.span>
          <div className="absolute inset-0 blur-md bg-primary/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <h1 className="font-display text-xl md:text-2xl font-bold tracking-[0.15em] uppercase text-text-main dark:text-white leading-none mt-1">
          THREAT<span className="text-primary">FORGE</span>
        </h1>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link
          href="/login"
          className="group relative px-6 py-2 overflow-hidden border border-primary/50 text-primary font-bold tracking-widest uppercase text-xs hover:text-white transition-colors duration-300 no-underline"
        >
          <span className="absolute inset-0 w-full h-full bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
          <span className="relative z-10 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">terminal</span>
            Login
          </span>
        </Link>
      </div>
    </motion.header>
  );
}
