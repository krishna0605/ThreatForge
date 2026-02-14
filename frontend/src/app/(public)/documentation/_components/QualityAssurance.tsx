"use client";

import { DocSection } from "@/components/layout/DocSection";
import { DataTable } from "@/components/documentation/DataTable";
import { DiagramFrame } from "@/components/documentation/DiagramFrame";
import Mermaid from "@/components/ui/Mermaid";

export const QualityAssurance = () => {
  return (
    <DocSection id="quality-assurance">
      <h2 className="font-display font-bold text-3xl text-text-main dark:text-white mb-2 flex items-center gap-3">
        <span className="material-icons text-emerald-500 text-3xl">verified</span>
        Quality Assurance &amp; Testing
      </h2>
      <div className="h-1 w-20 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full mb-8" />

      {/* 16.1 Testing Pyramid */}
      <h3 className="font-display font-bold text-xl text-text-main dark:text-white mb-4 pl-4 border-l-4 border-emerald-500">
        Testing Pyramid (Mike Cohn, 2009)
      </h3>
      <DataTable
        caption="Testing Pyramid Levels"
        headers={["Level", "Framework", "Coverage", "Speed", "Scope"]}
        rows={[
          ["Unit Tests (60%)", "Pytest / Jest", "Individual functions", "<1ms each", "Isolated, mocked"],
          ["Integration Tests (30%)", "Pytest + httpx / RTL", "API endpoints, rendering", "<100ms each", "Real HTTP, mocked DB"],
          ["E2E Tests (10%)", "Cypress / Playwright", "Full user workflows", "<10s each", "Real browser, real backend"],
        ]}
      />

      {/* 16.2 Test Coverage */}
      <DataTable
        caption="Test Coverage by Service"
        headers={["Service", "Test Files", "Test Cases", "Line Coverage"]}
        rows={[
          ["Backend (Flask)", "18 files in tests/", "80+ test cases", "~75%"],
          ["ML Service (FastAPI)", "11 files in tests/", "50+ test cases", "~70%"],
          ["Frontend (Next.js)", "6 files in __tests__/", "30+ test cases", "~60%"],
        ]}
      />

      {/* 16.3 Testing Pyramid Diagram */}
      <DiagramFrame title="Testing Pyramid & Quality Metrics">
        <Mermaid chart={`
graph TD
    subgraph Testing_Pyramid["Testing Pyramid"]
        E2E["E2E Tests (10%) — Playwright/Cypress"]
        Integration["Integration Tests (30%) — Pytest + httpx"]
        Unit["Unit Tests (60%) — Pytest + Jest"]
    end
    E2E --> Integration
    Integration --> Unit
    subgraph Metrics["Quality Metrics"]
        Coverage["Line Coverage: ~70% avg"]
        Mutation["Mutation Score: Target 80%"]
        MTTR["MTTR: <15min for P1 bugs"]
    end
        `} />
      </DiagramFrame>
    </DocSection>
  );
};
