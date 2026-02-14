import { Introduction } from "../documentation/_components/Introduction";
import { Architecture } from "../documentation/_components/Architecture";
import { Security } from "../documentation/_components/Security";
import { Engine } from "../documentation/_components/Engine";
import { FrontendConsole } from "../documentation/_components/FrontendConsole";
import { DeepDive } from "../documentation/_components/DeepDive";
import { Resilience } from "../documentation/_components/Resilience";
import { QualityAssurance } from "../documentation/_components/QualityAssurance";
import { ConfigManagement } from "../documentation/_components/ConfigManagement";
import { Performance } from "../documentation/_components/Performance";
import { CodeQuality } from "../documentation/_components/CodeQuality";
import { Appendices } from "../documentation/_components/Appendices";
import { ComponentType } from "react";

export interface DocSection {
  slug: string;
  title: string;
  icon: string;
  description: string;
  color: string;
  gradient: string;
  /** Which component(s) to render on this slug's page */
  component: ComponentType;
  /** Group label for the TOC landing page */
  group: string;
}

export const docSections: DocSection[] = [
  // ── Group: Foundation ──
  {
    slug: "executive-summary",
    title: "Executive Summary",
    icon: "dashboard",
    description: "Platform overview, production readiness scorecard, and key metrics.",
    color: "text-primary",
    gradient: "from-primary to-emerald-500",
    component: Introduction,
    group: "Foundation",
  },
  {
    slug: "strategic-vision",
    title: "Strategic Vision",
    icon: "visibility",
    description: "Design principles, Amdahl's Law, and strategic architecture decisions.",
    color: "text-primary",
    gradient: "from-primary to-emerald-500",
    component: Introduction,
    group: "Foundation",
  },
  // ── Group: Architecture ──
  {
    slug: "system-architecture",
    title: "System Architecture",
    icon: "account_tree",
    description: "C4 container diagram, layered architecture, and service topology.",
    color: "text-blue-500",
    gradient: "from-blue-500 to-cyan-500",
    component: Architecture,
    group: "Architecture",
  },
  {
    slug: "tech-stack",
    title: "Technology Stack",
    icon: "layers",
    description: "Framework comparison, dependency analysis, and selection rationale.",
    color: "text-blue-500",
    gradient: "from-blue-500 to-cyan-500",
    component: Architecture,
    group: "Architecture",
  },
  {
    slug: "database-design",
    title: "Database Design",
    icon: "storage",
    description: "PostgreSQL schema, RLS policies, and normalization theory.",
    color: "text-blue-500",
    gradient: "from-blue-500 to-cyan-500",
    component: Architecture,
    group: "Architecture",
  },
  // ── Group: Security ──
  {
    slug: "security-architecture",
    title: "Security Architecture",
    icon: "shield",
    description: "Zero Trust, Argon2id, JWT, TOTP MFA, and security headers.",
    color: "text-red-500",
    gradient: "from-red-500 to-rose-500",
    component: Security,
    group: "Security",
  },
  // ── Group: Detection Engine ──
  {
    slug: "scanning-engine",
    title: "Scanning Engine",
    icon: "radar",
    description: "9-step pipeline, Shannon entropy, YARA rules, and PE analysis.",
    color: "text-amber-500",
    gradient: "from-amber-500 to-orange-500",
    component: Engine,
    group: "Detection Engine",
  },
  {
    slug: "ml-deep-dive",
    title: "ML Deep Dive",
    icon: "model_training",
    description: "Random Forest theory, feature engineering, and training pipeline.",
    color: "text-purple-500",
    gradient: "from-purple-500 to-violet-500",
    component: Engine,
    group: "Detection Engine",
  },
  // ── Group: Frontend & API ──
  {
    slug: "frontend-engineering",
    title: "Frontend Engineering",
    icon: "web",
    description: "React reconciliation, SSR hydration, and component architecture.",
    color: "text-cyan-500",
    gradient: "from-cyan-500 to-blue-500",
    component: FrontendConsole,
    group: "Frontend & API",
  },
  {
    slug: "api-design",
    title: "API Design",
    icon: "api",
    description: "REST constraints, HTTP semantics, and endpoint reference.",
    color: "text-green-500",
    gradient: "from-green-500 to-emerald-500",
    component: FrontendConsole,
    group: "Frontend & API",
  },
  {
    slug: "real-time-features",
    title: "Real-Time Features",
    icon: "electrical_services",
    description: "Redis queues, WebSocket architecture, and notification system.",
    color: "text-indigo-500",
    gradient: "from-indigo-500 to-violet-500",
    component: FrontendConsole,
    group: "Frontend & API",
  },
  // ── Group: Operations ──
  {
    slug: "auth-deep-dive",
    title: "Auth Deep Dive",
    icon: "verified_user",
    description: "3-phase auth evolution, OAuth, trigger patterns, and session management.",
    color: "text-yellow-500",
    gradient: "from-yellow-500 to-amber-500",
    component: DeepDive,
    group: "Operations",
  },
  {
    slug: "observability",
    title: "Observability",
    icon: "analytics",
    description: "Three pillars: traces, metrics, logs with Grafana and Prometheus.",
    color: "text-teal-500",
    gradient: "from-teal-500 to-emerald-500",
    component: DeepDive,
    group: "Operations",
  },
  {
    slug: "infrastructure",
    title: "Infrastructure",
    icon: "cloud",
    description: "Docker multi-stage builds, Compose services, and deployment topology.",
    color: "text-slate-400",
    gradient: "from-slate-400 to-gray-500",
    component: DeepDive,
    group: "Operations",
  },
  // ── Group: Reliability ──
  {
    slug: "resilience",
    title: "Error Handling",
    icon: "health_and_safety",
    description: "Defense in depth, HTTP error contracts, and token bucket rate limiting.",
    color: "text-orange-500",
    gradient: "from-orange-500 to-red-500",
    component: Resilience,
    group: "Reliability",
  },
  {
    slug: "quality-assurance",
    title: "Quality Assurance",
    icon: "verified",
    description: "Testing pyramid, coverage metrics, and quality gates.",
    color: "text-emerald-500",
    gradient: "from-emerald-500 to-green-500",
    component: QualityAssurance,
    group: "Reliability",
  },
  {
    slug: "configuration",
    title: "Config Management",
    icon: "settings",
    description: "Twelve-Factor methodology, env var classification, and override patterns.",
    color: "text-violet-500",
    gradient: "from-violet-500 to-purple-500",
    component: ConfigManagement,
    group: "Reliability",
  },
  {
    slug: "performance",
    title: "Performance",
    icon: "speed",
    description: "Algorithmic complexity, Core Web Vitals, and Amdahl's Law.",
    color: "text-rose-500",
    gradient: "from-rose-500 to-pink-500",
    component: Performance,
    group: "Reliability",
  },
  // ── Group: Engineering ──
  {
    slug: "code-quality",
    title: "Code Quality",
    icon: "code",
    description: "SOLID principles, design patterns, and type safety across layers.",
    color: "text-blue-500",
    gradient: "from-blue-500 to-indigo-500",
    component: CodeQuality,
    group: "Engineering",
  },
  {
    slug: "roadmap",
    title: "Future Roadmap",
    icon: "rocket_launch",
    description: "Federated learning, GNN, autonomous response, and YARA-X.",
    color: "text-pink-500",
    gradient: "from-pink-500 to-rose-500",
    component: CodeQuality,
    group: "Engineering",
  },
  // ── Group: Reference ──
  {
    slug: "appendices",
    title: "Appendices",
    icon: "menu_book",
    description: "Mathematical glossary: information theory, complexity, and cryptography.",
    color: "text-gray-400",
    gradient: "from-gray-400 to-gray-600",
    component: Appendices,
    group: "Reference",
  },
  {
    slug: "api-reference",
    title: "API Reference",
    icon: "terminal",
    description: "Complete endpoint reference for all 40+ API routes.",
    color: "text-sky-500",
    gradient: "from-sky-500 to-blue-500",
    component: Appendices,
    group: "Reference",
  },
  {
    slug: "project-history",
    title: "Project History",
    icon: "history",
    description: "Data flow discoveries, MFA challenges, and ML evolution.",
    color: "text-amber-400",
    gradient: "from-amber-400 to-yellow-500",
    component: Appendices,
    group: "Reference",
  },
];

/** All unique group names in order */
export const docGroups = [...new Set(docSections.map((s) => s.group))];

/** Get section by slug */
export const getSectionBySlug = (slug: string) =>
  docSections.find((s) => s.slug === slug);

/** Get previous and next sections */
export const getAdjacentSections = (slug: string) => {
  const index = docSections.findIndex((s) => s.slug === slug);
  return {
    prev: index > 0 ? docSections[index - 1] : null,
    next: index < docSections.length - 1 ? docSections[index + 1] : null,
  };
};
