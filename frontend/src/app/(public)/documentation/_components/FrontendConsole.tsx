"use client";

import { motion } from "framer-motion";
import { DocSection } from "@/components/layout/DocSection";
import { DataTable } from "@/components/documentation/DataTable";
import { InfoCallout } from "@/components/documentation/InfoCallout";
import { FormulaBlock } from "@/components/documentation/FormulaBlock";
import { DiagramFrame } from "@/components/documentation/DiagramFrame";
import { CodeBlock } from "@/components/documentation/CodeBlock";
import Mermaid from "@/components/ui/Mermaid";

export const FrontendConsole = () => {
  return (
    <>
      {/* ── Section 9: Frontend Engineering ───── */}
      <DocSection id="frontend-engineering">
        <h2 className="font-display font-bold text-3xl text-text-main dark:text-white mb-2 flex items-center gap-3">
          <span className="material-icons text-cyan-500 text-3xl">web</span>
          Frontend Engineering
        </h2>
        <div className="h-1 w-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mb-8" />

        {/* 9.1 Critical Rendering Path */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 pl-4 border-l-4 border-cyan-500">
          The Critical Rendering Path
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          {[
            { step: 1, title: "Parse HTML → DOM Tree", desc: "Document Object Model" },
            { step: 2, title: "Parse CSS → CSSOM Tree", desc: "CSS Object Model" },
            { step: 3, title: "Combine → Render Tree", desc: "Only visible nodes" },
            { step: 4, title: "Layout", desc: "Calculate geometry (reflow)" },
            { step: 5, title: "Paint", desc: "Rasterize pixels (repaint)" },
            { step: 6, title: "Composite", desc: "GPU layers merged" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              className="p-3 rounded-lg border border-gray-200 dark:border-primary/10 bg-white dark:bg-black/20">
              <span className="font-mono text-[10px] text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded-full">{s.step}</span>
              <h4 className="font-display font-bold text-xs text-text-main dark:text-white mt-2">{s.title}</h4>
              <p className="text-[10px] text-text-muted dark:text-gray-500 mt-1">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        <InfoCallout type="info" title="Animation Performance">
          <p>Layout has <strong>O(n)</strong> complexity where n = affected DOM nodes. CSS <code>transform</code> and <code>opacity</code> only trigger the Composite step (GPU-accelerated), bypassing Layout and Paint — this is why Framer Motion uses <code>transform</code> exclusively for 60fps.</p>
        </InfoCallout>

        {/* 9.2 React Reconciliation */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-cyan-500">
          React Reconciliation — O(n) Diffing
        </h3>
        <FormulaBlock
          label="Diffing Complexity"
          formula="General Tree Edit Distance: O(n³) → React Heuristic: O(n)"
          description="Two heuristics: (1) Different element types produce entirely different trees. (2) Developer-provided keys identify stable children across renders."
        />

        <CodeBlock language="plaintext" title="Virtual DOM Diffing Process" code={`1. Component state changes → React creates new Virtual DOM tree
2. Diff(oldVDOM, newVDOM) → Generates minimal changeset (patches)
3. Apply patches to real DOM → Only modified nodes are touched`} />

        {/* 9.3 SSR & Hydration */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-cyan-500">
          Server-Side Rendering &amp; Hydration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <div className="glass-panel p-5 border border-blue-500/20 rounded-xl">
            <h4 className="font-display font-bold text-sm text-text-main dark:text-white mb-2 flex items-center gap-2">
              <span className="material-icons text-blue-500 text-sm">dns</span>Phase 1: Server Render
            </h4>
            <ul className="text-xs text-text-muted dark:text-gray-400 space-y-1">
              <li>• React renders component tree → Virtual DOM → HTML string</li>
              <li>• HTML streamed to browser → Fast <strong>FCP</strong></li>
              <li>• No JavaScript required for initial visual</li>
            </ul>
          </div>
          <div className="glass-panel p-5 border border-green-500/20 rounded-xl">
            <h4 className="font-display font-bold text-sm text-text-main dark:text-white mb-2 flex items-center gap-2">
              <span className="material-icons text-green-500 text-sm">bolt</span>Phase 2: Client Hydration
            </h4>
            <ul className="text-xs text-text-muted dark:text-gray-400 space-y-1">
              <li>• Browser downloads React JS bundle</li>
              <li>• React &quot;hydrates&quot; existing HTML: attaches event listeners</li>
              <li>• Components become interactive → <strong>TTI</strong></li>
            </ul>
          </div>
        </div>

        <InfoCallout type="success" title="React 19 Streaming SSR">
          <p>Uses <code>renderToPipeableStream()</code> which enables <strong>progressive rendering</strong> — sending HTML chunks as they become available, rather than waiting for the entire page.</p>
        </InfoCallout>

        {/* 9.4 Component Architecture */}
        <DataTable
          caption="Component Architecture — 33 Components"
          headers={["Domain", "Components", "Pattern"]}
          rows={[
            ["Layout", "Sidebar, Navbar, Footer, PageLayout", "Compound Component"],
            ["Authentication", "LoginForm, SignupForm, MFAEnroll, MFAVerify, GoogleSignIn", "Controlled Component"],
            ["Scanner", "FileDropzone, ScanProgress, ScanOptions, ScanHistory", "Observer Pattern"],
            ["Results", "ThreatDashboard, FindingsTable, ConfidenceBar, SeverityBadge", "Presentational"],
            ["Charts", "ThreatChart, EntropyGraph, TimelineChart, GeoMap", "Container/Presenter"],
            ["Reports", "ReportTable, ReportExport (PDF), ShareDialog", "Command Pattern"],
            ["Settings", "ProfileForm, SecuritySettings, APIKeyManager, SessionManager", "Form Controller"],
          ]}
        />

        {/* 9.5 State Management */}
        <DataTable
          caption="Layered State Management"
          headers={["Layer", "Technology", "Scope", "Theoretical Basis"]}
          rows={[
            ["Server State", "React Server Components + fetch()", "Per-route", "Request-Response model"],
            ["Client Cache", "useState + useEffect", "Component tree", "Observer Pattern"],
            ["Auth State", "React Context (AuthProvider)", "Global", "Singleton Pattern"],
            ["Theme State", "next-themes", "Global", "Media Query + localStorage"],
            ["Form State", "Zod 4.3.6 validation", "Per-form", "Schema-driven validation"],
          ]}
        />

        {/* 9.6 UI Component Hierarchy */}
        <DiagramFrame title="UI Component Hierarchy">
          <Mermaid chart={`
graph TD
    Root["App Root (layout.tsx)"] --> Providers["Context Providers"]
    subgraph Providers_Group[" "]
        Auth["AuthProvider"]
        Theme["ThemeProvider"]
        Toast["Toaster (sonner)"]
    end
    Providers --> Layout["Dashboard Layout"]
    Layout --> Nav["Navigation Bar"]
    Layout --> Sidebar["Sidebar Menu"]
    Layout --> Page["Page Content"]
    Page -->|"/scan"| Scanner["Scanner Component"]
    Scanner --> Dropzone["react-dropzone"]
    Scanner --> Options["Scan Options Panel"]
    Scanner --> Progress["Real-Time Progress Bar"]
    Page -->|"/dashboard"| Dashboard["Dashboard"]
    Dashboard --> Stats["Stat Cards"]
    Dashboard --> Charts["Chart.js Visualizations"]
    Dashboard --> Recent["Recent Scans Table"]
    Page -->|"/results"| Results["Results Dashboard"]
    Results --> Findings["Findings Table"]
    Results --> Details["Finding Detail Panel"]
    Results --> Export["PDF Export (jspdf)"]
    Page -->|"/settings"| Settings["Settings Page"]
    Settings --> Profile["Profile Tab"]
    Settings --> Security["Security Tab"]
    Settings --> APIKeys["API Keys Tab"]
          `} />
        </DiagramFrame>
      </DocSection>

      {/* ── Section 10: API Design ──────────── */}
      <DocSection id="api-design">
        <h2 className="font-display font-bold text-3xl text-text-main dark:text-white mb-2 flex items-center gap-3">
          <span className="material-icons text-green-500 text-3xl">api</span>
          API Design Philosophy
        </h2>
        <div className="h-1 w-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-8" />

        {/* 10.1 REST Constraints */}
        <DataTable
          caption="REST Architectural Constraints (Fielding, 2000)"
          headers={["Constraint", "Implementation"]}
          rows={[
            ["Client-Server", "Next.js frontend ↔ Flask API ↔ PostgreSQL"],
            ["Stateless", "JWT tokens carry all session state; server stores no session"],
            ["Cacheable", "Cache-Control headers on GET responses"],
            ["Layered System", "Client → Load Balancer → API → Database"],
            ["Uniform Interface", "Resource-oriented URLs, standard HTTP methods"],
            ["Code on Demand", "Optional: JS delivered via SSR for interactivity"],
          ]}
        />

        {/* 10.2 HTTP Methods */}
        <DataTable
          caption="HTTP Method Semantics (RFC 7231)"
          headers={["Method", "Idempotent", "Safe", "Use in ThreatForge"]}
          rows={[
            ["GET", "✅", "✅", "Retrieve scans, findings, user profile"],
            ["POST", "❌", "❌", "Create scan, login, signup, upload file"],
            ["PUT", "✅", "❌", "Update profile, update YARA rule"],
            ["PATCH", "❌", "❌", "Partial update (notification read status)"],
            ["DELETE", "✅", "❌", "Delete scan, revoke API key, revoke session"],
          ]}
        />

        <FormulaBlock
          label="Idempotency — Formal Property"
          formula="f(f(x)) = f(x)"
          description="An idempotent operation applied multiple times yields the same result. Clients can safely retry PUT/DELETE requests without side effects."
        />

        {/* 10.3 API Resource Map */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-green-500">
          API Endpoint Map
        </h3>
        <DataTable
          caption="Authentication Endpoints (/api/auth/)"
          headers={["Endpoint", "Method", "Auth", "Description"]}
          rows={[
            ["/signup", "POST", "❌", "Register new user"],
            ["/login", "POST", "❌", "Authenticate, return JWT"],
            ["/me", "GET", "✅ JWT", "Get current user profile"],
            ["/logout", "POST", "✅ JWT", "Revoke session"],
            ["/refresh", "POST", "✅ Refresh", "Rotate access token"],
            ["/forgot-password", "POST", "❌", "Send reset email via Resend"],
            ["/mfa/enroll", "POST", "✅ JWT", "Generate TOTP secret + QR"],
            ["/mfa/verify", "POST", "✅ JWT", "Confirm MFA enrollment"],
            ["/mfa/verify-login", "POST", "❌ (temp)", "2FA login verification"],
            ["/google", "POST", "❌", "OAuth token exchange"],
          ]}
        />

        <DataTable
          caption="Scanning Endpoints (/api/scans/)"
          headers={["Endpoint", "Method", "Auth", "Description"]}
          rows={[
            ["/", "POST", "✅ JWT", "Create & start scan"],
            ["/", "GET", "✅ JWT", "List user's scans"],
            ["/<id>", "GET", "✅ JWT", "Get scan details + findings"],
            ["/<id>", "DELETE", "✅ JWT", "Delete scan"],
            ["/<id>/findings", "GET", "✅ JWT", "List scan findings"],
          ]}
        />
      </DocSection>

      {/* ── Section 11: Real-Time Features ────── */}
      <DocSection id="real-time-features">
        <h2 className="font-display font-bold text-3xl text-text-main dark:text-white mb-2 flex items-center gap-3">
          <span className="material-icons text-indigo-500 text-3xl">electrical_services</span>
          Real-Time Features
        </h2>
        <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full mb-8" />

        {/* 11.1 Producer-Consumer */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 pl-4 border-l-4 border-indigo-500">
          Producer-Consumer Pattern via Redis
        </h3>
        <div className="prose prose-lg dark:prose-invert text-text-muted dark:text-gray-300 mb-4">
          <p>Redis serves as a message broker implementing the <strong>Producer-Consumer Pattern</strong> to decouple the API from Analysis Workers.</p>
        </div>

        <CodeBlock language="plaintext" title="Queue Semantics" code={`LPUSH scan_queue {task}    → Producer pushes (O(1))
BRPOP scan_queue 0         → Consumer blocks until available (O(1))
FIFO ordering: First-In-First-Out with exact-once delivery`} />

        {/* 11.2 WebSocket */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-indigo-500">
          WebSocket Architecture
        </h3>
        <CodeBlock language="plaintext" title="WebSocket Protocol Upgrade" code={`Client → Server: GET /socket.io/ HTTP/1.1
                  Upgrade: websocket
                  Connection: Upgrade

Server → Client: HTTP/1.1 101 Switching Protocols
                  Upgrade: websocket`} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8 mt-6">
          <div className="glass-panel p-5 border border-red-500/20 rounded-xl">
            <h4 className="font-display font-bold text-sm text-text-main dark:text-white mb-2">HTTP Polling ❌</h4>
            <p className="text-xs text-text-muted dark:text-gray-400"><strong>O(n)</strong> requests for n status checks, each with ~200 bytes header overhead.</p>
          </div>
          <div className="glass-panel p-5 border border-green-500/20 rounded-xl">
            <h4 className="font-display font-bold text-sm text-text-main dark:text-white mb-2">WebSocket ✅</h4>
            <p className="text-xs text-text-muted dark:text-gray-400"><strong>O(1)</strong> connection setup, then O(n) messages with minimal 2-10 byte framing.</p>
          </div>
        </div>

        {/* 11.3 Notification Channels */}
        <DataTable
          caption="Notification System Architecture"
          headers={["Channel", "Technology", "Delivery", "Use Case"]}
          rows={[
            ["In-App", "Database polling + WebSocket", "Real-time", "Scan completions, threat alerts"],
            ["Email", "Resend API + HTML templates", "Async", "Critical threats, weekly digest"],
            ["Push", "Web Push (VAPID)", "Real-time", "Critical alerts on mobile"],
          ]}
        />

        {/* 11.4 Event Flow Diagram */}
        <DiagramFrame title="Real-Time Event Flow">
          <Mermaid chart={`
sequenceDiagram
    participant API
    participant Redis
    participant Worker
    participant WebSocket
    participant Client
    API->>Redis: LPUSH scan_queue {task_id, file_path}
    API->>Client: 202 Accepted {scan_id}
    loop Worker Processing
        Worker->>Redis: BRPOP scan_queue 0
        Redis-->>Worker: {task_id, file_path}
        Worker->>Worker: Step 1: Metadata Extraction
        Worker->>Redis: PUBLISH progress {step: 1, pct: 10}
        Redis-->>WebSocket: {step: 1, pct: 10}
        WebSocket-->>Client: Real-time progress update
        Worker->>Worker: Step 2-8: Analysis Pipeline
        Worker->>Redis: PUBLISH progress {step: 8, pct: 90}
        Redis-->>WebSocket: {step: 8, pct: 90}
        WebSocket-->>Client: Real-time progress update
        Worker->>Worker: Step 9: Calculate Score
        Worker->>Redis: PUBLISH completed {scan_id, score: 85}
        Redis-->>WebSocket: Scan Complete
        WebSocket-->>Client: Show results
    end
          `} />
        </DiagramFrame>
      </DocSection>
    </>
  );
};
