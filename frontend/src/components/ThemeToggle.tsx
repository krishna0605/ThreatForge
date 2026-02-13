"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        className="p-2 border border-terminal-border dark:border-gray-600 bg-white/80 dark:bg-white/5 backdrop-blur-sm"
        aria-label="Toggle theme"
      >
        <span className="material-symbols-outlined text-xl text-gray-400">
          dark_mode
        </span>
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="group relative p-2 border border-terminal-border dark:border-gray-600 bg-white/80 dark:bg-white/5 backdrop-blur-sm hover:border-primary transition-all duration-300 overflow-hidden"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
      <span
        className={`material-symbols-outlined text-xl relative z-10 transition-all duration-500 ${
          isDark
            ? "text-yellow-400 rotate-0 group-hover:rotate-180"
            : "text-primary rotate-0 group-hover:-rotate-180"
        }`}
      >
        {isDark ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
