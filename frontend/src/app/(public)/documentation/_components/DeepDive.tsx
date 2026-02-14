"use client";

import { DocSection } from "@/components/layout/DocSection";
import { DataTable } from "@/components/documentation/DataTable";
import { InfoCallout } from "@/components/documentation/InfoCallout";
import { DiagramFrame } from "@/components/documentation/DiagramFrame";
import { CodeBlock } from "@/components/documentation/CodeBlock";
import Mermaid from "@/components/ui/Mermaid";

export const DeepDive = () => {
  return (
    <>
      {/* ── Section 12: Auth Deep Dive ──────── */}
      <DocSection id="auth-deep-dive">
        <h2 className="font-display font-bold text-3xl text-text-main dark:text-white mb-2 flex items-center gap-3">
          <span className="material-icons text-yellow-500 text-3xl">verified_user</span>
          Authentication Deep Dive
        </h2>
        <div className="h-1 w-20 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full mb-8" />

        {/* 12.1 Auth Evolution */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 pl-4 border-l-4 border-yellow-500">
          Authentication Evolution — 3 Phases
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {[
            { phase: "Phase 1", title: "Email/Password", score: "65/100", desc: "Supabase Auth, profiles table, JWT (HS256), single-factor only.", color: "border-orange-500/30", badge: "bg-orange-500/10 text-orange-500" },
            { phase: "Phase 2", title: "+ Google OAuth", score: "80/100", desc: "Google OAuth 2.0 via Supabase, token exchange endpoint, auto-profile creation.", color: "border-blue-500/30", badge: "bg-blue-500/10 text-blue-500" },
            { phase: "Phase 3", title: "+ MFA (TOTP)", score: "95/100", desc: "TOTP via PyOTP, backup recovery codes, unified MFA flow, temp token mechanism.", color: "border-green-500/30", badge: "bg-green-500/10 text-green-500" },
          ].map((p, i) => (
            <div key={i} className={`glass-panel p-5 border ${p.color} rounded-xl`}>
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${p.badge}`}>{p.phase}</span>
              <h4 className="font-display font-bold text-sm text-text-main dark:text-white mt-3 mb-1">{p.title}</h4>
              <div className="font-mono text-lg text-primary mb-2">{p.score}</div>
              <p className="text-xs text-text-muted dark:text-gray-400">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* 12.2 Trigger Pattern */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 pl-4 border-l-4 border-yellow-500">
          Auto Profile Creation — Trigger Pattern
        </h3>
        <InfoCallout type="info" title="Event-Driven Architecture at Database Level">
          <p>When a new user signs up (email or Google OAuth), a PostgreSQL trigger automatically creates their profile, ensuring data consistency without application-level orchestration.</p>
        </InfoCallout>

        <CodeBlock language="sql" title="Auto Profile Trigger" code={`CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name',
                 split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`} />
      </DocSection>

      {/* ── Section 13: Observability ──────── */}
      <DocSection id="observability">
        <h2 className="font-display font-bold text-3xl text-text-main dark:text-white mb-2 flex items-center gap-3">
          <span className="material-icons text-teal-500 text-3xl">monitoring</span>
          Observability
        </h2>
        <div className="h-1 w-20 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full mb-8" />

        {/* 13.1 Three Pillars */}
        <DataTable
          caption="Three Pillars of Observability (CNCF)"
          headers={["Pillar", "Technology", "Protocol", "Purpose"]}
          rows={[
            ["Traces", "Grafana Tempo", "OTLP (W3C Trace Context)", "Request flow across services"],
            ["Metrics", "Prometheus", "Pull-based scrape (/metrics)", "System health, latency percentiles"],
            ["Logs", "Grafana Loki + Promtail", "Push via Docker socket", "Structured JSON event logs"],
          ]}
        />

        <InfoCallout type="success" title="Unified Visualization">
          <p><strong>Grafana 10.x</strong> unifies all three pillars in a single dashboard with correlation between traces, metrics, and logs via <code>trace_id</code>.</p>
        </InfoCallout>

        {/* 13.2 OpenTelemetry */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-teal-500">
          Distributed Tracing — W3C Trace Context
        </h3>
        <div className="prose prose-lg dark:prose-invert text-text-muted dark:text-gray-300 mb-4">
          <p>
            Every request receives a <code>X-Correlation-ID</code> header (UUID v4), bound to structlog context, propagated to downstream services, and linked to OpenTelemetry <code>trace_id</code> and <code>span_id</code>.
          </p>
        </div>

        {/* 13.3 Structured Logging */}
        <CodeBlock language="json" title="Structured Log Entry" code={`{
    "timestamp": "2026-02-14T10:30:00Z",
    "level": "info",
    "event": "scan_completed",
    "correlation_id": "a1b2c3d4-...",
    "trace_id": "0af7651916cd43dd8448eb211c80319c",
    "scan_id": "e5f6g7h8-...",
    "duration_ms": 3450,
    "threats_found": 3,
    "service": "flask-api"
}`} />

        {/* 13.4 Prometheus Metrics */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-teal-500">
          Prometheus Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <div className="glass-panel p-5 border border-teal-500/20 rounded-xl">
            <h4 className="font-display font-bold text-sm text-text-main dark:text-white mb-2">Flask Backend</h4>
            <ul className="text-xs text-text-muted dark:text-gray-400 space-y-1 font-mono">
              <li>• flask_http_request_duration_seconds (histogram)</li>
              <li>• flask_http_request_total (counter by method+status)</li>
              <li>• flask_http_request_exceptions_total (counter)</li>
            </ul>
          </div>
          <div className="glass-panel p-5 border border-teal-500/20 rounded-xl">
            <h4 className="font-display font-bold text-sm text-text-main dark:text-white mb-2">ML Service</h4>
            <ul className="text-xs text-text-muted dark:text-gray-400 space-y-1 font-mono">
              <li>• http_request_duration_seconds (histogram)</li>
              <li>• http_requests_total (counter)</li>
              <li>• model_prediction_duration_seconds (custom)</li>
            </ul>
          </div>
        </div>

        {/* 13.5 Observability Diagram */}
        <DiagramFrame title="Observability Architecture">
          <Mermaid chart={`
graph TB
    subgraph Services["Application Services"]
        Flask["Flask API (5000)"]
        FastAPI["FastAPI ML (7860)"]
        NextJS["Next.js (3000)"]
    end
    subgraph Collectors["Collection Layer"]
        Promtail["Promtail"]
        PromScrape["Prometheus Scraper"]
        OTELCol["Tempo OTLP Receiver"]
    end
    subgraph Storage["Storage Layer"]
        Loki["Loki (Log TSDB)"]
        PromDB["Prometheus TSDB"]
        TempoStore["Tempo Trace Store"]
    end
    subgraph Viz["Visualization"]
        Grafana["Grafana Dashboards"]
    end
    Flask -->|stdout JSON| Promtail
    FastAPI -->|stdout JSON| Promtail
    Promtail -->|Push| Loki
    Flask -->|/metrics| PromScrape
    FastAPI -->|/metrics| PromScrape
    PromScrape -->|Store| PromDB
    Flask -->|OTLP HTTP| OTELCol
    FastAPI -->|OTLP HTTP| OTELCol
    OTELCol -->|Store| TempoStore
    Loki --> Grafana
    PromDB --> Grafana
    TempoStore --> Grafana
          `} />
        </DiagramFrame>
      </DocSection>

      {/* ── Section 14: Infrastructure ────────── */}
      <DocSection id="infrastructure">
        <h2 className="font-display font-bold text-3xl text-text-main dark:text-white mb-2 flex items-center gap-3">
          <span className="material-icons text-slate-400 text-3xl">cloud</span>
          Infrastructure &amp; Network Topology
        </h2>
        <div className="h-1 w-20 bg-gradient-to-r from-slate-400 to-gray-500 rounded-full mb-8" />

        {/* 14.1 Docker Multi-Stage */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 pl-4 border-l-4 border-gray-400">
          Docker Multi-Stage Builds
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <div className="glass-panel p-5 border border-blue-500/20 rounded-xl">
            <h4 className="font-display font-bold text-sm text-text-main dark:text-white mb-2">Stage 1: Builder</h4>
            <p className="text-xs text-text-muted dark:text-gray-400">Contains build tools (<code>gcc</code>, <code>python3-dev</code> for C-extensions like <code>yara-python</code>).</p>
          </div>
          <div className="glass-panel p-5 border border-green-500/20 rounded-xl">
            <h4 className="font-display font-bold text-sm text-text-main dark:text-white mb-2">Stage 2: Runner</h4>
            <p className="text-xs text-text-muted dark:text-gray-400">Slim Python base. No compilers, debuggers, or package managers — <strong>Principle of Least Privilege</strong>.</p>
          </div>
        </div>

        {/* 14.2 Docker Compose */}
        <DataTable
          caption="Docker Compose — 8 Services"
          headers={["Tier", "Services", "Ports"]}
          rows={[
            ["Frontend", "frontend (Next.js)", "3000"],
            ["Backend", "backend (Flask), ml-service (FastAPI)", "5000, 7860"],
            ["Observability", "prometheus, loki, promtail, tempo, grafana", "9090, 3100, 3200, 3001"],
            ["Network", "threatforge bridge network", "Internal"],
          ]}
        />

        <InfoCallout type="info" title="Health Check Pattern">
          <p>Every service defines health check endpoints with configurable intervals (30s), timeouts (5s), and retry counts (3). <code>depends_on</code> with <code>condition: service_healthy</code> ensures startup ordering: <strong>ml-service → backend → frontend</strong>.</p>
        </InfoCallout>

        {/* 14.3 Deployment Topology */}
        <DataTable
          caption="Production Deployment Topology"
          headers={["Component", "Platform", "Scaling"]}
          rows={[
            ["Frontend", "Vercel Edge Network", "Global CDN, auto-scale"],
            ["Backend API", "Railway PaaS", "Horizontal (multiple dynos)"],
            ["ML Service", "Hugging Face Spaces", "GPU-enabled, auto-sleep"],
            ["Database", "Supabase Cloud", "Managed PostgreSQL, connection pooling"],
            ["Observability", "Docker Compose (dev) / Cloud (prod)", "Vertical"],
          ]}
        />

        {/* 14.4 Network Topology Diagram */}
        <DiagramFrame title="Production Network Topology">
          <Mermaid chart={`
graph TB
    Internet["Internet"] -->|HTTPS 443| CF["Cloudflare CDN/WAF"]
    CF -->|Edge Routing| Vercel["Vercel Edge Network"]
    CF -->|SSL Termination| Railway["Railway PaaS"]
    subgraph Vercel_Infra["Vercel"]
        Edge["Edge Functions"]
        SSR["SSR Server (Next.js)"]
        Static["Static Assets (CDN)"]
    end
    subgraph Railway_Infra["Railway"]
        LB["Load Balancer"]
        LB --> API1["Flask Instance 1"]
        LB --> API2["Flask Instance 2"]
    end
    subgraph HF["Hugging Face Spaces"]
        MLAPI["FastAPI ML Service"]
        Models["Trained Models"]
    end
    subgraph Supabase_Cloud["Supabase Cloud"]
        PG["PostgreSQL 16"]
        SupaAuth["Supabase Auth"]
        S3Storage["S3 Storage"]
        Realtime["Realtime Engine"]
    end
    SSR -->|API Calls| LB
    API1 -->|HTTP| MLAPI
    API2 -->|HTTP| MLAPI
    API1 -->|SQL| PG
    API2 -->|SQL| PG
    API1 -->|File Upload| S3Storage
    SSR -->|Auth| SupaAuth
          `} />
        </DiagramFrame>
      </DocSection>
    </>
  );
};
