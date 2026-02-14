"use client";

import { motion } from "framer-motion";
import DocSection from "@/components/layout/DocSection";
import { CodeBlock } from "@/components/documentation/CodeBlock";

export const FrontendConsole = () => {
    return (
        <>
           <DocSection id="frontend-engineering">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-3xl font-display font-bold text-text-main dark:text-white mb-6 relative inline-block">
                    9. Frontend Engineering & UX
                    <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-pink-500 rounded-full" />
                    </h2>
                </motion.div>

                <div className="prose prose-lg dark:prose-invert text-text-muted dark:text-gray-300 mb-8">
                     <p>
                        We utilize <strong>Next.js 14 App Router</strong> for a hybrid rendering strategy: Static Site Generation (SSG) for marketing pages and Client-Side Rendering (CSR) for the interactive dashboard.
                    </p>
                    <div className="my-6 p-4 border-l-4 border-pink-500 bg-pink-50 dark:bg-pink-900/10">
                        <h5 className="font-bold text-pink-700 dark:text-pink-400">Reconciliation Strategy</h5>
                        <p className="text-sm">
                            React&apos;s virtual DOM diffing (O(n) complexity) is optimized via `React.memo` and `useCallback` to prevent wasted renders during high-frequency WebSocket updates.
                        </p>
                    </div>
                </div>
           </DocSection>

           <DocSection id="api-design">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                >
                   <h2 className="text-3xl font-display font-bold text-text-main dark:text-white mb-6 relative inline-block">
                    10. API Design & Contracts
                     <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-cyan-500 rounded-full" />
                    </h2>
                </motion.div>
                
                <div className="prose prose-lg dark:prose-invert text-text-muted dark:text-gray-300 mb-8">
                     <p>
                        Our API follows <strong>RESTful Level 2</strong> maturity (Resource URIs + HTTP Verbs) but stops short of HATEOAS to reduce payload size for mobile clients.
                    </p>
                </div>

                <div className="mb-8">
                    <CodeBlock 
                        language="json" 
                        title="Scan Object Response (Contract)"
                        code={`{
  "id": "uuid-v4",
  "status": "completed | processing | failed",
  "score": 85.5,
  "artifacts": [
    { "type": "PE_HEADER", "hash": "sha256..." }
  ],
  "_links": {
    "self": "/api/v1/scans/{id}",
    "report": "/api/v1/reports/{id}.pdf"
  }
}`}
                    />
                </div>
           </DocSection>

           <DocSection id="real-time">
                 <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-3xl font-display font-bold text-text-main dark:text-white mb-6 relative inline-block">
                    11. Real-Time Event Architecture
                     <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-yellow-400 rounded-full" />
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="prose prose-lg dark:prose-invert text-text-muted dark:text-gray-300">
                        <p>
                            We employ a <strong>Publish-Subscribe</strong> pattern using Redis Streams and WebSockets to deliver sub-second updates to the dashboard without polling.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-4 text-sm">
                            <li><strong>Publisher:</strong> Celery Workers (Python)</li>
                            <li><strong>Broker:</strong> Redis Pub/Sub (`scan_updates` channel)</li>
                            <li><strong>Subscriber:</strong> FastAPI WebSocket Gateway</li>
                        </ul>
                    </div>
                     <div className="p-6 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                        <h5 className="font-mono text-xs uppercase tracking-widest text-yellow-600 dark:text-yellow-400 mb-4">Event Payload</h5>
                         <pre className="font-mono text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
{`{
  "event": "scan.completed",
  "payload": {
    "scan_id": "123...",
    "result": "malicious",
    "timestamp": 1715629...
  }
}`}
                         </pre>
                     </div>
                </div>
           </DocSection>
        </>
    );
};
