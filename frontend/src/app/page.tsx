

import AdvancedModules from "@/components/landing/AdvancedModules";
import CTA from "@/components/landing/CTA";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import IntegrationEcosystem from "@/components/landing/IntegrationEcosystem";
import OperationalWorkflow from "@/components/landing/OperationalWorkflow";
import StatsSection from "@/components/landing/StatsSection";
import Testimonial from "@/components/landing/Testimonial";
import TrustedBy from "@/components/landing/TrustedBy";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ThreatForge - Next-Gen AI Threat Detection",
  description: "Secure your infrastructure with ThreatForge's AI-powered threat detection. Real-time analysis of malware, steganography, and network anomalies.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-primary selection:text-white">
      {/* ── Grid Background ─── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,143,57,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,143,57,0.07) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,143,57,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,143,57,0.025) 1px, transparent 1px)
          `,
          backgroundSize: "10px 10px",
        }}
      />

      {/* ── Ambient Glow Orbs ─── */}
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-15%] left-[5%] w-[700px] h-[700px] bg-primary/[0.04] rounded-full blur-[160px]" />
        <div className="absolute bottom-[-15%] right-[5%] w-[800px] h-[800px] bg-secondary/[0.03] rounded-full blur-[180px]" />
        <div className="absolute top-[40%] left-[50%] w-[500px] h-[500px] bg-primary/[0.02] rounded-full blur-[200px]" />
      </div>

      {/* ── CRT Scanline ─── */}
      <div className="fixed inset-0 crt-overlay z-50 opacity-20 pointer-events-none" />

      {/* ── Main Content ─── */}
      <div className="max-w-7xl mx-auto px-5 md:px-10 flex flex-col min-h-screen relative z-10">
        <Header />
        <main className="flex-grow">
          <Hero />
          <TrustedBy />
          <OperationalWorkflow />
          <StatsSection />
          <FeaturesGrid />
          <AdvancedModules />
          <IntegrationEcosystem />
          <Testimonial />
          <CTA />
        </main>
        <Footer />
      </div>
    </div>
  );
}
