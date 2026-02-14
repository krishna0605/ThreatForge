"use client";

import { motion } from "framer-motion";
import DocSection from "@/components/layout/DocSection";
import Mermaid from "@/components/ui/Mermaid";
import { CodeBlock } from "@/components/documentation/CodeBlock";

export const Engine = () => {
  return (
    <>
      <DocSection id="scanning-engine">
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
        >
            <h2 className="text-3xl font-display font-bold text-text-main dark:text-white mb-6 relative inline-block">
            7. The Scanning Engine
            <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-orange-500 rounded-full" />
            </h2>
        </motion.div>
        
        <div className="prose prose-lg dark:prose-invert text-text-muted dark:text-gray-300 mb-8">
          <p>
            Orchestrated via the <strong>Command Pattern</strong>, our 9-step pipeline performs everything from Shannon Entropy analysis to multi-pattern matching via YARA.
          </p>
        </div>
        
        <div className="space-y-3 mb-10">
          {[
            "Metadata Extraction",
            "Shannon Entropy Analysis (H(X) calculation)",
            "PE Header Parsing",
            "YARA Pattern Matching",
            "ML Malware Prediction",
            "Steganography Detection",
            "Network Traffic Anomaly Analysis"
          ].map((step, i) => (
            <motion.div 
               key={i} 
               initial={{ opacity: 0, x: -10 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               transition={{ delay: i * 0.1 }}
               className="flex items-center gap-4 group p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-default"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-mono text-xs text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                {i + 1}
              </div>
              <span className="font-mono text-sm text-text-main dark:text-gray-200 group-hover:text-primary transition-colors">{step}</span>
            </motion.div>
          ))}
        </div>
      </DocSection>

      <DocSection id="machine-learning">
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
        >
            <h2 className="text-3xl font-display font-bold text-text-main dark:text-white mb-6 relative inline-block">
            8. Machine Learning Deep Dive
             <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-indigo-500 rounded-full" />
            </h2>
        </motion.div>

        <div className="prose prose-lg dark:prose-invert text-text-muted dark:text-gray-300 mb-8">
          <p>
            We employ <strong>Random Forest Ensembles</strong> trained via bagging and feature subsampling to achieve high robustness and low variance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div>
                 <CodeBlock 
                    language="json" 
                    title="Model Metrics"
                    code={`{
  "Accuracy": 0.96,
  "F1-Score": 0.94,
  "AUC-ROC": 0.97,
  "Features": 79
}`}
                  />
            </div>
            <div className="flex flex-col justify-center space-y-4">
                 <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                     <h5 className="font-bold text-green-800 dark:text-green-400 text-sm uppercase tracking-wide mb-1">Feature Extraction</h5>
                     <p className="text-xs text-green-700 dark:text-green-300">Extracts 79 numerical features from PE headers including section entropy, import/export counts, and resource sizes.</p>
                 </div>
                 <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                     <h5 className="font-bold text-indigo-800 dark:text-indigo-400 text-sm uppercase tracking-wide mb-1">Inference</h5>
                     <p className="text-xs text-indigo-700 dark:text-indigo-300">FastAPI ML Service serves predictions in &lt;50ms using <code>joblib</code> serialized scikit-learn models.</p>
                 </div>
            </div>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-[#0d1117] shadow-sm">
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
        </div>
      </DocSection>
    </>
  );
};
