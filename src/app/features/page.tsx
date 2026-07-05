// src/app/features/page.tsx
import Link from "next/link";

export default function FeaturesPage() {
  return (
    <div className="flex-1 flex flex-col bg-white text-black selection:bg-black selection:text-white font-sans">
      
      {/* GLOBAL NAVIGATION HEADER */}
      <header className="border-b border-zinc-200/80 px-6 py-4 flex justify-between items-center glass-panel sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Manna Books" className="w-7 h-7 object-contain border border-zinc-200 p-0.5 bg-white rounded" />
          <Link href="/" className="font-mono text-xl font-semibold tracking-tight uppercase text-black font-sans">
            Manna Books.
          </Link>
        </div>

        <nav className="flex items-center gap-3 sm:gap-6 font-mono text-xs font-semibold uppercase">
          <Link href="/features" className="underline underline-offset-4 text-black font-bold">
            Features
          </Link>
          <Link href="/guide" className="hover:underline underline-offset-4">
            Guide
          </Link>
          <Link href="/login" className="hover:underline underline-offset-4">
            Login
          </Link>
          <Link href="/signup" className="btn-primary-modern px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs">
            Initialize Workspace
          </Link>
        </nav>
      </header>

      {/* HERO SECTION */}
      <main className="flex-1 flex flex-col">
        <section className="border-b border-zinc-200/80 px-6 py-16 md:py-24 max-w-7xl mx-auto w-full space-y-6">
          <div className="inline-flex items-center gap-2 border border-zinc-300 px-3 py-1 text-[11px] font-mono uppercase tracking-widest bg-zinc-50 rounded font-semibold text-zinc-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Platform Capabilities &amp; Specifications
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-none uppercase max-w-4xl">
            Complete platform feature specifications.
          </h1>
          <p className="text-base md:text-lg text-zinc-600 max-w-3xl font-normal leading-relaxed">
            Manna Books is an end-to-end financial operations &amp; statutory compliance platform engineered for Kenyan and African SMEs. Explore every module, compliance engine, and architectural pillar built into the platform.
          </p>

          <div className="pt-4 flex flex-wrap gap-3 font-mono text-xs">
            <a href="#invoicing" className="btn-secondary-modern px-3 py-1.5 text-xs font-semibold uppercase">
              Invoicing &amp; eTIMS
            </a>
            <a href="#payroll" className="btn-secondary-modern px-3 py-1.5 text-xs font-semibold uppercase">
              Statutory Payroll
            </a>
            <a href="#vat" className="btn-secondary-modern px-3 py-1.5 text-xs font-semibold uppercase">
              20th VAT Tracker
            </a>
            <a href="#pdf-engine" className="btn-secondary-modern px-3 py-1.5 text-xs font-semibold uppercase">
              Landscape Vector PDF
            </a>
            <a href="#portals" className="btn-secondary-modern px-3 py-1.5 text-xs font-semibold uppercase">
              Passwordless Portals
            </a>
            <a href="#analytics" className="btn-secondary-modern px-3 py-1.5 text-xs font-semibold uppercase">
              A/R &amp; Cash Analytics
            </a>
          </div>
        </section>

        {/* DETAILED FEATURE MODULES */}
        <section className="max-w-7xl mx-auto w-full px-6 py-16 space-y-20">

          {/* MODULE 1: INVOICING & ETIMS */}
          <div id="invoicing" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-black text-white px-2 py-1 uppercase">MODULE 01</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Invoicing, Procurement &amp; eTIMS Engine
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
              <div className="card-modern p-6 bg-white space-y-3">
                <span className="text-emerald-700 font-bold uppercase block">&gt; Multi-Rate Tax Billing</span>
                <p className="text-zinc-600 text-xs font-sans leading-relaxed">
                  Support for KRA 16% Standard Output VAT, 0% Zero-Rated export lines, and Tax EXEMPT items on a line-by-line basis.
                </p>
              </div>

              <div className="card-modern p-6 bg-white space-y-3">
                <span className="text-emerald-700 font-bold uppercase block">&gt; KRA CU &amp; PIN Validation</span>
                <p className="text-zinc-600 text-xs font-sans leading-relaxed">
                  Embed official KRA eTIMS Control Unit (CU) numbers and merchant/client KRA PINs on all formal financial documents.
                </p>
              </div>

              <div className="card-modern p-6 bg-white space-y-3">
                <span className="text-emerald-700 font-bold uppercase block">&gt; Full Lifecycle Documents</span>
                <p className="text-zinc-600 text-xs font-sans leading-relaxed">
                  Issue Quotations with 1-click conversion to Invoices, Receipts, Purchase Orders (POs), LPOs, and Goods Received Notes (GRNs).
                </p>
              </div>
            </div>
          </div>

          {/* MODULE 2: STATUTORY PAYROLL & WAGE COMPILER */}
          <div id="payroll" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-black text-white px-2 py-1 uppercase">MODULE 02</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Statutory Payroll &amp; Wage Compiler
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
              <div className="card-modern p-6 bg-white space-y-3">
                <span className="text-emerald-700 font-bold uppercase block">&gt; Kenyan Statutory Tax Bands</span>
                <p className="text-zinc-600 text-xs font-sans leading-relaxed">
                  Automatic progressive PAYE tax computation (10%, 25%, 30%, 32.5%, 35%) with KES 2,400 monthly Personal Relief offsets.
                </p>
              </div>

              <div className="card-modern p-6 bg-white space-y-3">
                <span className="text-emerald-700 font-bold uppercase block">&gt; SHIF, AHL &amp; NSSF Reserves</span>
                <p className="text-zinc-600 text-xs font-sans leading-relaxed">
                  Calculates Social Health Insurance Fund (SHIF 2.75%), Affordable Housing Levy (AHL 1.5%), and NSSF Tier I &amp; II deductions.
                </p>
              </div>

              <div className="card-modern p-6 bg-white space-y-3">
                <span className="text-emerald-700 font-bold uppercase block">&gt; Custom Advances &amp; Draft States</span>
                <p className="text-zinc-600 text-xs font-sans leading-relaxed">
                  Log salary advances, commissions, and custom deductions. Save runs as DRAFT to continue adding staff before finalizing.
                </p>
              </div>
            </div>
          </div>

          {/* MODULE 3: KRA 20TH VAT TRACKER */}
          <div id="vat" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-black text-white px-2 py-1 uppercase">MODULE 03</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Statutory KRA 20th VAT Return Tracker
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
              <div className="card-modern p-6 bg-white space-y-3">
                <span className="text-emerald-700 font-bold uppercase block">&gt; Real-Time Tax Aggregation</span>
                <p className="text-zinc-600 text-xs font-sans leading-relaxed">
                  Automatically calculates 16% Output VAT liability, zero-rated volumes, and tax-exempt sales for the active calendar month.
                </p>
              </div>

              <div className="card-modern p-6 bg-white space-y-3">
                <span className="text-emerald-700 font-bold uppercase block">&gt; Live 20th Filing Countdown</span>
                <p className="text-zinc-600 text-xs font-sans leading-relaxed">
                  Displays a live countdown timer pointing to KRA's monthly 20th VAT filing deadline to prevent late penalty fees.
                </p>
              </div>

              <div className="card-modern p-6 bg-white space-y-3">
                <span className="text-emerald-700 font-bold uppercase block">&gt; Compliance Audit Ledgers</span>
                <p className="text-zinc-600 text-xs font-sans leading-relaxed">
                  Generates immutable tax records for easy cross-referencing during KRA iTax and eTIMS compliance audits.
                </p>
              </div>
            </div>
          </div>

          {/* MODULE 4: VECTOR PDF ENGINE */}
          <div id="pdf-engine" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-black text-white px-2 py-1 uppercase">MODULE 04</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                A4 Landscape Vector PDF Engine
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
              <div className="card-modern p-6 bg-white space-y-3">
                <span className="text-emerald-700 font-bold uppercase block">&gt; Native Vector PDF Rendering</span>
                <p className="text-zinc-600 text-xs font-sans leading-relaxed">
                  Powered by `@react-pdf/renderer` for ultra-sharp, professional vector PDF output with embedded business logos.
                </p>
              </div>

              <div className="card-modern p-6 bg-white space-y-3">
                <span className="text-emerald-700 font-bold uppercase block">&gt; 11-Column Landscape Payroll PDF</span>
                <p className="text-zinc-600 text-xs font-sans leading-relaxed">
                  Generates A4 Landscape Payroll Vouchers featuring 11 unbundled breakdown columns (Base, Allow, Comm, PAYE, SHIF, AHL, NSSF, Net).
                </p>
              </div>

              <div className="card-modern p-6 bg-white space-y-3">
                <span className="text-emerald-700 font-bold uppercase block">&gt; Direct Download Links</span>
                <p className="text-zinc-600 text-xs font-sans leading-relaxed">
                  Download official PDF files instantly with proper file naming (`MannaBooks_PAY-JULY-2026-XXXX.pdf`).
                </p>
              </div>
            </div>
          </div>

          {/* MODULE 5: PASSWORDLESS PORTALS */}
          <div id="portals" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-black text-white px-2 py-1 uppercase">MODULE 05</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Passwordless Client &amp; Staff Portals
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
              <div className="card-modern p-6 bg-white space-y-3">
                <span className="text-emerald-700 font-bold uppercase block">&gt; 64-Character Token Security</span>
                <p className="text-zinc-600 text-xs font-sans leading-relaxed">
                  Every document generates a cryptographically secure 64-character hex token link for public or client access.
                </p>
              </div>

              <div className="card-modern p-6 bg-white space-y-3">
                <span className="text-emerald-700 font-bold uppercase block">&gt; Zero-Password Setup</span>
                <p className="text-zinc-600 text-xs font-sans leading-relaxed">
                  Clients view invoices, inspect remittance details, and download vector PDFs without creating accounts or entering passwords.
                </p>
              </div>

              <div className="card-modern p-6 bg-white space-y-3">
                <span className="text-emerald-700 font-bold uppercase block">&gt; Resend Email Integration</span>
                <p className="text-zinc-600 text-xs font-sans leading-relaxed">
                  Dispatch custom branded email notifications containing secure portal links directly from your workspace.
                </p>
              </div>
            </div>
          </div>

          {/* MODULE 6: ANALYTICS & A/R AGING */}
          <div id="analytics" className="space-y-6 scroll-mt-24">
            <div className="flex items-center gap-3 border-b border-zinc-200/80 pb-4">
              <span className="font-mono text-xs font-bold bg-black text-white px-2 py-1 uppercase">MODULE 06</span>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">
                Business Intelligence &amp; A/R Aging Matrix
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
              <div className="card-modern p-6 bg-white space-y-3">
                <span className="text-emerald-700 font-bold uppercase block">&gt; Executive Cash Outflows</span>
                <p className="text-zinc-600 text-xs font-sans leading-relaxed">
                  Tracks total settled inflows, procurement outflows, and paid payroll disbursements for real-time net operating cash flow metrics.
                </p>
              </div>

              <div className="card-modern p-6 bg-white space-y-3">
                <span className="text-emerald-700 font-bold uppercase block">&gt; A/R Aging Breakdown</span>
                <p className="text-zinc-600 text-xs font-sans leading-relaxed">
                  Categorizes pending invoices into 0–30, 31–60, 61–90, and 90+ day Accounts Receivable risk brackets.
                </p>
              </div>

              <div className="card-modern p-6 bg-white space-y-3">
                <span className="text-emerald-700 font-bold uppercase block">&gt; Sales Velocity &amp; LTV</span>
                <p className="text-zinc-600 text-xs font-sans leading-relaxed">
                  Analyzes top product bestsellers, sales quantity velocity, and client Lifetime Value (LTV) revenue share percentages.
                </p>
              </div>
            </div>
          </div>

        </section>

        {/* CTA BANNER */}
        <section className="border-t border-zinc-200/80 bg-zinc-950 text-white py-16 px-6 text-center space-y-6 font-mono">
          <h2 className="text-2xl sm:text-4xl font-bold uppercase tracking-tight font-sans">
            Ready to streamline your business finances?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto font-sans leading-relaxed">
            Initialize your free Manna Books workspace in seconds. eTIMS, multi-tax billing, and statutory payroll ready out of the box.
          </p>
          <div className="pt-2">
            <Link href="/signup" className="btn-primary-modern bg-white text-black hover:bg-zinc-200 px-8 py-3.5 text-xs font-semibold uppercase tracking-wider inline-block">
              Initialize Free Workspace
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200/80 px-6 py-8 flex flex-col sm:flex-row justify-between items-center bg-white text-xs text-zinc-500 font-mono gap-4">
        <p>© 2026 Manna Books LTD. All rights reserved. Powered by <Link href="https://corbantechnologies.org/" target="_blank" className="hover:underline text-black font-semibold">Corban Technologies LTD</Link></p>
        <div className="flex gap-6">
          <Link href="/terms" className="hover:underline">Terms of Specification</Link>
          <Link href="/privacy" className="hover:underline">Privacy Logic</Link>
        </div>
      </footer>
    </div>
  );
}
