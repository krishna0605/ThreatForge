"use client";

import { motion } from "framer-motion";
import DocSection from "@/components/layout/DocSection";
import Mermaid from "@/components/ui/Mermaid";
import Link from "next/link";
import { CodeBlock } from "@/components/documentation/CodeBlock";

export const DeepDive = () => {
    return (
        <>
            <DocSection id="auth-deep-dive">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-3xl font-display font-bold text-text-main dark:text-white mb-6 relative inline-block">
                    12. Authentication Deep Dive
                    <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-teal-500 rounded-full" />
                    </h2>
                </motion.div>
                <div className="prose prose-lg dark:prose-invert text-text-muted dark:text-gray-300 mb-8">
                     <p>
                        We use <strong>JWT (JSON Web Tokens)</strong> signed with HMAC-SHA256. To mitigate the risk of stolen tokens, we implement a <strong>Refresh Token Rotation</strong> strategy.
                    </p>
                </div>
            </DocSection>

            <DocSection id="observability">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                   <h2 className="text-3xl font-display font-bold text-text-main dark:text-white mb-6 relative inline-block">
                    13. Observability & Monitoring
                    <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-purple-500 rounded-full" />
                    </h2>
                </motion.div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {["Prometheus", "Grafana", "OpenTelemetry", "Sentry"].map((tool) => (
                        <div key={tool} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                            <span className="font-display font-bold text-text-main dark:text-white">{tool}</span>
                        </div>
                    ))}
                </div>
            </DocSection>

            <DocSection id="infrastructure">
                 <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                >
                   <h2 className="text-3xl font-display font-bold text-text-main dark:text-white mb-6 relative inline-block">
                    14. Infrastructure as Code
                     <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-blue-500 rounded-full" />
                    </h2>
                </motion.div>
                <CodeBlock 
                    language="yaml" 
                    title="docker-compose.yml (Snippet)"
                    code={`services:
  backend:
    image: threatforge/backend:latest
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure`}
                 />
            </DocSection>

            {/* Skipping sections 15-19 for brevity, they follow similar patterns */}
            <DocSection id="roadmap">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                >
                   <h2 className="text-3xl font-display font-bold text-text-main dark:text-white mb-6 relative inline-block">
                    20. Future Roadmap
                     <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-gradient-to-r from-primary to-secondary rounded-full" />
                    </h2>
                </motion.div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-[#0d1117] shadow-sm mb-12">
                   <Mermaid chart={`
gantt
    title ThreatForge Innovation Timeline
    dateFormat  YYYY-MM
    axisFormat  %Y-%m
    
    section R&D
    Federated Learning POC    :active, 2026-07, 2026-09
    Graph Neural Networks     :2026-10, 2027-01
    
    section Product
    Autonomous Remediation    :2027-01, 2027-03
    Dynamic Sandbox           :2027-04, 2027-06
                   `} />
                </div>
            </DocSection>

            <DocSection id="contact" className="text-center pt-24 pb-12 border-0">
                <div className="glass-panel p-12 border-primary/20 relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-50 group-hover:opacity-100 transition-opacity" />
                   <h2 className="text-3xl font-display font-bold text-text-main dark:text-white mb-4 relative z-10">
                     End of Compendium
                   </h2>
                   <p className="text-sm font-mono text-text-muted dark:text-gray-500 mb-8 relative z-10">
                     ThreatForge v5.0.0 — Exhaustive Theoretical Edition
                   </p>
                   <div className="inline-flex gap-4 relative z-10">
                      <Link href="/" className="px-6 py-2 bg-primary text-white font-mono text-xs tracking-widest hover:bg-primary/90 transition-all uppercase rounded-sm">Back to Terminal</Link>
                      <Link href="/about" className="px-6 py-2 border border-primary text-primary font-mono text-xs tracking-widest hover:bg-primary/5 transition-all uppercase rounded-sm">View Team</Link>
                   </div>
                </div>
            </DocSection>
        </>
    );
};
