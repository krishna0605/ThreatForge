"use client";

import { motion } from "framer-motion";
import DocSection from "@/components/layout/DocSection";
import Mermaid from "@/components/ui/Mermaid";
import { CodeBlock } from "@/components/documentation/CodeBlock";
import { TechStackCards } from "@/components/documentation/TechStackCards";

export const Architecture = () => {
  return (
    <>
      <DocSection id="system-architecture">
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
        >
             <h2 className="text-3xl font-display font-bold text-text-main dark:text-white mb-6 relative inline-block">
            3. System Architecture
            <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-primary rounded-full" />
            </h2>
        </motion.div>
       
        <div className="prose prose-lg dark:prose-invert max-w-none text-text-muted dark:text-gray-300 mb-6">
          <p>
            The platform adopts a <strong>Service-Oriented Micro-Monolith</strong> style. We deliberately shared the Supabase PostgreSQL database to avoid the <strong>Two Generals&apos; Problem</strong> inherent in distributed transactions.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6">
             <h4 className="font-bold text-blue-700 dark:text-blue-400 mb-2">CAP Theorem Application</h4>
             <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>Auth & Storage (CP):</strong> Consistency + Partition Tolerance. Stale auth data is unacceptable.</li>
                <li><strong>Scanning Pipeline (AP):</strong> Availability + Partition Tolerance. We use eventual consistency for task processing.</li>
             </ul>
          </div>
        </div>
        
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-12">C4 Container Model</h3>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-[#0d1117] shadow-sm">
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
        </div>

        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mt-16 mb-4">Request Lifecycle</h3>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-[#0d1117] shadow-sm">
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
        </div>
      </DocSection>

      <DocSection id="tech-stack">
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
        >
            <h2 className="text-3xl font-display font-bold text-text-main dark:text-white mb-8 relative inline-block">
            4. Technology Stack
            <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-secondary rounded-full" />
            </h2>
        </motion.div>
        
        <TechStackCards />
        
        <div className="mt-12 prose prose-lg dark:prose-invert text-text-muted dark:text-gray-300">
          <h4 className="font-display font-bold text-text-main dark:text-white mb-2">The GIL Bypass Strategy</h4>
          <p>
            Python 3.11 is used for our analysis engine. To bypass the <strong>Global Interpreter Lock (GIL)</strong>, we use Gunicorn&apos;s pre-fork worker model, where each worker is a separate OS process with its own memory space and GIL.
          </p>
        </div>
      </DocSection>
      
      <DocSection id="database-design">
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
        >
             <h2 className="text-3xl font-display font-bold text-text-main dark:text-white mb-6 relative inline-block">
            5. Database Design & Relational Theory
             <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-purple-500 rounded-full" />
            </h2>
        </motion.div>
       
        <div className="prose prose-lg dark:prose-invert max-w-none text-text-muted dark:text-gray-300 mb-8">
          <p>
            Grounded in E.F. Codd&apos;s 1970 Relational Model, our schema adheres to <strong>3NF</strong> to eliminate data anomalies while employing PostgreSQL 16 <strong>MVCC</strong> for non-blocking concurrent reads and writes.
          </p>
        </div>
        
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-[#0d1117] shadow-sm mb-10">
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
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
             <h4 className="font-mono text-xs text-gray-400 mb-4 uppercase tracking-widest">PostgreSQL Policy Definition</h4>
             <CodeBlock 
                language="sql" 
                title="Row Level Security Example"
                code={`CREATE POLICY "Users can view own scans"
    ON public.scans FOR SELECT
    USING (auth.uid() = user_id);`}
              />
        </div>
      </DocSection>
    </>
  );
};
