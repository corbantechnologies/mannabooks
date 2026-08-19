// src/app/industries/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/PublicNavbar";

export const metadata: Metadata = {
  title: "Industries & Solutions | Manna Books — Built for Kenyan SMEs",
  description:
    "Discover how Manna Books serves retail counters, hardware stores, professional agencies, logistics distributors, and statutory payroll compliance for Kenyan businesses.",
  keywords: [
    "KRA eTIMS solutions Kenya",
    "retail POS system Kenya",
    "accounting software for hardware stores Kenya",
    "payroll compliance SHIF PAYE NSSF",
    "distribution stock tracker Kenya",
  ],
  openGraph: {
    title: "Industries & Solutions | Manna Books — Invoicing, Payroll & POS",
    description: "Tailored financial operations and statutory compliance software for retail counters, professional services, distributors, and Kenyan SMEs.",
    url: "https://mannabooks.co.ke/industries",
    siteName: "Manna Books",
    locale: "en_KE",
    type: "website",
  },
  alternates: {
    canonical: "https://mannabooks.co.ke/industries",
  },
};

const industries = [
  {
    icon: "🏪",
    tag: "RETAIL & WHOLESALE",
    title: "Retail Counters, Supermarkets & Hardware Stores",
    description:
      "Engineered for fast-paced walk-in environments that need rapid POS terminals, product catalog lookups, and immediate stock reconciliation without creating customer profiles.",
    bulletPoints: [
      "Walk-in POS terminal with cash change calculation & M-Pesa ref logger.",
      "Low-stock alert thresholds to prevent out-of-stock order disruptions.",
      "Real-time stock deduction upon completion of receipts or POS sales.",
      "Product catalog supporting SKU barcodes, selling price, and cost price."
    ],
    highlight: false,
  },
  {
    icon: "💼",
    tag: "PROFESSIONAL SERVICES",
    title: "Agencies, Consultants, Freelancers & Lawyers",
    description:
      "Designed for service-based businesses billing local or international clients with retainer contracts, custom currency preferences, and frictionless portal review links.",
    bulletPoints: [
      "Passwordless client portals with cryptographically secure 64-character token links.",
      "Support for multi-currency invoicing (KES, USD, EUR, GBP) natively.",
      "1-click quotation conversions to invoices, receipts, or credit notes.",
      "Automated retainer billing schedules with client payment notifications."
    ],
    highlight: false,
  },
  {
    icon: "🏭",
    tag: "DISTRIBUTION & LOGISTICS",
    title: "Wholesale Distributors & Multi-Warehouse Supply Chains",
    description:
      "Perfect for organizations managing inventory across multiple storage locations, moving stock via transit pipelines, and issuing formal procurement documents.",
    bulletPoints: [
      "Multi-location warehousing to isolate stock on-hand per branch or depot.",
      "Two-step stock transfers with DISPATCH (Transit status) and RECEIVE (Partial support).",
      "Procurement document flow including Purchase Orders, LPOs, and GRNs.",
      "Weighted average cost valuation & ABC Pareto revenue-tier categorization."
    ],
    highlight: true,
  },
  {
    icon: "🇰🇪",
    tag: "STATUTORY COMPLIANCE",
    title: "Kenyan SMEs with Payroll & Tax Obligations",
    description:
      "Provides end-to-end statutory calculations, monthly VAT aggregates, and progressive payroll runs that align perfectly with KRA iTax rules.",
    bulletPoints: [
      "Gross-to-net payroll compiler covering PAYE progressive, SHIF 2.75%, AHL 1.5%, & NSSF.",
      "Landscape A4 Payroll Voucher PDF output with 11 unbundled ledger columns.",
      "Live 20th KRA VAT return tracker with color-coded deadline countdown alerts.",
      "Fixed asset wear-and-tear registers, Corporate Income Tax, & Turnover Tax (TOT) calculators."
    ],
    highlight: false,
  },
];

export default function IndustriesPage() {
  return (
    <div className="flex-1 flex flex-col bg-white text-black selection:bg-black selection:text-white font-sans min-h-screen">
      <PublicNavbar />

      <main className="flex-1 flex flex-col">
        
        {/* HERO SECTION */}
        <section className="relative overflow-hidden border-b border-zinc-200/80 px-6 py-16 md:py-24 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Subtle grid bg */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            aria-hidden="true"
            style={{
              backgroundImage:
                "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="lg:col-span-7 space-y-7 relative z-10 text-center md:text-left">
            <div className="inline-flex items-center gap-2 border border-zinc-300 px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest bg-zinc-50 rounded-full font-semibold text-zinc-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Target Markets &amp; Customer Solutions
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-none uppercase max-w-5xl">
              Built for businesses<br />
              <span className="text-zinc-400">demanding statutory compliance.</span>
            </h1>
            <p className="text-base md:text-lg text-zinc-600 max-w-3xl font-normal leading-relaxed">
              Manna Books is tailored for Kenyan SMEs, counter retail shops, service providers, and distributors who need strict statutory compliance, POS terminals, and auditable financial records.
            </p>
          </div>

          {/* CONSOLE PREVIEW CARD — desktop only */}
          <div className="lg:col-span-5 relative z-10 hidden lg:block">
            <div className="border border-zinc-200/80 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs bg-white text-black">
              {/* Terminal bar */}
              <div className="bg-zinc-950 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <span className="text-zinc-400 text-[10px] font-semibold uppercase tracking-widest">
                  manna console node
                </span>
                <span className="text-[10px] bg-emerald-900/60 text-emerald-400 border border-emerald-700/50 px-2 py-0.5 font-bold uppercase rounded-sm">
                  eTIMS ACTIVE
                </span>
              </div>

              <div className="bg-white p-5 space-y-4 text-left">
                {/* KRA VAT ALERT */}
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase text-amber-700">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
                      KRA 20th VAT Tracker
                    </span>
                    <span>⏰ 15 Days Remaining</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-black">
                    <span>Output VAT (16%):</span>
                    <span>KES 42,800.00</span>
                  </div>
                  <div className="w-full h-1.5 bg-amber-200 rounded-full overflow-hidden">
                    <div className="h-full w-[60%] bg-amber-500 rounded-full" />
                  </div>
                </div>

                {/* STOCK TRANSFER */}
                <div className="bg-indigo-950 text-white p-3 rounded-lg space-y-1.5 border border-indigo-800/40">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                    <span className="text-indigo-400">🔄 STOCK TRANSFER IN-TRANSIT</span>
                    <span className="bg-indigo-500 text-white px-1.5 py-0.5 text-[9px] font-bold rounded-sm">
                      DISPATCHED
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold pt-0.5">
                    <span>TRN-2026-042: MAIN &rarr; WESTLANDS</span>
                    <span className="text-indigo-300">120 units</span>
                  </div>
                  <div className="text-[9px] text-indigo-200">In-transit safety locked · Stock reserved</div>
                </div>

                {/* POS WALK-IN counter */}
                <div className="bg-emerald-950 text-white p-3 rounded-lg space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                    <span className="text-emerald-400">⚡ WALK-IN POS RECEIPT</span>
                    <span className="bg-emerald-500 text-black px-1.5 py-0.5 text-[9px] font-bold rounded-sm">
                      PAID · STOCK DEDUCTED
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold pt-0.5">
                    <span>RCT-2026-041 · M-Pesa QAB71239X</span>
                    <span className="text-emerald-300">KES 14,200.00</span>
                  </div>
                  <div className="text-[9px] text-zinc-400">2 items · Margin: 38.4% · Stock auto-decremented</div>
                </div>

                {/* LOCATIONS LIST */}
                <div className="space-y-2">
                  {[
                    {
                      ref: "LOC-MAIN-STORE",
                      sub: "148 products tracked · Default",
                      amount: "Val: KES 1.2M",
                      badge: "ACTIVE",
                      cls: "bg-emerald-100 text-emerald-900 border border-emerald-300",
                    },
                    {
                      ref: "LOC-WESTLANDS-BRANCH",
                      sub: "94 products tracked",
                      amount: "Val: KES 620K",
                      badge: "ACTIVE",
                      cls: "bg-emerald-100 text-emerald-900 border border-emerald-300",
                    },
                  ].map((loc) => (
                    <div
                      key={loc.ref}
                      className="flex justify-between bg-white p-2.5 border border-zinc-200 items-center rounded-md text-black"
                    >
                      <div>
                        <span className="font-bold block text-xs">{loc.ref}</span>
                        <span className="text-[9px] text-zinc-500">{loc.sub}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold block text-xs">{loc.amount}</span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${loc.cls}`}>
                          {loc.badge}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-zinc-200 pt-3 flex justify-between items-center text-[9px] text-zinc-400">
                  <span>PWA APPLIANCE: STANDALONE</span>
                  <span className="text-emerald-700 font-bold">● LIVE SYSTEM</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INDUSTRIES SECTION */}
        <section className="max-w-7xl mx-auto w-full px-6 py-16 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {industries.map((ind) => (
              <div
                key={ind.title}
                className={`border rounded-2xl p-8 space-y-6 transition-all ${
                  ind.highlight
                    ? "border-black bg-zinc-950 text-white shadow-xl"
                    : "border-zinc-200 bg-white hover:border-zinc-400 hover:shadow-md"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{ind.icon}</span>
                  <span className={`font-mono text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded ${
                    ind.highlight ? "bg-white/10 text-emerald-400" : "bg-zinc-100 text-zinc-500"
                  }`}>
                    {ind.tag}
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold font-sans uppercase tracking-tight">{ind.title}</h2>
                  <p className={`text-xs leading-relaxed font-sans ${ind.highlight ? "text-zinc-400" : "text-zinc-600"}`}>
                    {ind.description}
                  </p>
                </div>

                <div className={`h-px ${ind.highlight ? "bg-white/10" : "bg-zinc-100"}`} />

                <ul className="space-y-3 font-sans text-xs">
                  {ind.bulletPoints.map((bp) => (
                    <li key={bp} className="flex items-start gap-2.5">
                      <svg className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${ind.highlight ? "text-emerald-400" : "text-emerald-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/>
                      </svg>
                      <span className={ind.highlight ? "text-zinc-300" : "text-zinc-600"}>{bp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* WHY MANNA BOOKS BANNER */}
        <section className="bg-zinc-50 border-t border-b border-zinc-200/80 px-6 py-16">
          <div className="max-w-4xl mx-auto space-y-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight font-sans text-black">
              Why Kenyan Small Businesses Choose Manna Books
            </h2>
            <p className="font-sans text-xs text-zinc-600 leading-relaxed max-w-2xl mx-auto">
              SMEs in Kenya face distinct challenges — statutory KRA eTIMS invoices, complex payroll runs, high costs of ERP licenses, and VAT deadlines. Manna Books solves all these in one workspace.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              {[
                { title: "eTIMS & iTax Compliant", body: "Issue billing documents with eTIMS Control Unit numbers, calculate monthly VAT returns, and compute progressive PAYE, SHIF, AHL, and NSSF." },
                { title: "No ERP Complexity", body: "Skip expensive accounting packages. Manna Books provides clean billing, inventory management, cash books, and payroll in a simple user interface." },
                { title: "Zero Password Friction", body: "Your clients view their statements, invoices, and download vector A4 PDFs via secure magic portal links — reducing payment delay friction." }
              ].map((point) => (
                <div key={point.title} className="card-modern p-5 space-y-2 bg-white border border-zinc-200">
                  <h4 className="font-sans font-bold text-xs uppercase tracking-tight text-black">{point.title}</h4>
                  <p className="font-sans text-[11px] text-zinc-500 leading-normal">{point.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="relative bg-zinc-950 text-white py-24 px-6 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative max-w-3xl mx-auto text-center space-y-6">
            <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest font-semibold bg-emerald-950/80 border border-emerald-800/50 px-3.5 py-1 rounded-full inline-block">
              GET STARTED
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight font-sans max-w-xl mx-auto leading-tight">
              One Workspace.<br />
              <span className="text-zinc-400">Total Compliance.</span>
            </h2>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed max-w-md mx-auto">
              Initialize your workspace, declare stock locations, and set up your billing settings in under 3 minutes.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center items-center font-mono text-xs">
              <Link 
                href="/signup" 
                className="w-full sm:w-auto bg-white text-zinc-950 hover:bg-zinc-100 px-8 py-3.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all shadow-md text-center hover:scale-[1.02] active:scale-[0.98]"
              >
                Initialize Workspace &rarr;
              </Link>
              <Link 
                href="/pricing" 
                className="w-full sm:w-auto border border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-500 hover:text-white px-8 py-3.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-all text-center hover:scale-[1.02] active:scale-[0.98]"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200/80 px-6 py-8 flex flex-col sm:flex-row justify-between items-center bg-zinc-50 text-xs text-zinc-500 font-mono gap-4">
        <p>© 2026 Manna Books LTD. All rights reserved. Powered by <Link href="https://corbantechnologies.org/" target="_blank" className="hover:underline text-black font-bold">Corban Technologies LTD</Link></p>
        <div className="flex gap-6">
          <Link href="/terms" className="hover:underline hover:text-black">Terms</Link>
          <Link href="/privacy" className="hover:underline hover:text-black">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}
