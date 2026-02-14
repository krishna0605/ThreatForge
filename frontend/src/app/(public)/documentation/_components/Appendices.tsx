"use client";

import { motion } from "framer-motion";
import { DocSection } from "@/components/layout/DocSection";
import { DataTable } from "@/components/documentation/DataTable";
import { AccordionPanel } from "@/components/documentation/AccordionPanel";
import { CodeBlock } from "@/components/documentation/CodeBlock";

export const Appendices = () => {
  return (
    <>
      {/* ── Section 21: Mathematical Glossary ── */}
      <DocSection id="appendices">
        <h2 className="font-display font-bold text-3xl text-text-main dark:text-white mb-2 flex items-center gap-3">
          <span className="material-icons text-gray-400 text-3xl">menu_book</span>
          Appendices
        </h2>
        <div className="h-1 w-20 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full mb-8" />

        {/* 21.1 Information Theory */}
        <AccordionPanel title="Information Theory" badge="4 concepts">
          <DataTable
            caption="Information Theory Glossary"
            headers={["Concept", "Formula", "Use in ThreatForge"]}
            rows={[
              ["Shannon Entropy", "H(X) = −Σ P(xᵢ) log₂ P(xᵢ)", "File randomness detection"],
              ["Conditional Entropy", "H(Y|X) = −Σ P(x,y) log₂ P(y|x)", "Feature dependency analysis"],
              ["Mutual Information", "I(X;Y) = H(X) − H(X|Y)", "Feature selection for ML"],
              ["KL Divergence", "D_KL(P‖Q) = Σ P(x) log(P(x)/Q(x))", "Model comparison"],
            ]}
          />
        </AccordionPanel>

        {/* 21.2 Complexity Theory */}
        <AccordionPanel title="Complexity Theory" badge="5 concepts">
          <DataTable
            caption="Complexity Theory Glossary"
            headers={["Concept", "Definition", "Relevance"]}
            rows={[
              ["Big-O", "f(n) = O(g(n)) iff ∃ C,n₀: ∀n≥n₀, f(n) ≤ C·g(n)", "Upper bound on growth"],
              ["Big-Ω", "f(n) = Ω(g(n)) iff ∃ C,n₀: ∀n≥n₀, f(n) ≥ C·g(n)", "Lower bound on growth"],
              ["Big-Θ", "f(n) = Θ(g(n)) iff f = O(g) ∧ f = Ω(g)", "Tight bound"],
              ["Halting Problem", "No algorithm can decide ∀(program,input) whether program halts", "Limit of malware detection"],
              ["Rice's Theorem", "All non-trivial semantic properties are undecidable", "Impossibility of perfect static analysis"],
            ]}
          />
        </AccordionPanel>

        {/* 21.3 Cryptography */}
        <AccordionPanel title="Cryptography" badge="4 constructions">
          <DataTable
            caption="Cryptographic Constructions"
            headers={["Concept", "Formula", "Use"]}
            rows={[
              ["SHA-256", "H: {0,1}* → {0,1}²⁵⁶", "File hashing, API key hashing"],
              ["HMAC", "HMAC(K,m) = H((K'⊕opad) ‖ H((K'⊕ipad) ‖ m))", "JWT signing"],
              ["Argon2id", "Tag = Argon2id(P, S, t, m, p, K, X)", "Password hashing"],
              ["TOTP", "TOTP(K,T) = Truncate(HMAC-SHA1(K, ⌊T/X⌋)) mod 10^d", "MFA codes"],
            ]}
          />
        </AccordionPanel>

        {/* 21.4 Machine Learning */}
        <AccordionPanel title="Machine Learning" badge="6 concepts">
          <DataTable
            caption="ML Formal Definitions"
            headers={["Concept", "Formula", "Use"]}
            rows={[
              ["Gini Impurity", "G(D) = 1 − Σ pᵢ²", "Decision tree splits"],
              ["Information Gain", "IG(D,A) = H(D) − Σ(|Dᵥ|/|D|)·H(Dᵥ)", "Feature importance"],
              ["F1 Score", "F1 = 2·(P·R)/(P+R)", "Model evaluation"],
              ["AUC-ROC", "Area under TPR(FPR) curve", "Classification quality"],
              ["Bias-Variance", "Error = Bias² + Variance + σ²", "Model selection"],
              ["Jaccard Index", "J(A,B) = |A∩B| / |A∪B|", "Rule set overlap"],
            ]}
          />
        </AccordionPanel>

        {/* 21.5 Distributed Systems */}
        <AccordionPanel title="Distributed Systems" badge="5 theorems">
          <DataTable
            caption="Distributed Systems Theorems"
            headers={["Concept", "Definition", "Application"]}
            rows={[
              ["CAP Theorem", "Choose 2 of {C, A, P}", "Auth = CP, Scanning = AP"],
              ["PACELC", "If P: A or C; Else: L or C", "Extended CAP analysis"],
              ["FLP Impossibility", "Consensus impossible in async + 1 fault", "Motivates timeout approaches"],
              ["Amdahl's Law", "S(N) = 1/((1−P) + P/N)", "Parallelism limit"],
              ["Little's Law", "L = λ × W", "Queue sizing"],
            ]}
          />
        </AccordionPanel>
      </DocSection>

      {/* ── Section 22: Complete API Reference ── */}
      <DocSection id="api-reference">
        <h2 className="font-display font-bold text-3xl text-text-main dark:text-white mb-2 flex items-center gap-3">
          <span className="material-icons text-sky-500 text-3xl">terminal</span>
          Complete API Reference
        </h2>
        <div className="h-1 w-20 bg-gradient-to-r from-sky-500 to-blue-500 rounded-full mb-8" />

        <AccordionPanel title="Authentication Endpoints" badge="/api/auth/" defaultOpen>
          <CodeBlock language="plaintext" title="Auth Routes" code={`POST   /api/auth/signup              # Create new account
POST   /api/auth/login               # Authenticate with email/password
GET    /api/auth/me                   # Get current user profile (JWT)
POST   /api/auth/logout              # Invalidate current session (JWT)
POST   /api/auth/refresh             # Rotate access token (Refresh)
POST   /api/auth/forgot-password     # Send password reset email
POST   /api/auth/mfa/enroll          # Generate TOTP secret + QR (JWT)
POST   /api/auth/mfa/verify          # Confirm MFA enrollment (JWT)
POST   /api/auth/mfa/verify-login    # 2FA login verification (temp_token)
POST   /api/auth/google              # OAuth token exchange
GET    /api/health                    # System health check`} />
        </AccordionPanel>

        <AccordionPanel title="Scanning Endpoints" badge="/api/scans/">
          <CodeBlock language="plaintext" title="Scan Routes" code={`POST   /api/scans                    # Upload & start scan (JWT)
GET    /api/scans                    # List user's scans (JWT)
GET    /api/scans/<id>               # Get scan details + findings (JWT)
DELETE /api/scans/<id>               # Delete scan and findings (JWT)
GET    /api/scans/<id>/findings      # List findings for a scan (JWT)`} />
        </AccordionPanel>

        <AccordionPanel title="YARA Rules Endpoints" badge="/api/rules/">
          <CodeBlock language="plaintext" title="Rule Routes" code={`GET    /api/rules                    # List all rules (JWT)
POST   /api/rules                    # Create custom YARA rule (JWT)
PUT    /api/rules/<id>               # Update YARA rule (JWT)
DELETE /api/rules/<id>               # Delete YARA rule (JWT)
POST   /api/rules/validate           # Validate YARA syntax (JWT)`} />
        </AccordionPanel>

        <AccordionPanel title="Dashboard & Analytics" badge="/api/dashboard/">
          <CodeBlock language="plaintext" title="Dashboard Routes" code={`GET    /api/dashboard/stats          # Aggregate statistics (JWT)
GET    /api/dashboard/recent         # Recent scans (JWT)
GET    /api/dashboard/threats        # Threat breakdown by type (JWT)
GET    /api/dashboard/timeline       # Scan timeline data (JWT)`} />
        </AccordionPanel>

        <AccordionPanel title="Security Management" badge="/api/security/">
          <CodeBlock language="plaintext" title="Security Routes" code={`GET    /api/security/sessions        # List active sessions (JWT)
DELETE /api/security/sessions/<id>   # Revoke a session (JWT)
GET    /api/security/preferences     # Get security prefs (JWT)
PUT    /api/security/preferences     # Update preferences (JWT)
GET    /api/security/audit-logs      # View audit trail (JWT)
GET    /api/security/ip-whitelist    # List whitelisted IPs (JWT)
POST   /api/security/ip-whitelist    # Add IP to whitelist (JWT)
DELETE /api/security/ip-whitelist/<id># Remove IP (JWT)`} />
        </AccordionPanel>

        <AccordionPanel title="API Keys, Notifications, Sharing & ML" badge="4 groups">
          <CodeBlock language="plaintext" title="Additional Endpoints" code={`# API Keys
GET    /api/keys                     # List API keys (JWT)
POST   /api/keys                     # Generate new API key (JWT)
DELETE /api/keys/<id>                # Revoke API key (JWT)

# Notifications
GET    /api/notifications            # List notifications (JWT)
PUT    /api/notifications/<id>/read  # Mark as read (JWT)
PUT    /api/notifications/read-all   # Mark all as read (JWT)

# Sharing & Reports
POST   /api/shared/<scan_id>/share   # Generate share link (JWT)
GET    /api/shared/<token>           # View shared report (no auth)

# ML Service (Internal)
GET    /health                       # ML Service health
POST   /predict/malware             # Malware prediction (API key)
POST   /predict/network             # Network anomaly (API key)
POST   /predict/steganography       # Stego detection (API key)
GET    /metrics                      # Prometheus metrics`} />
        </AccordionPanel>
      </DocSection>

      {/* ── Section 23: Project History ──────── */}
      <DocSection id="project-history">
        <h2 className="font-display font-bold text-3xl text-text-main dark:text-white mb-2 flex items-center gap-3">
          <span className="material-icons text-amber-400 text-3xl">history</span>
          Project History &amp; Challenges
        </h2>
        <div className="h-1 w-20 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full mb-8" />

        {/* 23.1 Data Flow Issues */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 pl-4 border-l-4 border-amber-400">
          Data Flow Discoveries
        </h3>
        <DataTable
          caption="Critical Data Flow Issues Resolved"
          headers={["Issue", "Impact", "Root Cause", "Solution"]}
          rows={[
            ["Frontend queried vulnerabilities, backend wrote to findings", "Empty results", "Schema mismatch", "Adjusted frontend to query findings"],
            ["scans.score always returned 0", "Wrong dashboard metrics", "Score not persisted", "Added _calculate_threat_score() + UPDATE"],
            ["activity_logs table empty", "No activity feed", "Missing trigger", "Created application-level logging"],
            ["Missing completed_at timestamp", "Duration unknown", "Column not in migration", "Added column + UPDATE logic"],
          ]}
        />

        {/* 23.2 MFA Challenges */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-amber-400">
          MFA Integration Challenges
        </h3>
        <div className="space-y-3 mb-8">
          {[
            { iter: "Iteration 1", desc: "Separate flows for email/password and Google OAuth — caused UX inconsistency" },
            { iter: "Iteration 2", desc: "Unified temp_token: both auth methods generate temp_token when MFA pending → consistent flow" },
            { iter: "Iteration 3", desc: "Added Argon2id-hashed backup recovery codes stored as JSONB for account recovery" },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }} transition={{ delay: i * 0.06, duration: 0.35, ease: "easeOut" }}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-primary/10 bg-white dark:bg-black/20">
              <span className="font-mono text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5">{item.iter}</span>
              <p className="text-sm text-text-muted dark:text-gray-400">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* 23.3 ML Evolution */}
        <DataTable
          caption="ML Model Training Evolution"
          headers={["Version", "Approach", "Issue", "Resolution"]}
          rows={[
            ["v1.0", "Heuristic-based scoring", "No actual ML", "Shipped as fallback only"],
            ["v2.0", "Pre-trained model download", "Model not found on HF", "Generated mock data, trained locally"],
            ["v3.0", "scikit-learn with CSV data", "Models not persisted", "Added joblib.dump() in training scripts"],
            ["v4.0", "Production pipeline", "Rate limiting missing", "Added slowapi to FastAPI"],
          ]}
        />

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-primary/10 text-center">
          <p className="font-mono text-xs text-text-muted dark:text-gray-500">
            ThreatForge v5.0.0 — The Definitive Architectural &amp; Theoretical Compendium
          </p>
          <p className="font-mono text-[10px] text-text-muted dark:text-gray-600 mt-1">
            23 Chapters · 20+ Mermaid Diagrams · 40+ Tables
          </p>
          <p className="font-mono text-[10px] text-text-muted dark:text-gray-600 mt-1">
            Theoretical References: Turing (1936), Codd (1970), Shannon (1948), Brewer (2000), Breiman (2001), Fielding (2000), Rice (1953), Kerckhoffs (1883), McMahan (2017)
          </p>
          <p className="font-mono text-[10px] text-primary/40 mt-3">
            © 2026 ThreatForge Engineering Team
          </p>
        </div>
      </DocSection>
    </>
  );
};
