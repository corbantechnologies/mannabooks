import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/PublicNavbar";

export const metadata: Metadata = {
  title: "Manna Books | KRA eTIMS Invoicing, Payroll & Business Analytics for Kenyan SMEs",
  description:
    "Manna Books is the all-in-one financial platform for Kenyan businesses. Issue KRA eTIMS invoices, run statutory payroll (PAYE, SHIF, AHL, NSSF), manage walk-in POS sales, track COGS margins, and automate your monthly 20th VAT return.",
  keywords: [
    "KRA eTIMS invoicing Kenya",
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
    title: "Manna Books — KRA eTIMS, Payroll & POS for Kenyan SMEs",
    description:
      "Issue multi-rate KRA invoices, automate 20th VAT returns, run statutory payroll, and manage walk-in POS sales. Built from the ground up for Kenyan and African SMEs.",
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
    <div className="flex-1 flex flex-col bg-white text-black selection:bg-black selection:text-white font-sans">

      <PublicNavbar />

      <main className="flex-1 flex flex-col">

        {/* ═══════════════════════════════════════════════════════ */}
        {/* HERO SECTION */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden border-b border-zinc-200/80 px-6 py-20 md:py-28 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
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

          <div className="lg:col-span-7 space-y-7 relative z-10">
            <div className="inline-flex items-center gap-2 border border-zinc-300 px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest bg-zinc-50 rounded-full font-semibold text-zinc-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              Edition 2026.5 — Walk-in POS, Smart Inventory &amp; eTIMS Payroll
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-[1.02] uppercase">
              Financial velocity &amp; statutory compliance<br className="hidden sm:block" />
              <span className="text-zinc-400"> for Kenyan SMEs.</span>
            </h1>

            <p className="text-base md:text-lg text-zinc-600 max-w-xl font-normal leading-relaxed">
              A complete financial operating system for Kenyan businesses. Issue multi-rate KRA eTIMS invoices, run statutory payroll, execute walk-in POS counter sales with instant stock deduction, track COGS margins, and automate your monthly 20th VAT return — all in one workspace.
            </p>

            <div className="pt-1 flex flex-col sm:flex-row gap-4 font-mono text-xs">
              <Link
                href="/signup"
                className="btn-primary-modern text-center px-8 py-3.5 text-xs font-bold uppercase tracking-wider"
              >
                Initialize Your Workspace →
              </Link>
              <Link
                href="/features"
                className="btn-secondary-modern text-center px-8 py-3.5 text-xs font-semibold uppercase tracking-wider"
              >
                Explore All Features
              </Link>
            </div>

            {/* TRUST STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 px-6">
              {[
                { title: "KRA eTIMS Integrated", text: "Built-in tax control mapping for full compliance." },
                { title: "Multi-Currency Billing", text: "Bill clients globally in USD, GBP, or KES natively." },
                { title: "Recurring & Aging", text: "Auto-generate retainers and dispatch overdue reminders." },
                { title: "Walk-in POS & POS Terminal", text: "Rapid checkout with automatic inventory outflow." },
                { title: "Smart Stock & Procurement", text: "Auto-replenish stock directly from paid Purchase Orders." },
                { title: "Bulk Product Import", text: "Provision 15+ items instantly with rapid bulk entry." },
                { title: "Statutory Payroll (PAYE)", text: "Automated KRA PAYE, SHIF, and NSSF deduction engine." },
                { title: "Client Payment Portals", text: "Unguessable public links for secure client settlement." },
              ].map((feat, i) => (
                <div key={i} className="card-modern p-4 text-left">
                  <h4 className="font-bold text-xs uppercase text-black mb-2">{feat.title}</h4>
                  <p className="text-zinc-500 font-sans">{feat.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CONSOLE PREVIEW CARD — desktop only */}
          <div className="lg:col-span-5 relative z-10 hidden lg:block">
            <div className="border border-zinc-200/80 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs bg-white">
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

              <div className="bg-white p-5 space-y-4">
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

                {/* PAYROLL */}
                <div className="border border-zinc-200 p-3 rounded-lg space-y-1.5 bg-zinc-50/50">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase text-zinc-500">
                    <span>Payroll Voucher Run</span>
                    <span className="bg-black text-white px-1.5 py-0.5 text-[9px] font-bold rounded-sm">LOCKED &amp; PAID</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-black">
                    <span>PAY-JULY-2026-9042</span>
                    <span>KES 184,500.00</span>
                  </div>
                  <div className="text-[9px] text-zinc-500">PAYE · SHIF 2.75% · AHL 1.5% · NSSF Tier I &amp; II</div>
                </div>

                {/* DOCUMENT ROWS */}
                <div className="space-y-2">
                  {[
                    {
                      ref: "INV-2026-042",
                      sub: "KRA CU #: CU012345/2026",
                      amount: "KES 310,000.00",
                      badge: "ISSUED",
                      cls: "bg-amber-100 text-amber-900 border border-amber-300",
                    },
                    {
                      ref: "LPO-2026-018",
                      sub: "Supplier: Apex Distributors Ltd",
                      amount: "KES 58,400.00",
                      badge: "DRAFT",
                      cls: "bg-zinc-100 text-zinc-600 border border-zinc-300",
                    },
                  ].map((doc) => (
                    <div
                      key={doc.ref}
                      className="flex justify-between bg-white p-2.5 border border-zinc-200 items-center rounded-md"
                    >
                      <div>
                        <span className="font-bold block text-xs">{doc.ref}</span>
                        <span className="text-[9px] text-zinc-500">{doc.sub}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold block text-xs">{doc.amount}</span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${doc.cls}`}>
                          {doc.badge}
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

        {/* ═══════════════════════════════════════════════════════ */}
        {/* FEATURE MODULE GRID */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section id="features" className="border-b border-zinc-200/80">
          <div className="max-w-7xl mx-auto px-6 py-16 space-y-10">
            <div className="text-center space-y-2">
              <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest font-semibold block">
                Platform Modules
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Everything your business needs — in one platform.
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  tag: "[01] POS Terminal",
                  title: "Walk-in Sales Counter",
                  body: "Rapid point-of-sale terminal for counter sales. Select items, process M-Pesa / Cash / Bank payment — an official PAID receipt generates instantly with automatic stock deduction.",
                  emoji: "⚡",
                },
                {
                  tag: "[02] Payroll Engine",
                  title: "Statutory Payroll",
                  body: "Execute payroll runs with automatic PAYE, SHIF (2.75%), AHL (1.5%), and NSSF Tier I & II calculations. Download official A4 Landscape PDF payroll vouchers.",
                  emoji: "💼",
                },
                {
                  tag: "[03] KRA Tax Engine",
                  title: "20th VAT Tracker",
                  body: "Automate monthly KRA eTIMS VAT return preparation. Aggregates 16% Output VAT, 0% Zero-Rated, and Exempt sales with a live 20th filing deadline countdown.",
                  emoji: "🏛️",
                },
                {
                  tag: "[04] Document Suite",
                  title: "Full Lifecycle Billing",
                  body: "Issue Quotations, Invoices, Receipts, LPOs, POs, GRNs, Credit & Debit Notes. One-click conversions with KRA eTIMS CU number embedding.",
                  emoji: "📄",
                },
                {
                  tag: "[05] Smart Inventory",
                  title: "Stock & COGS Tracking",
                  body: "Track product inventory with automatic stock deductions on sale. Set cost prices to power live gross profit margin and profitability intelligence.",
                  emoji: "📦",
                },
                {
                  tag: "[06] Intelligence",
                  title: "A/R Aging & Analytics",
                  body: "Monitor 6-month revenue streams, 0–90+ day Accounts Receivable risk matrix, COGS vs revenue profitability, and client LTV leaderboards.",
                  emoji: "📊",
                },
                {
                  tag: "[07] PDF Engine",
                  title: "A4 Vector PDFs",
                  body: "Download official, print-ready vector PDFs for Invoices, Receipts, LPOs, and A4 Landscape Statutory Payroll Vouchers with logos and KRA PINs.",
                  emoji: "🖨️",
                },
                {
                  tag: "[08] Portals",
                  title: "Passwordless Client Links",
                  body: "Clients view, download PDFs, and inspect settlements via secure 64-character token links — no accounts or passwords required.",
                  emoji: "🔐",
                },
                {
                  tag: "[09] Bookkeeping",
                  title: "General Ledger & GL",
                  body: "Full double-entry general ledger, customizable Chart of Accounts, opening balance onboarding, closed accounting periods, Trial Balance, Cash Flow, and P&L.",
                  emoji: "⚖️",
                },
                {
                  tag: "[10] Tax Suite",
                  title: "Kenya Income Tax Tracker",
                  body: "Assess CIT, log non-deductible add-backs, generate KRA capital allowances (Fixed Assets wear & tear bands), and track Turnover Tax (TOT) liabilities.",
                  emoji: "📊",
                },
              ].map((f) => (
                <div
                  key={f.tag}
                  className="bg-white border border-zinc-200/80 rounded-xl p-6 space-y-3 hover:border-black hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-2xl" aria-hidden="true">{f.emoji}</span>
                    <span className="font-mono text-[9px] text-zinc-400 font-semibold uppercase">{f.tag}</span>
                  </div>
                  <h3 className="font-bold uppercase tracking-tight text-base text-black font-sans">{f.title}</h3>
                  <p className="text-sm text-zinc-600 leading-relaxed font-sans">{f.body}</p>
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
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest font-semibold block">
                How It Works
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
                  title: "Issue & Sell",
                  body: "Generate eTIMS invoices, run walk-in POS counter sales, create LPOs for suppliers, and run statutory payroll batches.",
                },
                {
                  step: "04",
                  title: "Track & File",
                  body: "Monitor live cash flow, gross profit margins, A/R aging risk, and your auto-calculated KRA 20th monthly VAT return.",
                },
              ].map((s) => (
                <div key={s.step} className="space-y-3">
                  <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center font-bold text-white text-sm">
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
        {/* FINAL CTA */}
        {/* ═══════════════════════════════════════════════════════ */}
        <section className="px-6 py-20 text-center space-y-6 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight text-black font-sans">
            The complete financial operating system for your business.
          </h2>
          <p className="text-base text-zinc-600 font-sans leading-relaxed">
            Unlimited documents, payroll runs, POS sales, and analytics — built for Kenyan compliance from the ground up.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-4 justify-center font-mono text-xs">
            <Link
              href="/signup"
              className="btn-primary-modern text-center px-10 py-4 text-xs font-bold uppercase tracking-wider"
            >
              Initialize Your Workspace →
            </Link>
            <Link
              href="/guide"
              className="btn-secondary-modern text-center px-10 py-4 text-xs font-semibold uppercase tracking-wider"
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
              className="hover:underline text-black font-semibold"
            >
              Corban Technologies LTD
            </Link>
          </p>
          <div className="flex flex-wrap gap-5">
            <Link href="/features" className="hover:underline hover:text-black transition-colors">Features</Link>
            <Link href="/guide" className="hover:underline hover:text-black transition-colors">Operator Guide</Link>
            <Link href="/terms" className="hover:underline hover:text-black transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:underline hover:text-black transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}