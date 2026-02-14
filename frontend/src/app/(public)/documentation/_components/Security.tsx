"use client";

import { motion } from "framer-motion";
import DocSection from "@/components/layout/DocSection";
import Mermaid from "@/components/ui/Mermaid";

export const Security = () => {
  return (
    <DocSection id="security-architecture">
      <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
      >
           <h2 className="text-3xl font-display font-bold text-text-main dark:text-white mb-6 relative inline-block">
          6. Security Architecture
           <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-red-500 rounded-full" />
          </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="glass-panel p-6 border border-primary/15 bg-primary/5 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
               <span className="material-icons text-primary text-2xl">lock</span>
               <h4 className="font-display font-bold text-text-main dark:text-white text-lg">Argon2id Hash</h4>
          </div>
          <p className="font-mono text-xs text-text-muted dark:text-gray-400 leading-relaxed">
            Memory-hard key derivation makes GPU cracking infeasible. Configured with 64MB memory cost and parallelism of 4 lanes to resist ASIC attacks.
          </p>
        </div>
        <div className="glass-panel p-6 border border-secondary/15 bg-secondary/5 rounded-xl">
           <div className="flex items-center gap-3 mb-4">
              <span className="material-icons text-secondary text-2xl">vpn_key</span>
              <h4 className="font-display font-bold text-text-main dark:text-white text-lg">TOTP MFA</h4>
           </div>
           <p className="font-mono text-xs text-text-muted dark:text-gray-400 leading-relaxed">
             Time-based One-Time Password algorithm (RFC 6238) integration ensuring 2FA enforcement for all sensitive operations.
           </p>
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-[#0d1117] shadow-sm">
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
      </div>

      <div className="mt-8 p-4 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 rounded-r-md">
         <h4 className="font-bold text-red-700 dark:text-red-400 mb-1">Zero Trust Principle</h4>
         <p className="text-sm text-red-600 dark:text-red-300">
           We assume the network is always hostile. All internal traffic between the Next.js frontend, Flask API, and ML Service is authenticated via mTLS or short-lived interaction tokens.
         </p>
      </div>
    </DocSection>
  );
};
