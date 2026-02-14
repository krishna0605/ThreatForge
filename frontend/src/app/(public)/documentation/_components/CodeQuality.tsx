"use client";

import { DocSection } from "@/components/layout/DocSection";
import { DataTable } from "@/components/documentation/DataTable";
import { DiagramFrame } from "@/components/documentation/DiagramFrame";
import { FormulaBlock } from "@/components/documentation/FormulaBlock";
import { TimelineRoadmap } from "@/components/documentation/TimelineRoadmap";
import { InfoCallout } from "@/components/documentation/InfoCallout";
import Mermaid from "@/components/ui/Mermaid";

export const CodeQuality = () => {
  return (
    <>
      {/* ── Section 19: Code Quality ──────────── */}
      <DocSection id="code-quality">
        <h2 className="font-display font-bold text-3xl text-text-main dark:text-white mb-2 flex items-center gap-3">
          <span className="material-icons text-blue-500 text-3xl">code</span>
          Code Quality &amp; Design Patterns
        </h2>
        <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mb-8" />

        {/* 19.1 SOLID */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 pl-4 border-l-4 border-blue-500">
          SOLID Principles
        </h3>
        <DataTable
          caption="SOLID Principles Applied"
          headers={["Principle", "Application"]}
          rows={[
            ["S — Single Responsibility", "Each service: FileAnalyzer, YaraEngine, MLClient, ScanOrchestrator"],
            ["O — Open/Closed", "New finding types added without modifying ScanOrchestrator"],
            ["L — Liskov Substitution", "All ML models implement same predict(features) → confidence interface"],
            ["I — Interface Segregation", "API blueprints separate auth, scans, rules, dashboard, security"],
            ["D — Dependency Inversion", "ScanOrchestrator depends on MLClient abstraction, not concrete impl"],
          ]}
        />

        {/* 19.2 Design Patterns */}
        <DataTable
          caption="Design Patterns Used"
          headers={["Pattern", "Where Used", "Purpose"]}
          rows={[
            ["Command", "ScanOrchestrator.run_scan()", "Encapsulates scan request as an object"],
            ["Strategy", "Scan option flags", "Runtime algorithm selection (YARA on/off, ML on/off)"],
            ["Observer", "WebSocket notifications", "Decoupled event notification"],
            ["Factory", "create_app() in Flask", "Application instance creation with config"],
            ["Singleton", "Supabase client, Redis conn", "Shared resource management"],
            ["Builder", "HTML email templates", "Step-by-step email construction"],
            ["Mediator", "ScanOrchestrator", "Coordinates FileAnalyzer, YaraEngine, MLClient"],
            ["Repository", "API route handlers", "Data access abstraction"],
            ["Middleware", "Flask @before_request", "Cross-cutting concerns (auth, security)"],
          ]}
        />

        {/* 19.3 Type Safety */}
        <DataTable
          caption="Type Safety Across Layers"
          headers={["Layer", "Technology", "Coverage"]}
          rows={[
            ["Frontend", "TypeScript 5.x (strict)", "100% of source files"],
            ["Backend API", "Pydantic schemas", "All request/response bodies"],
            ["Backend Logic", "Python type hints + mypy", "Function signatures"],
            ["Database", "CHECK constraints + ENUMs", "Column-level enforcement"],
            ["Validation", "Zod (frontend) / Pydantic (backend)", "Schema-driven validation"],
          ]}
        />

        {/* 19.4 Layered Dependencies Diagram */}
        <DiagramFrame title="Code Architecture — Layered Dependencies">
          <Mermaid chart={`
graph TD
    subgraph Presentation["Presentation Layer"]
        API["Flask Blueprints"]
        WS["SocketIO Handlers"]
    end
    subgraph Business["Business Logic"]
        Scanner["ScanOrchestrator"]
        AuthSvc["AuthService"]
        NotifSvc["NotificationService"]
    end
    subgraph Domain["Domain Layer"]
        FileAnalyzer["FileAnalyzer"]
        YaraEngine["YaraEngine"]
        MLClient["MLClient"]
        ThreatIntel["ThreatIntelService"]
    end
    subgraph Infrastructure["Infrastructure"]
        SupaClient["Supabase Client"]
        Redis["Redis Client"]
        Resend["Resend Email"]
        OTel["OpenTelemetry"]
    end
    API --> Scanner
    API --> AuthSvc
    API --> NotifSvc
    WS --> Scanner
    Scanner --> FileAnalyzer
    Scanner --> YaraEngine
    Scanner --> MLClient
    Scanner --> ThreatIntel
    AuthSvc --> SupaClient
    NotifSvc --> Resend
    Scanner --> SupaClient
    Scanner --> Redis
    AuthSvc --> OTel
    Scanner --> OTel
          `} />
        </DiagramFrame>
      </DocSection>

      {/* ── Section 20: Future Roadmap ──────── */}
      <DocSection id="roadmap">
        <h2 className="font-display font-bold text-3xl text-text-main dark:text-white mb-2 flex items-center gap-3">
          <span className="material-icons text-pink-500 text-3xl">rocket_launch</span>
          Future Roadmap
        </h2>
        <div className="h-1 w-20 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full mb-8" />

        {/* 20.1 Federated Learning */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 pl-4 border-l-4 border-pink-500">
          Phase 1: Federated Learning (Q3 2026)
        </h3>
        <div className="prose prose-lg dark:prose-invert text-text-muted dark:text-gray-300 mb-4">
          <p>
            Future versions will implement <strong>Federated Learning</strong> (McMahan et al., 2017), allowing enterprise clients
            to train models locally on their proprietary data and share only weight updates (gradients), not raw files.
          </p>
        </div>

        <FormulaBlock
          label="FedAvg Algorithm"
          formula="θ_{t+1} = θ_t + Σ_{k=1}^{K} (n_k / n) × Δθ_k"
          description="θ_t = global model parameters at round t. K = clients, n_k = samples at client k. Privacy guaranteed by transmitting only gradients."
        />

        <InfoCallout type="success" title="Differential Privacy Enhancement">
          <p>Gradients protected with DP noise: <code>Δθ_k + N(0, σ²C²I)</code> where C is the clipping norm. Raw threat data never leaves the client&apos;s infrastructure.</p>
        </InfoCallout>

        {/* 20.2 GNN */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-pink-500">
          Phase 2: Graph Neural Networks (Q4 2026)
        </h3>
        <FormulaBlock
          label="GNN Message Passing"
          formula="h_v^{(l+1)} = UPDATE(h_v^{(l)}, AGGREGATE({h_u^{(l)} : u ∈ N(v)}))"
          description="h_v = hidden representation of node v at layer l. N(v) = neighbors in threat graph. Connects findings across scans to identify attack campaigns."
        />

        {/* 20.3 Autonomous Response */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-pink-500">
          Phase 3: Autonomous Response (Q1 2027)
        </h3>
        <InfoCallout type="warning" title="SOAR Integration">
          <ul className="space-y-1 text-sm">
            <li>• Automatic quarantine of high-confidence malware (confidence &gt; 0.95)</li>
            <li>• Automated firewall rule generation for detected C2 IPs</li>
            <li>• Integration with SIEM platforms (Splunk, Elastic Security)</li>
            <li>• Runbook automation triggered by specific finding patterns</li>
          </ul>
        </InfoCallout>

        {/* 20.4 Advanced Detection */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-pink-500">
          Phase 4: Advanced Detection (Q2 2027)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {[
            { icon: "science", title: "Dynamic Analysis Sandbox", desc: "Execute binaries in isolated containers, monitor syscalls via strace/dtrace" },
            { icon: "bolt", title: "YARA-X Integration", desc: "Next-gen YARA engine in Rust for 10× faster scanning" },
            { icon: "shield", title: "Threat Intelligence Platform", desc: "STIX/TAXII feeds from MITRE ATT&CK, AlienVault OTX" },
            { icon: "extension", title: "Browser Extension", desc: "Real-time URL reputation checking with local ML inference" },
          ].map((item, i) => (
            <div key={i} className="glass-panel p-5 border border-pink-500/20 rounded-xl">
              <span className="material-icons text-pink-500 text-sm mb-2 block">{item.icon}</span>
              <h4 className="font-display font-bold text-sm text-text-main dark:text-white mb-1">{item.title}</h4>
              <p className="text-xs text-text-muted dark:text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* 20.5 Federated Learning Diagram */}
        <DiagramFrame title="Federated Learning Architecture">
          <Mermaid chart={`
graph LR
    subgraph Enterprise_A["Enterprise A"]
        DataA["Local Threat Data"]
        ModelA["Local Model"]
        DataA --> ModelA
        ModelA -->|"Compute"| GradA["Gradient ΔθA"]
    end
    subgraph Enterprise_B["Enterprise B"]
        DataB["Local Threat Data"]
        ModelB["Local Model"]
        DataB --> ModelB
        ModelB -->|"Compute"| GradB["Gradient ΔθB"]
    end
    subgraph Central["ThreatForge Central"]
        Aggregator["FedAvg Aggregator"]
        GlobalModel["Global Model θ"]
    end
    GradA -->|Encrypted| Aggregator
    GradB -->|Encrypted| Aggregator
    Aggregator --> GlobalModel
    GlobalModel -->|Updated| ModelA
    GlobalModel -->|Updated| ModelB
          `} />
        </DiagramFrame>

        {/* 20.6 Timeline Roadmap */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-6 mt-10 pl-4 border-l-4 border-pink-500">
          Development Timeline
        </h3>
        <TimelineRoadmap
          phases={[
            { date: "Q3 2026", title: "Federated Learning POC", description: "Privacy-preserving ML with FedAvg algorithm and Differential Privacy.", status: "upcoming" as const, icon: "psychology" },
            { date: "Q4 2026", title: "Graph Neural Networks", description: "Threat correlation engine using message passing framework.", status: "upcoming" as const, icon: "hub" },
            { date: "Q1 2027", title: "Autonomous Response", description: "SOAR integration with automated quarantine and firewall rules.", status: "upcoming" as const, icon: "smart_toy" },
            { date: "Q2 2027", title: "Advanced Detection", description: "Dynamic sandbox, YARA-X, MITRE ATT&CK integration.", status: "upcoming" as const, icon: "biotech" },
          ]}
        />
      </DocSection>
    </>
  );
};
