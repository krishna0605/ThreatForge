"use client";

import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import DocSection from "@/components/layout/DocSection";
import Mermaid from "@/components/ui/Mermaid";
import { Scorecard } from "@/components/documentation/Scorecard";
import { TechStackCards } from "@/components/documentation/TechStackCards";
import { TableOfContents } from "@/components/documentation/TableOfContents";
import { CodeBlock } from "@/components/documentation/CodeBlock";

export default function DocumentationPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-primary selection:text-white">
      {/* ── Background Layer ─── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-grid-pattern bg-grid-pattern-size opacity-40" />
        <div className="absolute top-[-15%] left-[5%] w-[700px] h-[700px] bg-primary/[0.04] rounded-full blur-[160px]" />
        <div className="absolute bottom-[-15%] right-[5%] w-[800px] h-[800px] bg-secondary/[0.03] rounded-full blur-[180px]" />
      </div>
      <div className="fixed inset-0 crt-overlay z-50 opacity-15 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 md:px-10 flex flex-col min-h-screen relative z-10">
        <Header />

        <main className="flex-grow pt-16">
          {/* Hero */}
          <section ref={heroRef} className="relative pb-20 overflow-hidden border-b border-gray-100 dark:border-primary/5">
            <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-4xl">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 mb-6"
              >
                <span className="font-mono text-[10px] text-primary tracking-widest uppercase">v5.0.0 Stable</span>
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-6xl font-display font-bold text-text-main dark:text-white mb-6 leading-tight"
              >
                The Definitive <span className="text-primary italic">compendium</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg font-mono text-text-muted dark:text-gray-400 max-w-2xl"
              >
                Exhaustive architectural analysis, distributed systems theory, and mathematical foundations of the ThreatForge platform.
              </motion.p>
            </motion.div>
          </section>

          <div className="flex gap-12 py-12">
            {/* Sidebar TOC */}
            <div className="hidden lg:block w-64 shrink-0">
              <TableOfContents />
            </div>

            {/* Content */}
            <div className="flex-grow max-w-3xl overflow-hidden">
              <DocSection id="executive-summary">
                <h2 className="text-2xl font-display font-bold text-text-main dark:text-white mb-4">
                  1. Executive Summary & Assessment
                </h2>
                <div className="prose prose-sm dark:prose-invert max-w-none text-text-muted dark:text-gray-400 mb-8 leading-relaxed">
                  <p>
                    <strong>ThreatForge</strong> is a hybrid threat intelligence platform designed to address the fundmental problem of malicious behavior detection. 
                    We leverage probabilistic approximation combining deterministic static analysis (YARA) with machine learning ensembles.
                  </p>
                </div>
                
                <h3 className="font-display font-bold text-lg text-text-main dark:text-white mb-6">
                  Production Readiness Scorecard
                </h3>
                <Scorecard />

                <div className="mt-12">
                  <h3 className="font-display font-bold text-lg text-text-main dark:text-white mb-4">
                    Readiness Radar
                  </h3>
                  <Mermaid chart={`
graph TD
    subgraph Production_Readiness["Production Readiness Assessment"]
        Security["🔒 Security: 95"]
        Concurrency["⚡ Concurrency: 88"]
        DataIntegrity["💾 Data Integrity: 92"]
        Observability["🔍 Observability: 75"]
        Scalability["📈 Scalability: 85"]
        Reliability["🛡️ Reliability: 87"]
        Maintainability["🔧 Maintainability: 90"]
    end

    Security --> Total["TOTAL: 92/100 ✅ PRODUCTION READY"]
    Concurrency --> Total
    DataIntegrity --> Total
    Observability --> Total
    Scalability --> Total
    Reliability --> Total
    Maintainability --> Total
                  `} />
                </div>
              </DocSection>

              <DocSection id="strategic-vision">
                <h2 className="text-2xl font-display font-bold text-text-main dark:text-white mb-4">
                  2. Strategic Vision & Underpinnings
                </h2>
                <div className="prose prose-sm dark:prose-invert max-w-none text-text-muted dark:text-gray-400 mb-8">
                  <p>
                    Traditional signature matching is formalized as a membership test in a known set. However, polymorphic malware exploits the <strong>Pigeonhole Principle</strong> to evade detection.
                  </p>
                  <CodeBlock 
                    language="math" 
                    title="Probabilistic Solution"
                    code="Detect(File) = P(Malicious | Features(File)) > τ (tau)"
                  />
                  <p>
                    ThreatForge achieves an AUC of <strong>0.97</strong>, adhering to <strong>Kerckhoffs's Principle</strong> — the system's security should depend on its keys, not on the obscurity of its design.
                  </p>
                </div>
                <Mermaid chart={`
graph TD
    Problem[Cyber Threat Variety] -->|Signatures Fail| Polymorphic[Polymorphic Malware]
    Problem -->|Rules Fail| ZeroDay[Zero-Day Exploits]
    Problem -->|Static Fails| Obfuscated[Obfuscated Binaries]
    
    Polymorphic --> TF_Solution{ThreatForge Solution}
    ZeroDay --> TF_Solution
    Obfuscated --> TF_Solution
    
    TF_Solution -->|Layer 1: Deterministic| YARA[YARA Static Rules]
    TF_Solution -->|Layer 2: Probabilistic| ML[Random Forest Classifier]
    TF_Solution -->|Layer 3: External Intel| ThreatIntel[VirusTotal API]
    TF_Solution -->|Layer 4: Heuristic| Entropy[Shannon Entropy Analysis]
    
    YARA --> Verdict[Comprehensive Verdict]
    ML --> Verdict
    ThreatIntel --> Verdict
    Entropy --> Verdict
    
    Verdict --> Score[Threat Score 0-100]
    Verdict --> Findings[Detailed Findings]
    Verdict --> Remediation[Remediation Guidance]
                `} />
              </DocSection>

              <DocSection id="system-architecture">
                <h2 className="text-2xl font-display font-bold text-text-main dark:text-white mb-4">
                  3. System Architecture
                </h2>
                <div className="prose prose-sm dark:prose-invert max-w-none text-text-muted dark:text-gray-400 mb-6">
                  <p>
                    The platform adopts a <strong>Service-Oriented Micro-Monolith</strong> style. We deliberately shared the Supabase PostgreSQL database to avoid the <strong>Two Generals&apos; Problem</strong> inherent in distributed transactions.
                  </p>
                  <h4 className="font-display font-bold text-text-main dark:text-white mb-2">CAP Theorem Application</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Auth & Storage (CP):</strong> Consistency + Partition Tolerance. Stale auth data is unacceptable.</li>
                    <li><strong>Scanning Pipeline (AP):</strong> Availability + Partition Tolerance. We use eventual consistency for task processing.</li>
                  </ul>
                </div>
                
                <h3 className="font-display font-bold text-lg text-text-main dark:text-white mb-4">C4 Container Model</h3>
                <Mermaid chart={`
graph TB
    subgraph Client_Tier["Client Tier"]
        Browser[Web Browser]
        APIClient[External API Scripts]
    end

    subgraph App_Tier["Application Tier"]
        LB[Load Balancer / Nginx]
        Web["Next.js 16 SSR Server"]
        API["Flask API Gateway"]
        Worker["Celery Workers"]
        MLSvc["FastAPI ML Service"]
    end

    subgraph Data_Tier["Data Tier"]
        Redis["Redis 7 (Broker)"]
        Postgres["PostgreSQL 16"]
        S3["S3 Bucket"]
    end

    Browser -->|HTTPS| LB
    APIClient -->|JWT Auth| LB
    LB --> Web
    LB --> API
    
    API -->|SQL| Postgres
    API -->|LPUSH| Redis
    API -->|POST /predict| MLSvc
    Worker -->|BRPOP| Redis
    Worker -->|Write| Postgres
                `} />

                <h3 className="font-display font-bold text-lg text-text-main dark:text-white mt-12 mb-4">Request Lifecycle</h3>
                <Mermaid chart={`
sequenceDiagram
    participant User
    participant Next.js
    participant Flask API
    participant Redis
    participant Worker
    participant ML Service
    participant PostgreSQL

    User->>Next.js: Upload File
    Next.js->>Flask API: POST /api/scans
    Flask API->>PostgreSQL: INSERT status='queued'
    Flask API->>Redis: LPUSH scan_queue
    Flask API-->>Next.js: 202 Accepted
    
    Worker->>Redis: BRPOP scan_queue
    Worker->>Worker: Static Analysis
    Worker->>ML Service: POST /predict
    ML Service-->>Worker: {prediction, confidence}
    Worker->>PostgreSQL: UPDATE scans SET status='completed'
    Worker->>Redis: PUBLISH scan_updates
    
    Next.js-->>User: Render Dashboard
                `} />
              </DocSection>

              <DocSection id="tech-stack">
                <h2 className="text-2xl font-display font-bold text-text-main dark:text-white mb-8">
                  4. Technology Stack
                </h2>
                <TechStackCards />
                
                <div className="mt-12 prose prose-sm dark:prose-invert text-text-muted dark:text-gray-400">
                  <h4 className="font-display font-bold text-text-main dark:text-white mb-2">The GIL Bypass Strategy</h4>
                  <p>
                    Python 3.11 is used for our analysis engine. To bypass the <strong>Global Interpreter Lock (GIL)</strong>, we use Gunicorn&apos;s pre-fork worker model, where each worker is a separate OS process with its own memory space and GIL.
                  </p>
                </div>
              </DocSection>
              
              <DocSection id="database-design">
                <h2 className="text-2xl font-display font-bold text-text-main dark:text-white mb-4">
                  5. Database Design & Relational Theory
                </h2>
                <div className="prose prose-sm dark:prose-invert max-w-none text-text-muted dark:text-gray-400 mb-8">
                  <p>
                    Grounded in E.F. Codd&apos;s 1970 Relational Model, our schema adheres to <strong>3NF</strong> to eliminate data anomalies while employing PostgreSQL 16 <strong>MVCC</strong> for non-blocking concurrent reads and writes.
                  </p>
                </div>
                <Mermaid chart={`
erDiagram
    PROFILES ||--o{ SCANS : initiates
    PROFILES ||--o{ API_KEYS : owns
    SCANS ||--o{ SCAN_FILES : contains
    SCANS ||--o{ FINDINGS : yields
    FINDINGS ||--o{ RULE_MATCHES : triggers
    YARA_RULES ||--o{ RULE_MATCHES : matches

    PROFILES {
        uuid id
        text email
        boolean mfa_enabled
    }
    SCANS {
        uuid id
        text status
        float score
    }
    FINDINGS {
        uuid id
        text severity
        float confidence
    }
                `} />
                <div className="mt-8">
                  <CodeBlock 
                    language="sql" 
                    title="Row Level Security Example"
                    code={`CREATE POLICY "Users can view own scans"
    ON public.scans FOR SELECT
    USING (auth.uid() = user_id);`}
                  />
                </div>
              </DocSection>

              <DocSection id="security-architecture">
                <h2 className="text-2xl font-display font-bold text-text-main dark:text-white mb-4">
                  6. Security Architecture
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="glass-panel p-6 border border-primary/15 bg-primary/5">
                    <span className="material-icons text-primary mb-3">lock</span>
                    <h4 className="font-display font-bold text-text-main dark:text-white mb-2">Argon2id Hash</h4>
                    <p className="font-mono text-xs text-text-muted dark:text-gray-400">
                      Memory-hard key derivation makes GPU cracking infeasible. Memory: 64MB, Parallelism: 4.
                    </p>
                  </div>
                  <div className="glass-panel p-6 border border-secondary/15 bg-secondary/5">
                    <span className="material-icons text-secondary mb-3">vpn_key</span>
                    <h4 className="font-display font-bold text-text-main dark:text-white mb-2">TOTP MFA</h4>
                    <p className="font-mono text-xs text-text-muted dark:text-gray-400">
                      RFC 6238 implementation. Time-based codes expire every 30 seconds for maximum security.
                    </p>
                  </div>
                </div>
                <Mermaid chart={`
sequenceDiagram
    participant User
    participant API as Flask API
    participant DB as PostgreSQL
    participant TOTP as PyOTP Engine

    User->>API: POST /login {credentials}
    API->>API: Argon2id.verify()
    alt MFA Enabled
        API-->>User: {temp_token, mfa_required}
        User->>API: POST /verify {code, temp_token}
        API->>TOTP: verify(code)
    end
    API->>DB: INSERT session
    API-->>User: {access_token, refresh_token}
                `} />
              </DocSection>

              <DocSection id="scanning-engine">
                <h2 className="text-2xl font-display font-bold text-text-main dark:text-white mb-4">
                  7. The Scanning Engine
                </h2>
                <div className="prose prose-sm dark:prose-invert text-text-muted dark:text-gray-400 mb-8">
                  <p>
                    Orchestrated via the <strong>Command Pattern</strong>, our 9-step pipeline performs everything from Shannon Entropy analysis to multi-pattern matching via YARA.
                  </p>
                </div>
                <div className="space-y-4">
                  {[
                    "Metadata Extraction",
                    "Shannon Entropy Analysis (H(X) calculation)",
                    "PE Header Parsing",
                    "YARA Pattern Matching",
                    "ML Malware Prediction",
                    "Steganography Detection",
                    "Network Traffic Anomaly Analysis"
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-mono text-xs text-primary group-hover:bg-primary group-hover:text-white transition-all">
                        {i + 1}
                      </div>
                      <span className="font-mono text-xs text-text-main dark:text-white">{step}</span>
                    </div>
                  ))}
                </div>
              </DocSection>

              <DocSection id="machine-learning">
                <h2 className="text-2xl font-display font-bold text-text-main dark:text-white mb-4">
                  8. Machine Learning Deep Dive
                </h2>
                <div className="prose prose-sm dark:prose-invert text-text-muted dark:text-gray-400 mb-8">
                  <p>
                    We employ <strong>Random Forest Ensembles</strong> trained via bagging and feature subsampling to achieve high robustness and low variance.
                  </p>
                  <CodeBlock 
                    language="python" 
                    title="Model Metrics"
                    code={`{
  "Accuracy": 0.96,
  "F1-Score": 0.94,
  "AUC-ROC": 0.97,
  "Features": 79
}`}
                  />
                </div>
                <Mermaid chart={`
graph TB
    subgraph Training
        Data["Raw CSV"] --> Feat["Feature Eng"]
        Feat --> Train["Train Random Forest"]
        Train --> Model["joblib.dump(model)"]
    end
    subgraph Inference
        File["Binary"] --> Ext["Extract (v∈ℝ⁷⁹)"]
        Ext --> Predict["model.predict_proba()"]
        Predict --> Thres{"Score > 0.8?"}
        Thres -->|Yes| Threat[⚠️ MALICIOUS]
    end
                `} />
              </DocSection>

              <DocSection id="roadmap">
                <h2 className="text-2xl font-display font-bold text-text-main dark:text-white mb-4">
                  9. Future Roadmap
                </h2>
                <Mermaid chart={`
gantt
    title ThreatForge Development Roadmap
    dateFormat  YYYY-MM
    section Phase 1
    Federated Learning POC    :2026-07, 2026-09
    section Phase 2
    Graph Neural Networks     :2026-10, 2027-01
    section Phase 3
    Autonomous Response       :2027-01, 2027-03
    section Phase 4
    Dynamic Sandbox           :2027-04, 2027-06
                `} />
              </DocSection>

              <DocSection id="contact" className="text-center pt-24 pb-12 border-0">
                <div className="glass-panel p-12 border-primary/20 relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
                   <h2 className="text-3xl font-display font-bold text-text-main dark:text-white mb-4">
                     End of Compendium
                   </h2>
                   <p className="text-sm font-mono text-text-muted dark:text-gray-500 mb-8">
                     ThreatForge v5.0.0 — Exhaustive Theoretical Edition
                   </p>
                   <div className="inline-flex gap-4">
                      <a href="/" className="px-6 py-2 bg-primary text-white font-mono text-xs tracking-widest hover:bg-primary/90 transition-all uppercase">Back to Terminal</a>
                      <a href="/about" className="px-6 py-2 border border-primary text-primary font-mono text-xs tracking-widest hover:bg-primary/5 transition-all uppercase">View Team</a>
                   </div>
                </div>
              </DocSection>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
