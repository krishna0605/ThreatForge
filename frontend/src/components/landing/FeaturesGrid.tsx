"use client";

import { motion, Variants } from "framer-motion";

const features = [
  {
    icon: "biotech",
    id: "SYS_01",
    title: "Malware Detection",
    desc: "Heuristic ML-scanning engine identifies zero-day threats and polymorphic viruses instantly.",
  },
  {
    icon: "image_search",
    id: "SYS_02",
    title: "Steganography",
    desc: "Advanced LSB & frequency analysis. Detect payloads hidden within seemingly innocent media files.",
  },
  {
    icon: "satellite_alt",
    id: "SYS_03",
    title: "Network Anomaly",
    desc: "Deep packet inspection (DPI) and traffic pattern analysis to flag unauthorized exfiltration.",
  },
  {
    icon: "description",
    id: "SYS_04",
    title: "YARA Rules",
    desc: "Write and deploy custom YARA rules. Tailor the detection engine to your specific threat model.",
  },
  {
    icon: "analytics",
    id: "SYS_05",
    title: "Real-time Analytics",
    desc: "Live dashboard visualizing attack vectors, blocked IPs, and system integrity status.",
  },
  {
    icon: "public",
    id: "SYS_06",
    title: "Global Threat Map",
    desc: "Visualize global threat intelligence feeds and anticipate attacks before they reach your perimeter.",
  },
];

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const card: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 120, damping: 16 },
  },
};

export default function FeaturesGrid() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={container}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-28"
    >
      {features.map((f) => (
        <motion.div
          key={f.id}
          variants={card}
          whileHover={{
            y: -6,
            boxShadow: "0 12px 40px rgba(0,143,57,0.08)",
            borderColor: "rgba(0,143,57,0.25)",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="hover-card glass-panel relative p-7 group border border-gray-200 dark:border-gray-700 overflow-hidden cursor-default"
        >
          <div className="box-corner box-corner-tl" />
          <div className="box-corner box-corner-tr" />
          <div className="box-corner box-corner-bl" />
          <div className="box-corner box-corner-br" />

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-5">
              <div className="p-2.5 bg-primary/5 border border-primary/15 rounded-sm">
                <motion.span
                  whileHover={{ scale: 1.2, rotate: 8 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="material-icons text-3xl text-primary"
                >
                  {f.icon}
                </motion.span>
              </div>
              <span className="text-[10px] text-primary/70 font-bold font-display tracking-[0.15em] border border-primary/15 px-2 py-0.5 bg-white dark:bg-black/20">
                {f.id}
              </span>
            </div>
            <h3 className="text-xl font-display text-text-main dark:text-white mb-2 group-hover:text-primary transition-colors duration-300 font-bold">
              {f.title}
            </h3>
            <p className="text-sm text-text-muted dark:text-gray-400 font-mono leading-relaxed group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300">
              {f.desc}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.section>
  );
}
