import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/PublicNavbar";

export const metadata: Metadata = {
  title: "Manna Books | KRA eTIMS Invoicing, Digital Catalogs, Payroll & POS for Kenyan SMEs",
  description:
    "Manna Books is the all-in-one financial platform for Kenyan businesses. Issue KRA eTIMS invoices, share digital product catalogs, run statutory payroll (PAYE, SHIF, AHL, NSSF), manage walk-in POS sales, track COGS margins, and automate your monthly 20th VAT return.",
  keywords: [
    "KRA eTIMS invoicing Kenya",
    "digital product catalog rate cards Kenya",
    "Kenya statutory payroll software",
    "PAYE SHIF NSSF payroll calculator Kenya",
    "SME accounting software Kenya",
    "VAT return tracker Kenya",
    "invoicing software Kenya",
    "Manna Books",
    "mannabooks.co.ke",
    "KRA PIN compliance",
    "business management software Kenya",
  ],
  openGraph: {
    title: "Manna Books — KRA eTIMS, Digital Catalogs, Payroll & POS for Kenyan SMEs",
    description:
      "Issue multi-rate KRA invoices, share digital product catalogs, automate 20th VAT returns, run statutory payroll, and manage walk-in POS sales. Built from the ground up for Kenyan and African SMEs.",
    url: "https://mannabooks.co.ke",
    siteName: "Manna Books",
    locale: "en_KE",
    type: "website",
  },
  alternates: {
    canonical: "https://mannabooks.co.ke",
  },
};

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col bg-white text-black selection:bg-[#064e3b] selection:text-white font-sans">

      <PublicNavbar />

      <main className="flex-1 flex flex-col">

        {/* ═══════════════════════════════════════════════════════ */}
        {/* HERO SECTION */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden border-b border-zinc-200/80 px-6 py-20 md:py-28 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center bg-white">
          {/* Subtle grid background */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            aria-hidden="true"
            style={{
              backgroundImage:
                "linear-gradient(#064e3b 1px, transparent 1px), linear-gradient(90deg, #064e3b 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="lg:col-span-7 space-y-7 relative z-10">
            <div className="inline-flex items-center gap-2 border border-emerald-200 px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-widest bg-emerald-50 rounded-full font-semibold text-[#064e3b]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              Edition 2026.6 — Digital Catalogs, Walk-in POS &amp; Statutory Compliance
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-[1.02] uppercase text-black">
              Financial velocity &amp; statutory compliance<br className="hidden sm:block" />
              <span className="gradient-text-emerald"> for Kenyan SMEs.</span>
            </h1>

            <p className="text-base md:text-lg text-zinc-600 max-w-xl font-normal leading-relaxed">
              A complete financial operating system for Kenyan businesses. Share digital product catalogs, issue multi-rate KRA eTIMS invoices, run statutory payroll, execute walk-in POS sales, track COGS margins, and automate your monthly 20th VAT return — all in one workspace.
            </p>

            <div className="pt-1 flex flex-col sm:flex-row gap-4 font-mono text-xs">
              <Link
                href="/signup"
                className="btn-primary-emerald text-center px-8 py-3.5 text-xs font-bold uppercase tracking-wider"
              >
                Initialize Your Workspace →
              </Link>
              <Link
                href="/features"
                className="btn-secondary-emerald text-center px-8 py-3.5 text-xs font-semibold uppercase tracking-wider"
              >
                Explore All Features
              </Link>
            </div>

            {/* TRUST STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              {[
                { title: "Digital Product Catalog", text: "Curate models & share rate cards on WhatsApp." },
                { title: "KRA eTIMS Integrated", text: "Multi-rate VAT & CU serial control mapping." },
                { title: "Statutory Payroll", text: "PAYE, SHIF 2.75%, AHL 1.5% & NSSF Tier I/II." },
                { title: "Walk-in POS Terminal", text: "Rapid checkout with instant stock deduction." },
                { title: "Smart Multi-Location", text: "Real-time FIFO ledger & branch transfers." },
                { title: "A/R Aging & Analytics", text: "Revenue vs COGS gross margin intelligence." },
                { title: "Double-Entry GL", text: "Standardized accounts, periods & auto-budgets." },
                { title: "Client Portals", text: "Unguessable 64-char token links for PDF download." },
              ].map((feat, i) => (
                <div key={i} className="card-emerald-accent p-4 text-left">
                  <h4 className="font-bold text-xs uppercase text-black mb-1.5">{feat.title}</h4>
                  <p className="text-zinc-500 font-sans text-xs">{feat.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CONSOLE PREVIEW CARD — desktop only */}
          <div className="lg:col-span-5 relative z-10 hidden lg:block">
            <div className="border border-emerald-200/80 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs bg-white">
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
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/80 px-2 py-0.5 font-bold uppercase rounded-sm">
                  eTIMS ACTIVE
                </span>
              </div>

              <div className="bg-white p-5 space-y-4">
                {/* DIGITAL CATALOG SHOWCASE NOTIFICATION */}
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase text-[#064e3b]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                      Digital Catalog &amp; Rate Cards
                    </span>
                    <span className="bg-[#064e3b] text-white px-1.5 py-0.5 text-[9px] rounded-sm">ONLINE</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-black">
                    <span>Curated Selection (7 Models):</span>
                    <span className="text-[#064e3b]">Live Link &amp; PDF</span>
                  </div>
                  <div className="text-[9px] text-zinc-500">1-click WhatsApp rate card • Quote requests auto-issued</div>
                </div>

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

                {/* POS SALE */}
                <div className="bg-zinc-950 text-white p-3 rounded-lg space-y-1.5 border border-zinc-800">
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

                {/* PAYROLL */}
                <div className="border border-emerald-200 p-3 rounded-lg space-y-1.5 bg-emerald-50/40">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase text-[#064e3b]">
                    <span>Statutory Payroll Voucher</span>
                    <span className="bg-[#064e3b] text-white px-1.5 py-0.5 text-[9px] font-bold rounded-sm">LOCKED &amp; PAID</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-black">
                    <span>PAY-JULY-2026-9042</span>
                    <span>KES 184,500.00</span>
                  </div>
                  <div className="text-[9px] text-zinc-500">PAYE · SHIF 2.75% · AHL 1.5% · NSSF Tier I &amp; II</div>
                </div>

                <div className="border-t border-zinc-200 pt-3 flex justify-between items-center text-[9px] text-zinc-400">
                  <span>PWA APPLIANCE: STANDALONE</span>
                  <span className="text-emerald-700 font-bold">● LIVE SYSTEM</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* FEATURE MODULE GRID */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section id="features" className="border-b border-zinc-200/80 bg-white">
          <div className="max-w-7xl mx-auto px-6 py-20 space-y-12">
            <div className="text-center space-y-3">
              <span className="font-mono text-[10px] text-[#064e3b] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest font-semibold inline-block">
                Platform Architecture
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight text-black font-sans">
                Everything your business needs — in one platform.
              </h2>
              <p className="text-sm text-zinc-600 font-sans max-w-2xl mx-auto">
                Engineered from the ground up for Kenyan SMEs, traders, wholesalers, and professional service agencies.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  tag: "MODULE 01",
                  title: "Digital Product Catalog",
                  body: "Curate specific models and share branded digital catalogs or PDF rate cards on WhatsApp. Clients select items and submit instant quote requests directly to your dashboard.",
                  emoji: "🌐",
                },
                {
                  tag: "MODULE 02",
                  title: "Walk-in POS Terminal",
                  body: "Rapid point-of-sale terminal for counter sales. Select items, process M-Pesa / Cash / Card payments — an official PAID receipt generates instantly with automatic stock deduction.",
                  emoji: "⚡",
                },
                {
                  tag: "MODULE 03",
                  title: "Statutory Payroll",
                  body: "Execute payroll runs with automatic PAYE, SHIF (2.75%), AHL (1.5%), and NSSF Tier I & II calculations. Download official A4 Landscape PDF payroll vouchers.",
                  emoji: "💼",
                },
                {
                  tag: "MODULE 04",
                  title: "20th VAT Tracker",
                  body: "Automate monthly KRA eTIMS VAT return preparation. Aggregates 16% Output VAT, 0% Zero-Rated, and Exempt sales with a live 20th filing deadline countdown.",
                  emoji: "🏛️",
                },
                {
                  tag: "MODULE 05",
                  title: "Fiscal Invoicing & eTIMS",
                  body: "Issue Quotations, Invoices, Receipts, LPOs, POs, GRNs, Credit & Debit Notes. Item-level 16% VAT provisioning and KRA eTIMS CU serial embedding.",
                  emoji: "📄",
                },
                {
                  tag: "MODULE 06",
                  title: "Smart Inventory & COGS",
                  body: "Track product inventory with automatic stock deductions on sale. Set cost prices to power live gross profit margin and profitability intelligence.",
                  emoji: "📦",
                },
                {
                  tag: "MODULE 07",
                  title: "A/R Aging & Analytics",
                  body: "Monitor 6-month revenue streams, 0–90+ day Accounts Receivable risk matrix, COGS vs revenue profitability, and client LTV leaderboards.",
                  emoji: "📊",
                },
                {
                  tag: "MODULE 08",
                  title: "General Ledger & GL",
                  body: "Full double-entry general ledger, customizable Chart of Accounts, multi-month operating budgets with 1-click cloning, period locking, and P&L.",
                  emoji: "⚖️",
                },
              ].map((f) => (
                <div
                  key={f.tag}
                  className="card-emerald-accent p-6 space-y-3 group bg-white"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-2xl" aria-hidden="true">{f.emoji}</span>
                    <span className="font-mono text-[9px] text-[#064e3b] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold uppercase">
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="font-bold uppercase tracking-tight text-base text-black font-sans group-hover:text-[#064e3b] transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-xs text-zinc-600 leading-relaxed font-sans">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* HOW IT WORKS STRIP */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="border-b border-zinc-200/80 bg-zinc-950 text-white px-6 py-16">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-2">
              <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest font-semibold block">
                Workflow Process
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight font-sans">
                From setup to compliance in minutes.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-mono text-xs">
              {[
                {
                  step: "01",
                  title: "Initialize Workspace",
                  body: "Create your business workspace, upload your logo, configure your KRA PIN and brand color — operational in under 3 minutes.",
                },
                {
                  step: "02",
                  title: "Register Catalog",
                  body: "Add products and services with selling prices, cost prices (COGS), tax types, and inventory tracking levels.",
                },
                {
                  step: "03",
                  title: "Share & Sell",
                  body: "Share curated rate cards on WhatsApp, generate eTIMS invoices, run POS counter sales, and execute statutory payroll runs.",
                },
                {
                  step: "04",
                  title: "Track & File",
                  body: "Monitor live cash flow, gross profit margins, A/R aging risk, and your auto-calculated KRA 20th monthly VAT return.",
                },
              ].map((s) => (
                <div key={s.step} className="space-y-3">
                  <div className="w-10 h-10 bg-[#064e3b] border border-emerald-400/30 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-md">
                    {s.step}
                  </div>
                  <h3 className="font-bold uppercase text-white text-xs tracking-wide">{s.title}</h3>
                  <p className="text-zinc-400 font-sans text-xs leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* FINAL CTA BANNER */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="px-6 py-20 text-center space-y-6 max-w-3xl mx-auto bg-white">
          <span className="font-mono text-[10px] text-[#064e3b] uppercase tracking-widest font-semibold bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full inline-block">
            GET STARTED TODAY
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight text-black font-sans">
            The complete financial operating system for your business.
          </h2>
          <p className="text-base text-zinc-600 font-sans leading-relaxed">
            Unlimited documents, digital catalogs, payroll runs, POS sales, and analytics — built for Kenyan compliance from the ground up.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-4 justify-center font-mono text-xs">
            <Link
              href="/signup"
              className="btn-primary-emerald text-center px-10 py-4 text-xs font-bold uppercase tracking-wider"
            >
              Initialize Your Workspace →
            </Link>
            <Link
              href="/guide"
              className="btn-secondary-emerald text-center px-10 py-4 text-xs font-semibold uppercase tracking-wider"
            >
              Read the Operator Guide
            </Link>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200/80 px-6 py-8 bg-zinc-50 font-mono text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>
            © 2026 Manna Books LTD. All rights reserved. Powered by{" "}
            <Link
              href="https://corbantechnologies.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-[#064e3b] font-semibold"
            >
              Corban Technologies LTD
            </Link>
          </p>
          <div className="flex flex-wrap gap-5">
            <Link href="/features" className="hover:underline hover:text-[#064e3b] transition-colors">Features</Link>
            <Link href="/pricing" className="hover:underline hover:text-[#064e3b] transition-colors">Pricing</Link>
            <Link href="/guide" className="hover:underline hover:text-[#064e3b] transition-colors">Operator Guide</Link>
            <Link href="/terms" className="hover:underline hover:text-[#064e3b] transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:underline hover:text-[#064e3b] transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}