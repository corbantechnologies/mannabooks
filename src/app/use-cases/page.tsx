// src/app/use-cases/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/PublicNavbar";
import UseCasesClient from "./UseCasesClient";

export const metadata: Metadata = {
  title: "Real-World Use Cases & Business Scenarios | Manna Books Kenya",
  description:
    "Explore 8 in-depth operational case studies: from zero-stock tech reselling and chemical batch manufacturing to holding company multi-entity governance and cold-chain FEFO pharmaceuticals.",
  keywords: [
    "accounting use cases Kenya",
    "zero stock reselling software",
    "bill of materials accounting Kenya",
    "holding company multi entity ERP Kenya",
    "FEFO expiry management Kenya",
    "retainer timesheets law firm Kenya",
    "retail multi branch stock transfers",
    "KRA eTIMS enterprise workflows",
  ],
  openGraph: {
    title: "Real-World Use Cases & Business Scenarios — Manna Books",
    description:
      "Operational blueprints, supply chain sequences, and exact double-entry ledger impacts for Kenyan and East African businesses.",
    url: "https://mannabooks.co.ke/use-cases",
    siteName: "Manna Books",
    locale: "en_KE",
    type: "website",
  },
  alternates: {
    canonical: "https://mannabooks.co.ke/use-cases",
  },
};

export default function UseCasesPage() {
  return (
    <div className="flex-1 flex flex-col bg-white text-black selection:bg-black selection:text-white font-sans min-h-screen">
      <PublicNavbar />

      <main className="flex-1 flex flex-col">
        {/* ── HERO SECTION ── */}
        <section className="relative overflow-hidden border-b border-zinc-200/80 px-5 sm:px-6 py-14 md:py-22 max-w-7xl mx-auto w-full">
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            aria-hidden="true"
            style={{
              backgroundImage:
                "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />

          <div className="relative z-10 text-center space-y-6 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 border border-zinc-300 px-3 py-1 text-[11px] font-mono uppercase tracking-widest bg-zinc-50 rounded-full font-bold text-zinc-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Operational Blueprint Hub</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight uppercase leading-none text-zinc-950">
              Real-World Scenarios.<br />
              <span className="text-zinc-400">Zero Theoretical Fluff.</span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-2xl mx-auto font-normal">
              Explore step-by-step supply chain sequences, KRA eTIMS invoice generation, and double-entry General Ledger postings for 8 real East African business models.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-zinc-500">
              <span className="flex items-center gap-1.5">
                <strong className="text-black">8</strong> Enterprise Blueprints
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <strong className="text-black">100%</strong> KRA eTIMS Compliant
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <strong className="text-black">KES</strong> Local Currency Accounting
              </span>
            </div>
          </div>
        </section>

        {/* ── INTERACTIVE USE CASES EXPLORER ── */}
        <section className="px-5 sm:px-6 py-16 max-w-7xl mx-auto w-full border-b border-zinc-100">
          <UseCasesClient />
        </section>

        {/* ── BOTTOM CTA ── */}
        <section className="px-5 sm:px-6 py-20 max-w-5xl mx-auto w-full text-center space-y-6">
          <div className="inline-flex items-center gap-2 border border-zinc-300 px-3 py-1 text-[11px] font-mono uppercase tracking-widest bg-zinc-50 rounded-full font-bold text-zinc-700">
            <span>● Deploy in Minutes</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-black max-w-3xl mx-auto">
            Ready to implement one of these workflows in your business?
          </h2>

          <p className="text-sm text-zinc-600 max-w-xl mx-auto">
            Create an active workspace today. Every single module—from BOM assemblies and warehouse bins to multi-entity directory governance—is ready to run.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="bg-black text-white hover:bg-zinc-800 text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-lg font-mono transition-colors shadow-sm w-full sm:w-auto"
            >
              Start Free 14-Day Workspace →
            </Link>
            <Link
              href="/industries"
              className="border border-zinc-300 hover:bg-zinc-50 text-zinc-800 text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-lg font-mono transition-colors w-full sm:w-auto"
            >
              Browse All Industries
            </Link>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-zinc-200 bg-zinc-50 py-10 px-5 sm:px-6 text-xs text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Manna Books Technologies. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/industries" className="hover:text-black">Industries</Link>
            <Link href="/use-cases" className="hover:text-black font-bold text-black">Use Cases</Link>
            <Link href="/features" className="hover:text-black">Features</Link>
            <Link href="/pricing" className="hover:text-black">Pricing</Link>
            <Link href="/privacy" className="hover:text-black">Privacy</Link>
            <Link href="/terms" className="hover:text-black">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
