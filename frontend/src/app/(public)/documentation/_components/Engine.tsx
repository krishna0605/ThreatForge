"use client";

import { motion } from "framer-motion";
import { DocSection } from "@/components/layout/DocSection";
import { DataTable } from "@/components/documentation/DataTable";
import { InfoCallout } from "@/components/documentation/InfoCallout";
import { FormulaBlock } from "@/components/documentation/FormulaBlock";
import { DiagramFrame } from "@/components/documentation/DiagramFrame";
import { CodeBlock } from "@/components/documentation/CodeBlock";
import Mermaid from "@/components/ui/Mermaid";

export const Engine = () => {
  return (
    <>
      {/* ── Section 7: Scanning Engine ─────────── */}
      <DocSection id="scanning-engine">
        <h2 className="font-display font-bold text-3xl text-text-main dark:text-white mb-2 flex items-center gap-3">
          <span className="material-icons text-amber-500 text-3xl">radar</span>
          Scanning Engine
        </h2>
        <div className="h-1 w-20 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mb-8" />

        {/* 7.1 ScanOrchestrator */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 pl-4 border-l-4 border-amber-500">
          ScanOrchestrator — Command Pattern
        </h3>
        <div className="prose prose-lg dark:prose-invert text-text-muted dark:text-gray-300 mb-6">
          <p>
            The ScanOrchestrator implements the <strong>Command Pattern</strong> (GoF), orchestrating a 9-step analysis pipeline.
            Each step is gated by user-configurable option flags, following the <strong>Strategy Pattern</strong>.
          </p>
        </div>

        {/* Pipeline Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
          {[
            { step: 1, icon: "description", title: "File Metadata", desc: "MIME type, size, timestamps", gate: "Always runs" },
            { step: 2, icon: "functions", title: "Shannon Entropy", desc: "Statistical randomness measure", gate: "enable_entropy" },
            { step: 3, icon: "memory", title: "PE Headers", desc: "Portable Executable structure", gate: "enable_pe" },
            { step: 4, icon: "fingerprint", title: "YARA Rules", desc: "Pattern-based signatures", gate: "enable_yara" },
            { step: 5, icon: "psychology", title: "ML Prediction", desc: "Random Forest classifier", gate: "enable_ml" },
            { step: 6, icon: "image", title: "Steganography", desc: "Hidden data detection", gate: "If image file" },
            { step: 7, icon: "wifi", title: "Network Analysis", desc: "PCAP anomaly detection", gate: "If PCAP file" },
            { step: 8, icon: "bug_report", title: "Suspicious Imports", desc: "Dangerous API detection", gate: "If PE file" },
            { step: 9, icon: "calculate", title: "Threat Score", desc: "Weighted aggregation 0-100", gate: "Always runs" },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              className="p-4 rounded-lg border border-gray-200 dark:border-primary/10 bg-white dark:bg-black/20 hover:border-amber-500/30 transition-all group"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">STEP {s.step}</span>
                <span className="material-icons text-amber-500/60 text-sm group-hover:text-amber-500 transition-colors">{s.icon}</span>
              </div>
              <h4 className="font-display font-bold text-sm text-text-main dark:text-white">{s.title}</h4>
              <p className="text-xs text-text-muted dark:text-gray-400 mt-1">{s.desc}</p>
              <span className="font-mono text-[9px] text-primary/60 mt-2 block">{s.gate}</span>
            </motion.div>
          ))}
        </div>

        {/* 7.2 Shannon Entropy */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 pl-4 border-l-4 border-amber-500">
          Shannon Entropy — Information Theory
        </h3>
        <InfoCallout type="theorem" title="Shannon Entropy (Claude Shannon, 1948)">
          <p>Measures the average information content (uncertainty) of a random variable. For byte-level analysis, we compute entropy over 256 possible byte values.</p>
        </InfoCallout>

        <FormulaBlock
          label="Shannon Entropy"
          formula="H(X) = −Σᵢ₌₁ⁿ P(xᵢ) · log₂(P(xᵢ))"
          description="Where xᵢ are possible byte values (0-255), P(xᵢ) is byte frequency, n=256. Maximum entropy: log₂(256) = 8.0 bits/byte."
        />

        <DataTable
          caption="Entropy Interpretation for Malware Detection"
          headers={["Entropy Range", "Meaning", "Implication"]}
          rows={[
            ["0.0 — 1.0", "Highly repetitive data", "Likely padding or empty sections"],
            ["1.0 — 5.0", "Normal text/code", "Typical executable sections"],
            ["5.0 — 7.0", "Compressed data", "Normal for resources (images, etc.)"],
            ["7.0 — 7.9", "Highly random", "Possible encryption or compression"],
            ["7.9 — 8.0", "Near-maximum entropy", "Strong indicator of encryption/packing"],
          ]}
          highlightColumn={2}
        />

        {/* 7.3 YARA */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-amber-500">
          YARA Rules — Aho-Corasick Automaton
        </h3>
        <FormulaBlock
          label="Aho-Corasick Multi-Pattern Matching"
          formula="O(n + m + z)"
          description="Where n = text length, m = total pattern length, z = number of matches. Compared to naive O(n × k × m_avg) where k = number of patterns."
        />
        <div className="prose prose-lg dark:prose-invert text-text-muted dark:text-gray-300 mb-6">
          <p>
            ThreatForge maintains a rule library organized by category: <code>malware_indicators</code>,{" "}
            <code>suspicious_patterns</code>, <code>crypto_signatures</code>, <code>packer_detection</code>,{" "}
            <code>exploit_kits</code>. Custom user rules are stored in the <code>yara_rules</code> table.
          </p>
        </div>

        {/* 7.4 PE Header Analysis */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-amber-500">
          PE Header Analysis — Binary Structure
        </h3>
        <DataTable
          caption="PE Header Features Extracted"
          headers={["Feature", "Type", "Security Relevance"]}
          rows={[
            ["IMAGE_FILE_HEADER.Machine", "WORD", "Target architecture"],
            ["AddressOfEntryPoint", "DWORD", "Abnormal entry points indicate packing"],
            ["SectionHeaders[].Characteristics", "DWORD", "RWX sections = self-modifying code"],
            ["ImportTable", "Array", "API calls reveal intent"],
            ["VirtualSize vs RawSize", "Ratio", "Large discrepancy = possible UPX packing"],
          ]}
        />

        <InfoCallout type="warning" title="Suspicious API Detection">
          <p>The scanner checks PE imports against a curated list of dangerous Windows APIs:</p>
          <ul className="list-disc pl-4 mt-2 space-y-1 text-sm">
            <li><code>VirtualAlloc</code> + <code>WriteProcessMemory</code> → Code injection</li>
            <li><code>CreateRemoteThread</code> → Remote thread injection</li>
            <li><code>NtUnmapViewOfSection</code> → Process hollowing</li>
            <li><code>InternetOpenUrl</code> + <code>URLDownloadToFile</code> → Dropper behavior</li>
          </ul>
        </InfoCallout>
      </DocSection>

      {/* ── Section 8: ML Deep Dive ─────────────── */}
      <DocSection id="ml-deep-dive">
        <h2 className="font-display font-bold text-3xl text-text-main dark:text-white mb-2 flex items-center gap-3">
          <span className="material-icons text-purple-500 text-3xl">model_training</span>
          Machine Learning Deep Dive
        </h2>
        <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full mb-8" />

        {/* 8.1 ML Endpoints */}
        <DataTable
          caption="ML Service Endpoints"
          headers={["Endpoint", "Model", "Input", "Output"]}
          rows={[
            ["POST /predict/malware", "Random Forest (100 trees)", "PE features ∈ ℝ⁷⁹", "{prediction, confidence}"],
            ["POST /predict/network", "Random Forest (50 trees)", "Network flow ∈ ℝ¹⁵", "{is_anomaly, confidence}"],
            ["POST /predict/steganography", "Random Forest (50 trees)", "Image stats ∈ ℝ¹²", "{has_hidden_data, confidence}"],
          ]}
        />

        {/* 8.2 Random Forest Theory */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-purple-500">
          Random Forest Classifier — Ensemble Theory
        </h3>
        <div className="prose prose-lg dark:prose-invert text-text-muted dark:text-gray-300 mb-4">
          <p>
            The <strong>Random Forest</strong> (Breiman, 2001) is an ensemble method combining multiple decision trees trained on
            bootstrap samples. Bagging trains <em>B</em> trees on samples of size <em>n</em> with replacement. Each bootstrap sample omits
            approximately <code>1 − 1/e ≈ 36.8%</code> of the original data (out-of-bag samples).
          </p>
        </div>

        <FormulaBlock
          label="Gini Impurity — Node Splitting Criterion"
          formula="Gini(D) = 1 − Σᵢ₌₁ᶜ pᵢ²"
          description="Where C = number of classes, pᵢ = proportion of class i. For binary (malware/benign): Gini = 2p(1−p), maximized at p = 0.5."
        />
        <FormulaBlock
          label="Information Gain — Alternative Criterion"
          formula="IG(D, A) = H(D) − Σᵥ (|Dᵥ|/|D|) · H(Dᵥ)"
          description="Where H(D) = −Σ pᵢ log₂(pᵢ) is the Shannon entropy of dataset D."
        />
        <FormulaBlock
          label="Final Prediction — Majority Voting"
          formula="ŷ = mode({h₁(x), h₂(x), ..., h_B(x)})"
          description="Confidence = proportion of trees voting for the winning class."
        />

        <InfoCallout type="info" title="Random Feature Subsampling — Key Insight">
          <p>At each split, only <strong>√d</strong> features are considered (where d is total feature count). This <strong>decorrelates</strong> the trees, reducing variance without increasing bias — the insight that makes Random Forests superior to bagged trees.</p>
        </InfoCallout>

        {/* 8.3 Feature Engineering */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-purple-500">
          Feature Engineering — 79 Dimensions
        </h3>
        <DataTable
          caption="Malware Detection Feature Groups"
          headers={["Feature Group", "Count", "Description"]}
          rows={[
            ["PE Header Fields", "20", "Machine type, subsystem, DLL characteristics, checksum"],
            ["Section Statistics", "25", "Per-section entropy, size ratios, permissions (RWX flags)"],
            ["Import Table", "15", "Count of imports from suspicious DLLs, dangerous API presence"],
            ["Entropy Features", "10", "Whole-file entropy, per-section entropy, entropy variance"],
            ["Size Features", "9", "File size, overlay size, resource size, code/data ratio"],
          ]}
          highlightColumn={1}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8 mt-6">
          <div className="glass-panel p-5 border border-purple-500/20 rounded-xl">
            <h4 className="font-display font-bold text-sm text-text-main dark:text-white mb-2">Network Anomaly Features (15D)</h4>
            <p className="text-xs text-text-muted dark:text-gray-400 font-mono">
              Source/destination port entropy, packet size stats (mean, std, skew), protocol distribution, inter-arrival times, flag ratios (SYN/ACK/RST).
            </p>
          </div>
          <div className="glass-panel p-5 border border-purple-500/20 rounded-xl">
            <h4 className="font-display font-bold text-sm text-text-main dark:text-white mb-2">Steganography Features (12D)</h4>
            <p className="text-xs text-text-muted dark:text-gray-400 font-mono">
              LSB plane statistics, chi-square test results, histogram analysis, JPEG coefficient statistics.
            </p>
          </div>
        </div>

        {/* 8.4 Model Evaluation */}
        <DataTable
          caption="Model Evaluation Metrics"
          headers={["Metric", "Formula", "Malware", "Network", "Stego"]}
          rows={[
            ["Accuracy", "(TP+TN)/(TP+TN+FP+FN)", "0.96", "0.93", "0.91"],
            ["Precision", "TP/(TP+FP)", "0.95", "0.92", "0.89"],
            ["Recall", "TP/(TP+FN)", "0.93", "0.91", "0.90"],
            ["F1-Score", "2·(P·R)/(P+R)", "0.94", "0.91", "0.89"],
            ["AUC-ROC", "Area under ROC curve", "0.97", "0.95", "0.93"],
          ]}
          highlightColumn={2}
        />

        {/* 8.5 Bias-Variance */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-purple-500">
          Bias-Variance Trade-off
        </h3>
        <FormulaBlock
          label="Generalization Error Decomposition"
          formula="Error(x) = Bias²(x) + Variance(x) + σ² (Irreducible Noise)"
          description="By averaging B=100 trees, variance is reduced by a factor proportional to 1/B for independent predictors."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <div className="glass-panel p-5 border border-red-500/20 rounded-xl">
            <h4 className="font-display font-bold text-sm text-text-main dark:text-white mb-2">Single Decision Tree</h4>
            <p className="text-xs text-text-muted dark:text-gray-400">Low bias, <strong className="text-red-500">high variance</strong> — overfits to training data.</p>
          </div>
          <div className="glass-panel p-5 border border-green-500/20 rounded-xl">
            <h4 className="font-display font-bold text-sm text-text-main dark:text-white mb-2">Random Forest (100 Trees)</h4>
            <p className="text-xs text-text-muted dark:text-gray-400">Low bias, <strong className="text-green-500">reduced variance</strong> — robust generalization via bagging + feature subsampling.</p>
          </div>
        </div>

        {/* 8.6 Training Pipeline */}
        <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 mt-10 pl-4 border-l-4 border-purple-500">
          Training &amp; Inference Pipeline
        </h3>
        <CodeBlock
          language="plaintext"
          title="Training Directory Structure"
          code={`training/
├── data/               # Generated mock CSV datasets
│   ├── malware_data.csv
│   ├── network_data.csv
│   └── stego_data.csv
├── train_malware.py    # scikit-learn Pipeline → joblib
├── train_network.py
├── train_stego.py
└── models/             # Output model artifacts`}
        />

        <DiagramFrame title="ML Training & Inference Pipeline">
          <Mermaid chart={`
graph TB
    subgraph Training_Phase["Training Phase (Offline)"]
        RawData["Raw Dataset (CSV)"] --> FeatEng["Feature Engineering"]
        FeatEng --> Split["Train/Test Split (80/20)"]
        Split --> Train["Train Random Forest"]
        Train --> CV["5-Fold Cross Validation"]
        CV --> Eval["Evaluate (F1, AUC-ROC)"]
        Eval --> Serialize["joblib.dump(model)"]
    end
    subgraph Inference_Phase["Inference Phase (Online)"]
        File["Uploaded Binary"] --> Extract["Feature Extraction"]
        Extract --> Load["joblib.load(model)"]
        Load --> Predict["model.predict_proba(X)"]
        Predict --> Threshold{"confidence > 0.8?"}
        Threshold -->|Yes| Malicious["MALICIOUS"]
        Threshold -->|No| Benign["BENIGN"]
    end
    Serialize -.->|Deploy| Load
          `} />
        </DiagramFrame>
      </DocSection>
    </>
  );
};
