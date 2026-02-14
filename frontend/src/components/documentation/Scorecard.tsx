"use client";

import { motion } from "framer-motion";

const scores = [
  { category: "Security", score: 95, color: "text-green-500", icon: "security", basis: "Zero Trust Architecture, Argon2id, HMAC-SHA256" },
  { category: "Concurrency", score: 88, color: "text-blue-500", icon: "bolt", basis: "Actor Model, GIL Bypass, Event Loop I/O" },
  { category: "Data Integrity", score: 92, color: "text-cyan-500", icon: "storage", basis: "ACID Compliance, MVCC, 3NF, RLS" },
  { category: "Observability", score: 75, color: "text-yellow-500", icon: "visibility", basis: "OpenTelemetry, Prometheus, Structured Logging" },
  { category: "Scalability", score: 85, scoreColor: "text-primary", icon: "trending_up", basis: "Horizontal Partitioning, Stateless API, CAP Theorem" },
  { category: "Reliability", score: 87, scoreColor: "text-secondary", icon: "shield", basis: "Circuit Breaker, Exponential Backoff, Health Checks" },
  { category: "Maintainability", score: 90, scoreColor: "text-primary", icon: "settings_suggest", basis: "SOLID Principles, Clean Architecture, Type Safety" },
];

export const Scorecard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {scores.map((item, i) => (
        <motion.div
          key={item.category}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.05 }}
          whileHover={{ y: -5 }}
          className="glass-panel p-6 border border-gray-100 dark:border-primary/10 hover:border-primary/30 transition-all group overflow-hidden relative"
        >
          {/* Progress bar background */}
          <div className="absolute bottom-0 left-0 h-1 bg-gray-100 dark:bg-gray-800 w-full" />
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: `${item.score}%` }}
            transition={{ duration: 1, delay: 0.5 + i * 0.05 }}
            className="absolute bottom-0 left-0 h-1 bg-primary" 
          />

          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <span className="material-icons text-primary text-2xl group-hover:scale-110 transition-transform">
                {item.icon}
              </span>
              <h4 className="font-display font-bold text-lg text-text-main dark:text-white">
                {item.category}
              </h4>
            </div>
            <div className="text-2xl font-display font-bold text-primary">
              {item.score}<span className="text-xs text-text-muted">/100</span>
            </div>
          </div>
          
          <p className="font-mono text-xs text-text-muted dark:text-gray-400 leading-relaxed min-h-[3rem]">
            {item.basis}
          </p>

          <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-[10px] text-primary tracking-widest uppercase">Verified</span>
          </div>
        </motion.div>
      ))}
      
      {/* Total Score Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="glass-panel p-6 border-2 border-primary/40 bg-primary/5 flex flex-col items-center justify-center text-center overflow-hidden relative"
      >
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/10 rounded-full blur-2xl" />
        
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-2">
          Total Readiness
        </h3>
        <div className="text-5xl font-display font-bold text-primary mb-2">
          92<span className="text-lg">/100</span>
        </div>
        <div className="px-4 py-1 bg-primary text-white text-[10px] font-mono tracking-[0.2em] rounded-full">
          PRODUCTION READY
        </div>
      </motion.div>
    </div>
  );
};
