"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

function useCountUp(end: number, duration: number, start: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let t0: number | null = null;
    let raf: number;
    const step = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(eased * end));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, start]);
  return count;
}

const stats = [
  {
    label: "Threats Blocked Today",
    value: 842912,
    dot: "bg-red-500",
    hoverColor: "text-primary",
    direction: { x: -80, y: 0 },
  },
  {
    label: "Active Nodes",
    value: 14056,
    dot: "bg-secondary",
    hoverColor: "text-secondary",
    direction: { x: 0, y: -60 },
  },
  {
    label: "AI Accuracy",
    value: 0,
    isPercent: true,
    dot: "bg-green-500",
    hoverColor: "text-green-600",
    direction: { x: 80, y: 0 },
  },
];

export default function StatsSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  const threats = useCountUp(842912, 2000, inView);
  const nodes = useCountUp(14056, 2000, inView);
  const [accuracy, setAccuracy] = useState("0.00");

  useEffect(() => {
    if (!inView) return;
    let t0: number | null = null;
    let raf: number;
    const step = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / 2000, 1);
      setAccuracy((p * 99.98 * (1 - Math.pow(1 - p, 3)) / p || 0).toFixed(2));
      if (p < 1) raf = requestAnimationFrame(step);
      else setAccuracy("99.98");
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  const values = [threats.toLocaleString(), nodes.toLocaleString(), `${accuracy}%`];

  return (
    <section ref={ref} className="mb-28 glass-panel border border-gray-200 dark:border-primary/15 relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-primary opacity-40" />

      <div className="relative p-8 md:p-12 flex flex-col md:flex-row justify-around items-center gap-10 text-center md:text-left">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, ...stat.direction }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              duration: 0.7,
              type: "spring",
              stiffness: 80,
              delay: i * 0.12,
            }}
            className="flex flex-col items-center md:items-start group cursor-default flex-1"
          >
            <div className="text-[10px] font-mono text-text-muted dark:text-gray-500 mb-2 uppercase tracking-[0.15em] flex items-center gap-2">
              <span className={`w-1.5 h-1.5 ${stat.dot} rounded-full animate-pulse`} />
              {stat.label}
            </div>
            <div className={`text-4xl md:text-5xl font-display font-bold text-text-main dark:text-white tracking-tighter group-hover:${stat.hoverColor} transition-colors duration-300`}>
              {values[i]}
            </div>
            <div className="w-full h-px bg-gray-200 dark:bg-gray-700 mt-4 relative overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.5 + i * 0.2, ease: "easeOut" }}
                className={`absolute left-0 top-0 h-full ${i === 0 ? "bg-primary" : i === 1 ? "bg-secondary" : "bg-green-600"}`}
              />
            </div>
          </motion.div>
        ))}

        {/* Dividers */}
        <div className="hidden md:block absolute top-[20%] bottom-[20%] left-1/3 w-px bg-gray-200 dark:bg-gray-700 rotate-6" />
        <div className="hidden md:block absolute top-[20%] bottom-[20%] left-2/3 w-px bg-gray-200 dark:bg-gray-700 rotate-6" />
      </div>
    </section>
  );
}
