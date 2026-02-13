import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  important: true,
  theme: {
    extend: {
      colors: {
        primary: "#008f39", // Forest Green/Tech Green
        secondary: "#0066cc", // Tech Blue
        "background-light": "#f5f7f9", // Off-white/Light Gray
        "surface-light": "#ffffff", // White
        "text-main": "#1a202c", // Dark Charcoal
        "text-muted": "#4a5568", // Slate Gray
        "terminal-border": "#cbd5e0",
        danger: "#e53e3e",
        warning: "#d69e2e",
        success: "#38a169",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-share-tech-mono)", "monospace"], 
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        neon: '0 0 5px #008f39, 0 0 10px #008f39',
        "neon-blue": '0 0 5px #0066cc, 0 0 10px #0066cc',
        "card-soft": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(0, 143, 57, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 143, 57, 0.05) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid-pattern": "40px 40px",
      },
      animation: {
        blink: "blink 1s step-end infinite",
        scanline: "scanline 6s linear infinite",
        "pulse-glow": "pulse-glow 3s infinite",
        float: "float 6s ease-in-out infinite",
        "spin-slow": "spin 12s linear infinite",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 5px rgba(0, 143, 57, 0.2)" },
          "50%": { boxShadow: "0 0 15px rgba(0, 143, 57, 0.4)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
