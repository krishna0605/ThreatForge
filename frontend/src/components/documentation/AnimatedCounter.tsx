"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, motion } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  decimals?: number;
  duration?: number;
  color?: string;
}

export const AnimatedCounter = ({
  value,
  suffix = "",
  prefix = "",
  label,
  decimals = 0,
  duration = 1.5,
  color = "text-primary",
}: AnimatedCounterProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = (now - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(eased * value);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, value, duration]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="text-center p-3 overflow-hidden"
    >
      <div className={`text-2xl md:text-3xl font-display font-bold ${color} tabular-nums whitespace-nowrap`}>
        {prefix}{display.toFixed(decimals)}{suffix}
      </div>
      <div className="font-mono text-[10px] text-text-muted dark:text-gray-500 uppercase tracking-[0.2em] mt-1.5">
        {label}
      </div>
    </motion.div>
  );
};
