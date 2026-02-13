"use client";

export default function GlobalThreatMap() {
  return (
    <section className="mb-24 glass-panel border border-gray-200 dark:border-primary/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-secondary to-primary"></div>

      <div className="relative p-8 md:p-12 flex flex-col md:flex-row justify-around items-center gap-12 text-center md:text-left">
        {[
          {
            label: "Threats Blocked Today",
            value: "842,912",
            color: "red-500 shadow-neon",
          },
          {
            label: "Active Nodes",
            value: "14,056",
            color: "secondary shadow-neon-blue",
          },
          {
            label: "AI Accuracy",
            value: "99.98%",
            color: "green-500",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="flex flex-col items-center md:items-start group cursor-default"
          >
            <div className="text-xs font-mono text-text-muted dark:text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2">
              <span
                className={`w-2 h-2 bg-${stat.color.split(" ")[0]} rounded-full animate-pulse`}
              ></span>
              {stat.label}
            </div>
            <div className="text-4xl md:text-5xl font-display font-bold text-text-main dark:text-white tracking-tighter group-hover:text-primary transition-colors">
              {stat.value}
            </div>
            <div className="w-full h-px bg-gray-200 dark:bg-gray-700 mt-4 relative overflow-hidden">
              <div
                className={`absolute left-0 top-0 h-full w-1/2 bg-${stat.color.split(" ")[0]} animate-scanline`}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
