"use client";

import { motion } from "framer-motion";
import { DocSection } from "@/components/layout/DocSection";
import { TechStackCards } from "@/components/documentation/TechStackCards";
import { DataTable } from "@/components/documentation/DataTable";
import { InfoCallout } from "@/components/documentation/InfoCallout";
import { FormulaBlock } from "@/components/documentation/FormulaBlock";
import { DiagramFrame } from "@/components/documentation/DiagramFrame";
import { CodeBlock } from "@/components/documentation/CodeBlock";
import Mermaid from "@/components/ui/Mermaid";

export const Architecture = () => {
  return (
    <>
      {/* ── Section 3: System Architecture ─────── */}
      <DocSection id="system-architecture">
        <h2 className="font-display font-bold text-3xl text-text-main dark:text-white mb-2 flex items-center gap-3">
          <span className="material-icons text-primary text-3xl">hub</span>
          System Architecture
        </h2>
        <div className="h-1 w-20 bg-gradient-to-r from-primary to-cyan-500 rounded-full mb-8" />

        {/* 3.1 Architectural Style */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 pl-4 border-l-4 border-cyan-500">
          Service-Oriented Micro-Monolith
        </h3>
        <div className="prose prose-lg dark:prose-invert text-text-muted dark:text-gray-300 mb-6">
          <p>
            We adopt a <strong>Service-Oriented Architecture (SOA)</strong> with a shared database — a deliberate choice that
            avoids the <strong>Two Generals&apos; Problem</strong> inherent in distributed transactions across microservices.
          </p>
        </div>

        <InfoCallout type="theorem" title="The Two Generals' Problem (Akkoyunlu et al., 1975)">
          <p>Two parties communicating over an unreliable channel cannot reach consensus with certainty. By keeping database shared (Supabase PostgreSQL), we eliminate the need for Two-Phase Commit or Saga Pattern.</p>
        </InfoCallout>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            { icon: "check_circle", title: "Monolith Advantage", desc: "Strong consistency via single database transactions, simpler deployment" },
            { icon: "cloud_queue", title: "Microservices Advantage", desc: "Independent scaling, technology diversity" },
            { icon: "star", title: "Our Approach", desc: "Component isolation at code level (Flask blueprints) with transactional consistency at data level" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-4 rounded-lg border border-gray-200 dark:border-primary/10 bg-white dark:bg-black/20 hover:border-primary/30 transition-all"
            >
              <span className="material-icons text-primary mb-2 block">{item.icon}</span>
              <h4 className="font-display font-bold text-sm text-text-main dark:text-white mb-1">{item.title}</h4>
              <p className="text-xs text-text-muted dark:text-gray-400">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* 3.2 CAP Theorem */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 pl-4 border-l-4 border-cyan-500">
          CAP Theorem Application
        </h3>
        <InfoCallout type="warning" title="CAP Theorem (Brewer, 2000; Gilbert & Lynch, 2002)">
          <p>A distributed data store can provide at most two of three guarantees: <strong>Consistency</strong>, <strong>Availability</strong>, <strong>Partition Tolerance</strong>.</p>
        </InfoCallout>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <div className="glass-panel p-5 border border-blue-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-icons text-blue-500">lock</span>
              <h4 className="font-display font-bold text-text-main dark:text-white">Auth &amp; Data (CP)</h4>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-mono text-[9px]">CONSISTENCY + PARTITION</span>
            </div>
            <p className="text-sm text-text-muted dark:text-gray-400">
              SERIALIZABLE isolation for authentication. Stale auth data could lead to replay attacks or privilege escalation. If partition occurs, we reject requests.
            </p>
          </div>
          <div className="glass-panel p-5 border border-green-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-icons text-green-500">speed</span>
              <h4 className="font-display font-bold text-text-main dark:text-white">Scanning (AP)</h4>
              <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-mono text-[9px]">AVAILABILITY + PARTITION</span>
            </div>
            <p className="text-sm text-text-muted dark:text-gray-400">
              Eventual consistency for task processing. HTTP 202 Accepted even if workers are overloaded. Redis provides at-least-once delivery.
            </p>
          </div>
        </div>

        {/* 3.3 PACELC */}
        <InfoCallout type="info" title="PACELC Theorem Extension (Abadi, 2012)">
          <p>During a <strong>P</strong>artition, choose <strong>A</strong>vailability or <strong>C</strong>onsistency; <strong>E</strong>lse, choose <strong>L</strong>atency or <strong>C</strong>onsistency.</p>
          <ul className="list-disc pl-4 mt-2 space-y-1">
            <li><strong>Auth (PC/EC):</strong> Partition → Consistency; Else → Consistency (always strong)</li>
            <li><strong>Scans (PA/EL):</strong> Partition → Availability; Else → Latency (fast async)</li>
          </ul>
        </InfoCallout>

        {/* 3.4 C4 System Context */}
        <DiagramFrame title="C4 Level 1 — System Context">
          <Mermaid chart={`
graph TB
    User[Security Analyst] -->|HTTPS| TF[ThreatForge Platform]
    TF -->|REST API| VT[VirusTotal API]
    TF -->|PostgreSQL| Supabase[Supabase Cloud]
    TF -->|OTLP| Grafana[Grafana Observability]
    Admin[Platform Admin] -->|Dashboard| TF
    CI[CI/CD Pipeline] -->|Deploy| TF
          `} />
        </DiagramFrame>

        {/* 3.5 C4 Container Diagram */}
        <DiagramFrame title="C4 Level 2 — Container Diagram">
          <Mermaid chart={`
graph TB
    subgraph Client_Tier["Client Tier"]
        Browser[Web Browser]
        APIClient[External API Scripts]
    end
    subgraph App_Tier["Application Tier"]
        LB[Load Balancer / Nginx]
        Web["Next.js 16 SSR Server (Port 3000)"]
        API["Flask API Gateway (Port 5000)"]
        Worker["Celery Workers (Process Pool)"]
        MLSvc["FastAPI ML Service (Port 7860)"]
    end
    subgraph Data_Tier["Data Tier"]
        Redis["Redis 7 (Message Broker + Cache)"]
        Postgres["PostgreSQL 16 (Primary Store)"]
        S3["S3-Compatible Storage (File Uploads)"]
    end
    subgraph Observability_Tier["Observability Tier"]
        Prometheus["Prometheus (Metrics TSDB)"]
        Loki["Loki (Log Aggregation)"]
        Tempo["Tempo (Distributed Traces)"]
        GrafanaDash["Grafana (Visualization)"]
    end
    Browser -->|HTTPS TLS 1.3| LB
    APIClient -->|REST/JSON + JWT| LB
    LB -->|Round Robin| Web
    LB -->|Round Robin| API
    API -->|Sync SQL via Supabase Client| Postgres
    API -->|Async Task Push LPUSH| Redis
    API -->|HTTP POST /predict| MLSvc
    Worker -->|Task Pop BRPOP| Redis
    Worker -->|Result Write| Postgres
    Worker -->|File Retrieval| S3
    Web -->|SSR Hydration + API Calls| API
    API -->|/metrics| Prometheus
    MLSvc -->|/metrics| Prometheus
    API -->|Structured JSON Logs| Loki
    MLSvc -->|Structured JSON Logs| Loki
    API -->|OTLP Spans| Tempo
    MLSvc -->|OTLP Spans| Tempo
    Prometheus --> GrafanaDash
    Loki --> GrafanaDash
    Tempo --> GrafanaDash
          `} />
        </DiagramFrame>

        {/* 3.6 Request Lifecycle */}
        <DiagramFrame title="Request Lifecycle — Sequence">
          <Mermaid chart={`
sequenceDiagram
    participant User
    participant Next.js
    participant Flask API
    participant Redis
    participant Worker
    participant ML Service
    participant PostgreSQL
    User->>Next.js: Upload File via Dropzone
    Next.js->>Flask API: POST /api/scans (multipart + JWT)
    Flask API->>Flask API: Validate JWT (HMAC-SHA256)
    Flask API->>PostgreSQL: INSERT INTO scans (status='queued')
    Flask API->>Redis: LPUSH scan_queue {scan_id, file_path}
    Flask API-->>Next.js: 202 Accepted {scan_id}
    Worker->>Redis: BRPOP scan_queue 0 (Blocking Pop)
    Redis-->>Worker: {scan_id, file_path}
    Worker->>Worker: FileAnalyzer.extract_metadata()
    Worker->>Worker: YaraEngine.scan(file_path, rules)
    Worker->>ML Service: POST /predict/malware {features}
    ML Service-->>Worker: {prediction, confidence: 0.93}
    Worker->>PostgreSQL: INSERT INTO findings (...)
    Worker->>PostgreSQL: UPDATE scans SET status='completed'
    Worker->>Redis: PUBLISH scan_updates {scan_id, status: 'done'}
    Next.js->>Flask API: GET /api/scans/{id} (Polling)
    Flask API->>PostgreSQL: SELECT * FROM scans WHERE id=...
    Flask API-->>Next.js: 200 OK {scan results}
    Next.js-->>User: Render Results Dashboard
          `} />
        </DiagramFrame>
      </DocSection>

      {/* ── Section 4: Technology Stack ─────────── */}
      <DocSection id="tech-stack">
        <h2 className="font-display font-bold text-3xl text-text-main dark:text-white mb-2 flex items-center gap-3">
          <span className="material-icons text-secondary text-3xl">layers</span>
          Technology Stack
        </h2>
        <div className="h-1 w-20 bg-gradient-to-r from-secondary to-purple-500 rounded-full mb-8" />

        {/* 4.1 Selection Philosophy */}
        <DataTable
          caption="Technology Selection Decision Matrix"
          headers={["Criterion", "Weight", "Description"]}
          rows={[
            ["Developer Experience", "25%", "How quickly can the team be productive?"],
            ["Community & Ecosystem", "20%", "Is there a large, active community?"],
            ["Long-term Viability", "15%", "Will this technology be supported in 5+ years?"],
            ["Performance", "25%", "Does it meet latency and throughput requirements?"],
            ["Security", "15%", "Does it have a strong security track record?"],
          ]}
          highlightColumn={1}
        />

        {/* 4.2 GIL Deep Dive */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 pl-4 border-l-4 border-purple-500">
          Python 3.11 &amp; The Global Interpreter Lock
        </h3>
        <div className="prose prose-lg dark:prose-invert text-text-muted dark:text-gray-300 mb-4">
          <p>
            Python 3.11 is <strong>25% faster</strong> than 3.10 (PEP 659). The GIL is a mutex that prevents multiple threads
            from executing Python bytecodes simultaneously because CPython&apos;s reference counting is not thread-safe.
          </p>
        </div>

        <FormulaBlock
          label="Thread Safety — Formal Definition"
          formula="Thread Safety = ∀ execution orderings E of concurrent threads T₁...Tₙ: Invariant(SharedState) holds at all observable points in E"
        />

        <InfoCallout type="success" title="ThreatForge's Solution — Process-Based Parallelism">
          <p>We bypass the GIL using Gunicorn&apos;s <strong>pre-fork worker model</strong>. Each worker is a separate OS process with its own Python interpreter and GIL. For I/O-bound tasks, <strong>Gevent</strong> provides cooperative coroutines.</p>
        </InfoCallout>

        {/* 4.3 Flask vs Express */}
        <DataTable
          caption="Backend Framework Comparison"
          headers={["Factor", "Flask 3.x", "Express.js 4.x", "Fastify 5.x"]}
          rows={[
            ["Language", "Python 3.11", "Node.js 20", "Node.js 20"],
            ["Paradigm", "Synchronous WSGI", "Async Event Loop", "Async Event Loop"],
            ["Schema Validation", "Pydantic (external)", "Manual / Joi", "Built-in JSON Schema"],
            ["ML Ecosystem", "Native (scikit-learn)", "Foreign (Python bridge)", "Foreign"],
            ["Decision", "✅ CHOSEN", "❌", "❌"],
          ]}
          highlightColumn={1}
        />

        {/* 4.4 React RSC */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-purple-500">
          Next.js 16 &amp; React Server Components
        </h3>
        <div className="prose prose-lg dark:prose-invert text-text-muted dark:text-gray-300 mb-4">
          <p>
            RSC shifts Virtual DOM Reconciliation from the client to the server. React&apos;s reconciliation operates in <strong>O(n)</strong> using
            two heuristics: different element types produce different trees, and <code>key</code> props identify stable children.
          </p>
          <p>
            Without RSC, the full React runtime (~42KB gzipped) must download before interactivity. With RSC, Server Components send serialized UI (not JS),
            achieving <strong>~40% TTI reduction</strong>. The React 19 Compiler auto-memoizes components, eliminating manual <code>React.memo()</code>.
          </p>
        </div>

        {/* 4.5 Supabase vs Firebase */}
        <DataTable
          caption="Database Platform Comparison"
          headers={["Factor", "Supabase", "Firebase", "Custom Auth"]}
          rows={[
            ["Database Engine", "PostgreSQL (Relational)", "Firestore (NoSQL)", "Any"],
            ["Data Modeling", "Relational (FK, JOINs)", "Document-based", "Varies"],
            ["Access Control", "Row-Level Security (SQL)", "Security Rules (JS)", "Manual"],
            ["Open Source", "✅ Yes", "❌ No", "N/A"],
            ["Self-Hostable", "✅ Yes", "❌ No", "✅ Yes"],
            ["Decision", "✅ CHOSEN", "❌", "❌"],
          ]}
          highlightColumn={1}
        />

        {/* Tech Stack Cards */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-6 mt-10 pl-4 border-l-4 border-purple-500">
          Complete Technology Stack
        </h3>
        <TechStackCards />

        {/* 4.6 Full Stack Diagram */}
        <DiagramFrame title="Technology Stack — Layered Architecture">
          <Mermaid chart={`
graph TD
    Frontend_Layer --> Backend_Layer
    Backend_Layer --> Data_Layer
    Backend_Layer --> ML_Layer
    Backend_Layer --> Infra_Layer
    subgraph Frontend_Layer["Frontend Layer"]
        direction TB
        React["React 19.2.3"]
        Next["Next.js 16.1.6 (App Router)"]
        TW["Tailwind CSS 4"]
        Framer["Framer Motion 12"]
    end
    subgraph Backend_Layer["Backend Layer"]
        direction TB
        Python["Python 3.11"]
        Flask["Flask 3.1.0"]
        FlaskJWT["Flask-JWT-Extended 4.7.1"]
        Gunicorn["Gunicorn 23 + Gevent 24"]
    end
    subgraph ML_Layer["ML Service Layer"]
        direction TB
        FastAPI["FastAPI 0.109"]
        Sklearn["scikit-learn 1.4"]
        Joblib["Joblib 1.3.2"]
    end
    subgraph Data_Layer["Data Layer"]
        direction TB
        Postgres["PostgreSQL 16 (Supabase)"]
        Redis["Redis 7 (Broker/Cache)"]
    end
    subgraph Infra_Layer["Infrastructure Layer"]
        direction TB
        Docker["Docker Multi-Stage Builds"]
        GitHub["GitHub Actions CI/CD"]
        Vercel["Vercel Edge (Frontend)"]
    end
          `} />
        </DiagramFrame>
      </DocSection>

      {/* ── Section 5: Database Design ─────────── */}
      <DocSection id="database-design">
        <h2 className="font-display font-bold text-3xl text-text-main dark:text-white mb-2 flex items-center gap-3">
          <span className="material-icons text-cyan-500 text-3xl">storage</span>
          Database Design
        </h2>
        <div className="h-1 w-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mb-8" />

        {/* 5.1 Relational Foundation */}
        <div className="prose prose-lg dark:prose-invert text-text-muted dark:text-gray-300 mb-6">
          <p>
            Design grounded in <strong>E.F. Codd&apos;s Relational Model</strong> (1970). The database is a collection of relations,
            each a subset of the Cartesian product of attribute domains: <code>R ⊆ D₁ × D₂ × ... × Dₙ</code>.
          </p>
        </div>

        {/* 5.2 ACID */}
        <DataTable
          caption="ACID Properties — Formal Guarantees"
          headers={["Property", "Formal Definition", "Implementation"]}
          rows={[
            ["Atomicity", "∀ tx T: T succeeds completely ∨ T has no effect", "Write-Ahead Log (WAL)"],
            ["Consistency", "∀ tx T: T(valid_state) → valid_state", "CHECK constraints, FK refs"],
            ["Isolation", "Concurrent tx result = serial execution", "MVCC with SSI"],
            ["Durability", "∀ committed tx T: persists across crashes", "WAL + fsync to disk"],
          ]}
        />

        <InfoCallout type="info" title="MVCC (Multi-Version Concurrency Control)">
          <p>Instead of locking rows, PostgreSQL keeps multiple versions of each row. <strong>Reads never block Writes</strong> and <strong>Writes never block Reads</strong>. Conflicts detected at commit time for SERIALIZABLE isolation.</p>
        </InfoCallout>

        {/* 5.3 Normalization */}
        <DataTable
          caption="Normalization Theory"
          headers={["Normal Form", "Rule", "Satisfied?"]}
          rows={[
            ["1NF", "All attributes are atomic (no repeating groups)", "✅ (JSONB for semi-structured only)"],
            ["2NF", "Every non-prime attribute depends on entire candidate key", "✅"],
            ["3NF", "No transitive dependencies: A → B → C eliminated", "✅"],
            ["BCNF", "Every determinant is a candidate key", "✅ (all tables)"],
          ]}
        />

        {/* 5.4 Schema overview */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-blue-500">
          Complete Schema — 14 Tables
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          {[
            { domain: "Identity", tables: "profiles, user_sessions, security_prefs, ip_whitelist", icon: "person" },
            { domain: "Scanning", tables: "scans, scan_files, findings, rule_matches", icon: "search" },
            { domain: "Rules", tables: "yara_rules", icon: "rule" },
            { domain: "Access", tables: "api_keys, audit_logs, activity_logs", icon: "key" },
            { domain: "Communication", tables: "notifications, notification_prefs", icon: "notifications" },
            { domain: "Collaboration", tables: "shared_reports", icon: "share" },
          ].map((d, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }}
              transition={{ delay: i * 0.04, duration: 0.3, ease: "easeOut" }}
              className="p-3 rounded-lg border border-gray-200 dark:border-primary/10 bg-white dark:bg-black/20">
              <span className="material-icons text-primary text-sm mb-1 block">{d.icon}</span>
              <div className="font-display font-bold text-xs text-text-main dark:text-white">{d.domain}</div>
              <div className="font-mono text-[10px] text-text-muted dark:text-gray-500 mt-1">{d.tables}</div>
            </motion.div>
          ))}
        </div>

        {/* 5.5 Indexing */}
        <DataTable
          caption="Indexing Algorithms"
          headers={["Index Type", "Use Case", "Complexity", "Description"]}
          rows={[
            ["B-Tree", "UUID, DateTime, Text", "O(log_m n)", "Self-balancing tree; default for most columns"],
            ["GIN", "JSONB columns", "O(n) build", "Inverted index for containment (@>) and existence (?) queries"],
            ["Hash", "Equality lookups", "O(1) average", "True constant-time for = comparisons; no range queries"],
          ]}
        />

        {/* 5.6 RLS */}
        <FormulaBlock
          label="RLS — Attribute-Based Access Control"
          formula="Allow(user, action, resource) ⟺ PolicyPredicate(user, resource) = TRUE"
          description="ThreatForge implements 25+ RLS policies across all 14 tables, enforcing complete tenant isolation."
        />
        <CodeBlock
          language="sql"
          title="RLS Policy Example"
          code={`CREATE POLICY "Users can view own scans"
    ON public.scans FOR SELECT
    USING (auth.uid() = user_id);

-- Translates to: Allow(u, SELECT, scan) ⟺ scan.user_id = u.id`}
        />

        {/* 5.7 ER Diagram */}
        <DiagramFrame title="Complete Entity Relationship Diagram">
          <Mermaid chart={`
erDiagram
    PROFILES {
        uuid id PK
        text email UK
        text display_name
        boolean mfa_enabled
        text mfa_secret
        text role
        timestamptz created_at
    }
    SCANS {
        uuid id PK
        uuid user_id FK
        text status
        text scan_type
        integer threats_found
        float duration_seconds
        jsonb options
    }
    SCAN_FILES {
        uuid id PK
        uuid scan_id FK
        text filename
        text file_hash_sha256
        float entropy
    }
    FINDINGS {
        uuid id PK
        uuid scan_id FK
        uuid scan_file_id FK
        text finding_type
        text severity
        float confidence
        jsonb details
    }
    YARA_RULES {
        uuid id PK
        uuid user_id FK
        text name
        text category
        text rule_content
    }
    RULE_MATCHES {
        uuid id PK
        uuid finding_id FK
        uuid rule_id FK
        jsonb matched_strings
    }
    API_KEYS {
        uuid id PK
        uuid user_id FK
        text key_hash
        text label
    }
    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        text type
        text channel
        boolean is_read
    }
    SHARED_REPORTS {
        uuid id PK
        uuid scan_id FK
        uuid user_id FK
        text share_token UK
    }
    PROFILES ||--o{ SCANS : initiates
    PROFILES ||--o{ API_KEYS : owns
    PROFILES ||--o{ NOTIFICATIONS : receives
    SCANS ||--o{ SCAN_FILES : contains
    SCANS ||--o{ FINDINGS : yields
    SCANS ||--o{ SHARED_REPORTS : shares
    FINDINGS ||--o{ RULE_MATCHES : triggers
    YARA_RULES ||--o{ RULE_MATCHES : matches
          `} />
        </DiagramFrame>

        {/* 5.8 Data Flow */}
        <DiagramFrame title="Data Flow Through the System">
          <Mermaid chart={`
graph LR
    Upload["File Upload"] --> Validate["Validate (size, MIME)"]
    Validate --> Store["Store in S3"]
    Store --> Queue["Enqueue Scan Task"]
    Queue --> Worker["Worker Picks Up"]
    Worker --> Meta["Extract Metadata"]
    Meta --> Hash["SHA-256 Hash"]
    Hash --> Entropy["Shannon Entropy"]
    Entropy --> PE["PE Header Parse"]
    PE --> YARA["YARA Rule Scan"]
    YARA --> ML["ML Prediction"]
    ML --> Score["Calculate Threat Score"]
    Score --> DB["Write to PostgreSQL"]
    DB --> Notify["Send Notification"]
    Notify --> WS["WebSocket Push"]
          `} />
        </DiagramFrame>
      </DocSection>
    </>
  );
};
