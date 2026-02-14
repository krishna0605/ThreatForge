"use client";

import { DocSection } from "@/components/layout/DocSection";
import { DataTable } from "@/components/documentation/DataTable";
import { InfoCallout } from "@/components/documentation/InfoCallout";
import { FormulaBlock } from "@/components/documentation/FormulaBlock";
import { CodeBlock } from "@/components/documentation/CodeBlock";

export const Resilience = () => {
  return (
    <DocSection id="resilience">
      <h2 className="font-display font-bold text-3xl text-text-main dark:text-white mb-2 flex items-center gap-3">
        <span className="material-icons text-orange-500 text-3xl">health_and_safety</span>
        Error Handling &amp; Resilience
      </h2>
      <div className="h-1 w-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mb-8" />

      {/* 15.1 Defense in Depth */}
      <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 pl-4 border-l-4 border-orange-500">
        Defense in Depth — Error Handling Layers
      </h3>
      <DataTable
        caption="Error Handling Layers"
        headers={["Layer", "Technology", "Strategy"]}
        rows={[
          ["Client Validation", "Zod schemas (frontend)", "Fail fast — prevent invalid requests"],
          ["API Validation", "Pydantic schemas (backend)", "Schema validation at API boundary"],
          ["Business Logic", "Python try/except + structlog", "Catch and log with context"],
          ["Database", "CHECK constraints + FK refs", "Database-level integrity enforcement"],
          ["Infrastructure", "Docker health checks + restart", "unless-stopped auto-recovery"],
        ]}
      />

      {/* 15.2 Error Response Contract */}
      <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-orange-500">
        HTTP Error Response Contract
      </h3>
      <CodeBlock language="json" title="Standard Error Format" code={`{
    "error": "Human-readable message",
    "code": "MACHINE_READABLE_CODE",
    "details": {},
    "correlation_id": "uuid-for-debugging"
}`} />

      <DataTable
        caption="HTTP Status Code Map"
        headers={["Status", "Meaning", "Example"]}
        rows={[
          ["400", "Client error (bad input)", "Invalid scan options"],
          ["401", "Not authenticated", "Missing/expired JWT"],
          ["403", "Not authorized", "RBAC violation"],
          ["404", "Resource not found", "Scan ID doesn't exist"],
          ["409", "Conflict", "Duplicate email on signup"],
          ["422", "Validation error", "Pydantic schema failure"],
          ["429", "Rate limited", "Too many requests (SlowAPI)"],
          ["500", "Server error", "Unhandled exception"],
        ]}
      />

      {/* 15.3 Rate Limiting */}
      <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-orange-500">
        Rate Limiting — Token Bucket Algorithm
      </h3>
      <InfoCallout type="theorem" title="Token Bucket Algorithm">
        <p>A bucket holds <strong>B</strong> tokens (maximum burst). Tokens are added at rate <strong>R</strong> tokens/second. Each request consumes one token. If the bucket is empty, the request is rejected (429).</p>
      </InfoCallout>

      <FormulaBlock
        label="Token Bucket — Formal Model"
        formula="tokens(t) = min(B, tokens(t−1) + R × Δt)  |  allow(req) = tokens(t) ≥ 1"
        description="Requests are allowed only when tokens are available."
      />

      <DataTable
        caption="Configured Rate Limits"
        headers={["Endpoint Category", "Limit", "Purpose"]}
        rows={[
          ["Authentication endpoints", "5 req/minute", "Brute-force protection"],
          ["ML prediction endpoints", "10 req/minute", "Resource protection"],
          ["General API", "100 req/minute", "Abuse prevention"],
        ]}
      />
    </DocSection>
  );
};
