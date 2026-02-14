"use client";

import { useEffect, useState } from "react";


const sections = [
  { id: "executive-summary", label: "Executive Summary" },
  { id: "strategic-vision", label: "Strategic Vision" },
  { id: "system-architecture", label: "System Architecture" },
  { id: "tech-stack", label: "Technology Stack" },
  { id: "database-design", label: "Database Design" },
  { id: "security-architecture", label: "Security" },
  { id: "scanning-engine", label: "Scanning Engine" },
  { id: "machine-learning", label: "Machine Learning" },
  { id: "frontend-engineering", label: "Frontend" },
  { id: "api-design", label: "API Design" },
  { id: "real-time-features", label: "Real-Time Features" },
  { id: "observability", label: "Observability" },
  { id: "infrastructure", label: "Infrastructure" },
  { id: "error-handling", label: "Error Handling" },
  { id: "quality-assurance", label: "Quality Assurance" },
  { id: "roadmap", label: "Future Roadmap" },
];

export const TableOfContents = () => {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0% -35% 0%" }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 100,
        behavior: "smooth",
      });
    }
  };

  return (
    <nav className="sticky top-24 hidden lg:block max-h-[calc(100vh-120px)] overflow-y-auto pr-4 scrollbar-hide">
      <div className="font-mono text-[10px] text-text-muted dark:text-gray-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
        <span className="w-4 h-px bg-primary/40" />
        Navigation
      </div>
      <ul className="space-y-4">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              onClick={(e) => handleClick(e, section.id)}
                className={`
                  block text-sm py-1 transition-colors duration-200
                  ${activeId === section.id 
                    ? "text-primary font-medium" 
                    : "text-text-muted dark:text-gray-500 hover:text-text-main dark:hover:text-gray-300"}
                `}
            >
              <div className={`h-1.5 transition-all duration-300 rounded-full ${
                activeId === section.id ? "w-6 bg-primary" : "w-2 bg-gray-200 dark:bg-gray-800 group-hover:bg-primary/40"
              }`} />
              <span className={`font-display text-xs tracking-wider transition-all ${
                activeId === section.id ? "font-bold" : "font-normal"
              }`}>
                {section.label}
              </span>
            </a>
          </li>
        ))}
      </ul>

      {/* Terminal decorative footer */}
      <div className="mt-10 pt-6 border-t border-gray-100 dark:border-primary/5">
        <div className="font-mono text-[9px] text-text-muted dark:text-gray-600 leading-tight">
          $ systemctl status forge-docs<br/>
          <span className="text-primary">●</span> forge-docs.service - Documentation Engine<br/>
          &nbsp;&nbsp;&nbsp;Active: active (running)
        </div>
      </div>
    </nav>
  );
};
