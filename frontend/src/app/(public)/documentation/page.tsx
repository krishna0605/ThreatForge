"use client";

import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { TableOfContents } from "@/components/documentation/TableOfContents";

// Documentation Components
import { Introduction } from "./_components/Introduction";
import { Architecture } from "./_components/Architecture";
import { Security } from "./_components/Security";
import { Engine } from "./_components/Engine";
import { FrontendConsole } from "./_components/FrontendConsole";
import { DeepDive } from "./_components/DeepDive";

export default function DocumentationPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-primary selection:text-white">
      {/* ── Background Layer ─── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-grid-pattern bg-grid-pattern-size opacity-40" />
        <div className="absolute top-[-15%] left-[5%] w-[700px] h-[700px] bg-primary/[0.04] rounded-full blur-[160px]" />
        <div className="absolute bottom-[-15%] right-[5%] w-[800px] h-[800px] bg-secondary/[0.03] rounded-full blur-[180px]" />
      </div>
      <div className="fixed inset-0 crt-overlay z-50 opacity-15 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 md:px-10 flex flex-col min-h-screen relative z-10">
        <Header />

        <main className="flex-grow pt-16">
          {/* Hero */}
          <section ref={heroRef} className="relative pb-20 overflow-hidden border-b border-gray-100 dark:border-primary/5">
            <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-4xl">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 mb-6"
              >
                <span className="font-mono text-[10px] text-primary tracking-widest uppercase">v5.0.0 Stable</span>
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-6xl font-display font-bold text-text-main dark:text-white mb-6 leading-tight"
              >
                The Definitive <span className="text-primary italic">compendium</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg font-mono text-text-muted dark:text-gray-400 max-w-2xl"
              >
                Exhaustive architectural analysis, distributed systems theory, and mathematical foundations of the ThreatForge platform.
              </motion.p>
            </motion.div>
          </section>

          <div className="flex gap-12 py-12">
            {/* Sidebar TOC */}
            <div className="hidden lg:block w-64 shrink-0">
              <TableOfContents />
            </div>

            {/* Content */}
            <div className="flex-grow max-w-3xl overflow-hidden">
               <Introduction />
               <Architecture />
               <Security />
               <Engine />
               <FrontendConsole />
               <DeepDive />
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
