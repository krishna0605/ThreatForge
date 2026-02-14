"use client";

import { DocSection } from "@/components/layout/DocSection";
import { DataTable } from "@/components/documentation/DataTable";
import { InfoCallout } from "@/components/documentation/InfoCallout";
import { CodeBlock } from "@/components/documentation/CodeBlock";

export const ConfigManagement = () => {
  return (
    <DocSection id="configuration">
      <h2 className="font-display font-bold text-3xl text-text-main dark:text-white mb-2 flex items-center gap-3">
        <span className="material-icons text-violet-500 text-3xl">settings</span>
        Configuration Management
      </h2>
      <div className="h-1 w-20 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full mb-8" />

      {/* 17.1 Twelve-Factor App */}
      <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 pl-4 border-l-4 border-violet-500">
        Twelve-Factor App Methodology
      </h3>
      <DataTable
        caption="Twelve-Factor Principles Applied"
        headers={["Factor", "Principle", "Implementation"]}
        rows={[
          ["III. Config", "Store config in environment", ".env files, never committed to VCS"],
          ["IV. Backing Services", "Treat as attached resources", "Supabase URL, Redis URL via env vars"],
          ["V. Build, Release, Run", "Strict separation", "Docker build → image → container"],
          ["VI. Processes", "Stateless processes", "JWT carries all session state"],
          ["VIII. Concurrency", "Scale via process model", "Gunicorn workers, Docker replicas"],
          ["XI. Logs", "Treat as event streams", "structlog → stdout → Promtail → Loki"],
        ]}
      />

      {/* 17.2 Environment Variables */}
      <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-violet-500">
        Environment Variables — Security Classification
      </h3>
      <DataTable
        caption="Environment Variable Sensitivity"
        headers={["Variable", "Service", "Sensitivity", "Description"]}
        rows={[
          ["SECRET_KEY", "Backend", "🔴 CRITICAL", "Flask session signing key"],
          ["JWT_SECRET_KEY", "Backend", "🔴 CRITICAL", "HMAC-SHA256 signing key"],
          ["SUPABASE_SERVICE_KEY", "Backend", "🔴 CRITICAL", "Full admin access to Supabase"],
          ["SUPABASE_URL", "Both", "🟡 MEDIUM", "Public Supabase API endpoint"],
          ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "Frontend", "🟢 LOW", "Public anon key (RLS enforced)"],
          ["ML_API_KEY", "Both", "🟡 MEDIUM", "Inter-service authentication"],
          ["ML_SERVICE_URL", "Backend", "🟢 LOW", "ML service endpoint"],
          ["CORS_ORIGINS", "Backend", "🟢 LOW", "Allowed CORS origins"],
          ["FLASK_CONFIG", "Backend", "🟢 LOW", "Environment selector (dev/prod)"],
        ]}
        highlightColumn={2}
      />

      {/* 17.3 Configuration Hierarchy */}
      <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-violet-500">
        Configuration Hierarchy — Override Pattern
      </h3>
      <CodeBlock language="plaintext" title="Configuration Priority" code={`1. Environment Variables (OS-level)      ← HIGHEST PRIORITY
2. .env file (python-dotenv)
3. Docker Compose environment block
4. app/config.py defaults               ← LOWEST PRIORITY`} />

      <InfoCallout type="info" title="Override Pattern">
        <p>Higher-priority sources override lower ones. This follows the <strong>Override Pattern</strong> common in configuration management systems, ensuring that production secrets are never stored in code.</p>
      </InfoCallout>
    </DocSection>
  );
};
