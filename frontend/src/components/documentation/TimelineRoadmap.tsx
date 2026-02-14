"use client";

import { motion } from "framer-motion";

interface TimelinePhase {
  title: string;
  date: string;
  description: string;
  status: "completed" | "active" | "upcoming";
  icon: string;
  items?: string[];
}

interface TimelineRoadmapProps {
  phases: TimelinePhase[];
}

export const TimelineRoadmap = ({ phases }: TimelineRoadmapProps) => {
  const statusStyles = {
    completed: {
      dot: "bg-primary border-primary",
      line: "bg-primary",
      badge: "bg-primary/10 text-primary",
      label: "COMPLETED",
    },
    active: {
      dot: "bg-primary border-primary animate-pulse",
      line: "bg-gradient-to-b from-primary to-gray-300 dark:to-gray-700",
      badge: "bg-primary text-white",
      label: "IN PROGRESS",
    },
    upcoming: {
      dot: "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600",
      line: "bg-gray-200 dark:bg-gray-700",
      badge: "bg-gray-100 dark:bg-gray-800 text-gray-500",
      label: "UPCOMING",
    },
  };

  return (
    <div className="relative ml-4 md:ml-8">
      {phases.map((phase, i) => {
        const s = statusStyles[phase.status];
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="relative pl-10 pb-12 last:pb-0 group"
          >
            {/* Connecting line */}
            {i < phases.length - 1 && (
              <div className={`absolute left-[11px] top-8 bottom-0 w-0.5 ${s.line}`} />
            )}
            {/* Dot */}
            <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 ${s.dot} flex items-center justify-center`}>
              {phase.status === "completed" && (
                <span className="material-icons text-white text-xs">check</span>
              )}
            </div>
            {/* Content */}
            <div className="glass-panel p-5 rounded-lg border border-gray-200 dark:border-primary/10 hover:border-primary/25 transition-all">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="material-icons text-primary text-lg">{phase.icon}</span>
                <h4 className="font-display font-bold text-text-main dark:text-white">{phase.title}</h4>
                <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] tracking-widest ${s.badge}`}>
                  {s.label}
                </span>
              </div>
              <div className="font-mono text-[10px] text-text-muted dark:text-gray-500 mb-2">{phase.date}</div>
              <p className="text-sm text-text-muted dark:text-gray-400 leading-relaxed">{phase.description}</p>
              {phase.items && phase.items.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {phase.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="w-1 h-1 rounded-full bg-primary/60" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
