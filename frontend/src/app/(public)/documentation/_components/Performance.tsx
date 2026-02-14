"use client";

import { DocSection } from "@/components/layout/DocSection";
import { DataTable } from "@/components/documentation/DataTable";
import { FormulaBlock } from "@/components/documentation/FormulaBlock";
import { InfoCallout } from "@/components/documentation/InfoCallout";

export const Performance = () => {
  return (
    <DocSection id="performance">
      <h2 className="font-display font-bold text-3xl text-text-main dark:text-white mb-2 flex items-center gap-3">
        <span className="material-icons text-rose-500 text-3xl">speed</span>
        Performance Optimization
      </h2>
      <div className="h-1 w-20 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full mb-8" />

      {/* 18.1 Algorithmic Complexity */}
      <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 pl-4 border-l-4 border-rose-500">
        Algorithmic Complexity Analysis
      </h3>
      <DataTable
        caption="Operation Complexity Breakdown"
        headers={["Operation", "Algorithm", "Time", "Space"]}
        rows={[
          ["JWT Verification", "HMAC-SHA256", "O(n) token length", "O(1)"],
          ["Password Hash", "Argon2id", "O(T × M) configurable", "O(M) = 64MB"],
          ["DB Lookup (UUID)", "B-Tree Index", "O(log n)", "O(n) index"],
          ["YARA Match", "Aho-Corasick", "O(n + m + z)", "O(m × Σ) automaton"],
          ["Shannon Entropy", "Frequency count", "O(n)", "O(256) = O(1)"],
          ["ML Prediction", "Tree traversal × 100", "O(100 × log n)", "O(model_size)"],
          ["File Upload", "Stream to disk", "O(n)", "O(1) streaming"],
          ["Redis Enqueue", "LPUSH", "O(1) amortized", "O(1)"],
          ["Redis Dequeue", "BRPOP", "O(1) + blocking", "O(1)"],
        ]}
      />

      {/* 18.2 Frontend Performance */}
      <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-rose-500">
        Frontend Performance Budget
      </h3>
      <DataTable
        caption="Core Web Vitals Targets"
        headers={["Metric", "Target", "Strategy"]}
        rows={[
          ["LCP (Largest Contentful Paint)", "< 2.5s", "SSR + streaming, image optimization"],
          ["FID (First Input Delay)", "< 100ms", "RSC reduces JS bundle"],
          ["CLS (Cumulative Layout Shift)", "< 0.1", "Reserved dimensions, font-display: swap"],
          ["TTI (Time to Interactive)", "< 3.8s", "Code splitting via dynamic imports"],
          ["TTFB (Time to First Byte)", "< 800ms", "Edge deployment on Vercel"],
        ]}
      />

      {/* 18.3 Database Optimization */}
      <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-rose-500">
        Database Query Optimization
      </h3>
      <InfoCallout type="info" title="Indexing Strategy">
        <ul className="space-y-1 text-sm">
          <li>• <strong>Primary keys:</strong> Automatic B-Tree on all <code>id UUID PK</code> columns</li>
          <li>• <strong>Foreign keys:</strong> Explicit B-Tree on <code>user_id</code>, <code>scan_id</code>, <code>finding_id</code></li>
          <li>• <strong>Search columns:</strong> GIN index on JSONB for containment queries</li>
          <li>• <strong>Unique constraints:</strong> Automatic B-Tree on <code>email</code>, <code>key_prefix</code>, <code>share_token</code></li>
        </ul>
      </InfoCallout>

      <InfoCallout type="success" title="Connection Pooling (PgBouncer)">
        <p>Supabase provides PgBouncer in <strong>transaction mode</strong>, pooling connections to avoid PostgreSQL&apos;s <code>fork()</code> per-connection overhead. Each Flask worker reuses pooled connections.</p>
      </InfoCallout>

      {/* 18.4 Amdahl's Law Applied */}
      <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-rose-500">
        Amdahl&apos;s Law — Scanning Pipeline
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div className="glass-panel p-5 border border-red-500/20 rounded-xl">
          <h4 className="font-display font-bold text-sm text-text-main dark:text-white mb-2">Sequential Steps (15%)</h4>
          <p className="text-xs text-text-muted dark:text-gray-400">File upload, metadata extraction, result aggregation</p>
        </div>
        <div className="glass-panel p-5 border border-green-500/20 rounded-xl">
          <h4 className="font-display font-bold text-sm text-text-main dark:text-white mb-2">Parallel Steps (85%)</h4>
          <p className="text-xs text-text-muted dark:text-gray-400">YARA scanning, ML inference, entropy calculation, PE analysis</p>
        </div>
      </div>

      <FormulaBlock
        label="Amdahl's Law — Speedup with N Workers"
        formula="S(N) = 1 / ((1 − 0.85) + 0.85/N)"
        description="S(4) = 2.76×, S(8) = 3.90×, S(∞) = 6.67× (theoretical maximum)."
      />
    </DocSection>
  );
};
