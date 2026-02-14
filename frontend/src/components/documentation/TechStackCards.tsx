"use client";

import { motion } from "framer-motion";

const groups = [
  {
    name: "Frontend",
    items: [
      { name: "React 19.2.3", role: "UI Library", icon: "widgets", color: "text-blue-400" },
      { name: "Next.js 16.1.6", role: "Framework", icon: "auto_awesome", color: "text-white" },
      { name: "Tailwind CSS 4", role: "Styling", icon: "palette", color: "text-cyan-400" },
      { name: "Framer Motion 12", role: "Animations", icon: "motion_photos_on", color: "text-purple-400" },
    ]
  },
  {
    name: "Backend",
    items: [
      { name: "Python 3.11", role: "Core Language", icon: "code", color: "text-yellow-400" },
      { name: "Flask 3.1.0", role: "API Framework", icon: "api", color: "text-gray-300" },
      { name: "Gunicorn + Gevent", role: "WSGI Server", icon: "dns", color: "text-green-400" },
      { name: "Pydantic 2.x", role: "Validation", icon: "fact_check", color: "text-red-400" },
    ]
  },
  {
    name: "ML & Scanning",
    items: [
      { name: "FastAPI", role: "ML Service", icon: "bolt", color: "text-teal-400" },
      { name: "scikit-learn 1.4", role: "ML Models", icon: "psychology", color: "text-orange-400" },
      { name: "YARA-Python", role: "Static Analysis", icon: "biotech", color: "text-primary" },
      { name: "pefile 2024.8", role: "Binary Parsing", icon: "architecture", color: "text-blue-300" },
    ]
  },
  {
    name: "Infrastructure",
    items: [
      { name: "PostgreSQL 16", role: "Primary Store", icon: "storage", color: "text-blue-500" },
      { name: "Redis 7", role: "Broker & Cache", icon: "memory", color: "text-red-500" },
      { name: "Docker", role: "Containerization", icon: "grid_view", color: "text-sky-400" },
      { name: "Supabase", role: "Auth & Database", icon: "cloud", color: "text-green-500" },
    ]
  }
];

export const TechStackCards = () => {
  return (
    <div className="space-y-12">
      {groups.map((group, groupIdx) => (
        <div key={group.name}>
          <motion.h3 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="font-display font-bold text-xl text-text-main dark:text-white mb-6 flex items-center gap-3"
          >
            <span className="w-8 h-px bg-primary/30" />
            {group.name}
          </motion.h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {group.items.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 + groupIdx * 0.1 }}
                whileHover={{ y: -4, backgroundColor: "rgba(0, 143, 57, 0.05)" }}
                className="glass-panel p-5 border border-gray-100 dark:border-primary/5 transition-all text-center group"
              >
                <span className={`material-icons ${item.color} text-2xl mb-3 block group-hover:scale-125 transition-transform`}>
                  {item.icon}
                </span>
                <div className="font-display font-bold text-sm text-text-main dark:text-white mb-1">
                  {item.name}
                </div>
                <div className="font-mono text-[10px] text-text-muted dark:text-gray-500 uppercase tracking-widest">
                  {item.role}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
