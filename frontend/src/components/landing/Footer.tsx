"use client";

import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-20 border-t border-gray-200 dark:border-primary/20 bg-gray-50/50 dark:bg-black/20 overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute -left-20 top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -right-20 bottom-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 md:px-10 py-16">
        {/* Top section: Brand + Nav columns */}
        <div className="flex flex-col md:flex-row gap-12 md:gap-0 md:justify-between">
          {/* Brand */}
          <div className="space-y-5 md:max-w-xs">
            <Link href="/" className="flex items-center gap-2 group w-fit no-underline">
              <span className="material-icons text-primary text-2xl group-hover:rotate-180 transition-transform duration-500">
                security
              </span>
              <span className="font-display font-bold text-xl tracking-wider text-text-main dark:text-white">
                THREAT<span className="text-primary">FORGE</span>
              </span>
            </Link>
            <p className="text-text-muted dark:text-gray-400 font-mono text-sm leading-relaxed">
              Advanced AI-powered threat detection platform. Securing digital infrastructures with real-time anomaly detection.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/20 text-[10px] font-mono text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              SYSTEMS OPERATIONAL
            </div>
          </div>

          {/* Nav columns centered */}
          <div className="flex flex-wrap gap-16 md:gap-20">
            {/* Platform */}
            <div className="space-y-4">
              <h4 className="font-display font-bold text-sm tracking-widest uppercase text-text-main dark:text-white">
                Platform
              </h4>
              <ul className="space-y-3 font-mono text-sm text-text-muted dark:text-gray-400 list-none p-0 m-0">
                <li>
                  <Link href="/vision" className="hover:text-primary transition-colors no-underline">
                    Vision
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors no-underline">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div className="space-y-4">
              <h4 className="font-display font-bold text-sm tracking-widest uppercase text-text-main dark:text-white">
                Resources
              </h4>
              <ul className="space-y-3 font-mono text-sm text-text-muted dark:text-gray-400 list-none p-0 m-0">
                <li>
                  <Link href="#" className="hover:text-primary transition-colors no-underline">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h4 className="font-display font-bold text-sm tracking-widest uppercase text-text-main dark:text-white">
                Legal
              </h4>
              <ul className="space-y-3 font-mono text-sm text-text-muted dark:text-gray-400 list-none p-0 m-0">
                <li>
                  <Link href="#" className="hover:text-primary transition-colors no-underline">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-primary transition-colors no-underline">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-text-muted dark:text-gray-500">
          <div>
            &copy; {currentYear} ThreatForge. All rights reserved.
          </div>

          <div className="flex items-center gap-6">
            <span>
              Made by{" "}
              <span className="text-text-main dark:text-gray-300 font-bold">
                Krishna Kapoor
              </span>
            </span>
            <Link
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-primary transition-colors no-underline"
            >
              <span className="material-icons text-[14px]">open_in_new</span>
              Portfolio
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
