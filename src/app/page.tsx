import Link from "next/link";

export default function LandingPage() {
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
        <section className="border-b border-zinc-200/80 px-6 py-20 md:py-28 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 border border-zinc-300 px-3 py-1 text-[11px] font-mono uppercase tracking-widest bg-zinc-50 rounded font-semibold text-zinc-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Edition 2026.5 // eTIMS, Multi-Tax &amp; Statutory Payroll Suite
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-none uppercase">
              Financial velocity &amp; statutory compliance for SMEs.
            </h1>
            <p className="text-base md:text-lg text-zinc-600 max-w-xl font-normal leading-relaxed">
              A minimalist fiscal tracking engine for multi-tenant business workspaces. Issue multi-rate KRA eTIMS invoices, automate 20th monthly VAT returns, execute statutory payroll runs with A4 Landscape PDF vouchers, track A/R aging, and dispatch passwordless client portals.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-4 font-mono text-xs">
              <Link href="/signup" className="btn-primary-modern text-center px-8 py-3.5 text-xs font-semibold uppercase tracking-wider">
                Initialize Free Workspace
              </Link>
              <a href="#features" className="btn-secondary-modern text-center px-8 py-3.5 text-xs font-semibold uppercase tracking-wider">
                Explore Specifications
              </a>
            </div>
          </div>
          
          {/* STARK WIREFRAME VISUAL CONSOLE PREVIEW */}
          <div className="lg:col-span-5 card-modern p-6 space-y-5 font-mono text-xs hidden lg:block shadow-md">
            <div className="flex justify-between border-b border-black pb-3 items-center">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-black inline-block" />
                <span className="font-bold uppercase">Manna Console Node</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 font-bold uppercase">
                eTIMS &amp; Payroll Active
              </span>
            </div>

            {/* LIVE KRA 20TH VAT ALERT PREVIEW */}
            <div className="bg-white border border-black p-3 space-y-1">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase text-zinc-500">
                <span>Statutory KRA 20th VAT Tracker</span>
                <span className="text-amber-700">⏰ 15 Days Remaining</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-black pt-1">
                <span>Output VAT (16%):</span>
                <span>KES 42,800.00</span>
              </div>
            </div>

            {/* RECENT STATUTORY PAYROLL RUN PREVIEW */}
            <div className="bg-zinc-950 text-white p-3 border border-black space-y-1.5 rounded-sm">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                <span className="text-emerald-400">PAYROLL VOUCHER RUN</span>
                <span className="bg-emerald-500 text-black px-1.5 py-0.5 text-[9px] font-bold">LOCKED &amp; PAID</span>
              </div>
              <div className="flex justify-between text-xs font-semibold pt-0.5">
                <span>Ref: PAY-JULY-2026-9042</span>
                <span className="text-emerald-300">KES 184,500.00</span>
              </div>
              <p className="text-[9px] text-zinc-400">Includes PAYE, SHIF (2.75%), AHL (1.5%), NSSF Tier I &amp; II Payouts.</p>
            </div>

            {/* LEDGER SNAPSHOT STACK */}
            <div className="space-y-2">
              <div className="flex justify-between bg-white p-2.5 border border-black items-center">
                <div>
                  <span className="font-bold block">RCT-2026-001</span>
                  <span className="text-[9px] text-zinc-500">Paid via M-Pesa (Ref: QAB71239X)</span>
                </div>
                <div className="text-right">
                  <span className="font-bold block">KES 142,000.00</span>
                  <span className="bg-black text-white px-1 text-[9px] font-bold uppercase">PAID</span>
                </div>
              </div>

              <div className="flex justify-between bg-white p-2.5 border border-zinc-300 items-center">
                <div>
                  <span className="font-bold block">INV-2026-042</span>
                  <span className="text-[9px] text-zinc-500">KRA CU #: CU012345/2026</span>
                </div>
                <div className="text-right">
                  <span className="font-bold block">KES 310,000.00</span>
                  <span className="bg-amber-100 text-amber-900 border border-amber-300 px-1 text-[9px] font-bold uppercase">SENT</span>
                </div>
              </div>
            </div>

            <div className="border-t border-black pt-3 flex justify-between items-center text-[10px] text-zinc-500">
              <span>PWA APPLIANCE: STANDALONE</span>
              <span>PDF: A4 LANDSCAPE VECTOR</span>
            </div>
          </div>
        </section>

        {/* METRICS & FEATURES MATRIX GRID */}
        <section id="features" className="border-b border-zinc-200/80 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 divide-zinc-200/80 bg-zinc-50/50">
          <div className="p-8 space-y-2 border-r border-zinc-200/80">
            <span className="font-mono text-xs text-zinc-400 font-semibold">[01] PAYROLL ENGINE</span>
            <h3 className="font-semibold uppercase tracking-tight text-lg text-black font-sans">Statutory &amp; Custom Payroll</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">Execute staff, wage, and commission runs. Calculates Kenyan PAYE, SHIF (2.75%), Housing Levy (AHL 1.5%), NSSF Tier I &amp; II, and custom advance recoveries with DRAFT vs PAID status states.</p>
          </div>

          <div className="p-8 space-y-2 border-r border-zinc-200/80">
            <span className="font-mono text-xs text-zinc-400 font-semibold">[02] KRA TAX ENGINE</span>
            <h3 className="font-semibold uppercase tracking-tight text-lg text-black font-sans">Statutory 20th VAT Tracker</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">Automate monthly KRA eTIMS VAT return preparation. Automatically aggregate 16% Output VAT, 0% Zero-Rated, and Exempt sales with live 20th filing deadline alerts.</p>
          </div>

          <div className="p-8 space-y-2 border-r border-zinc-200/80">
            <span className="font-mono text-xs text-zinc-400 font-semibold">[03] VECTOR PDF ENGINE</span>
            <h3 className="font-semibold uppercase tracking-tight text-lg text-black font-sans">A4 Landscape PDF Engine</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">Download official, print-ready vector PDF documents (Invoices, Receipts, Quotations, LPOs, and A4 Landscape Statutory Payroll Vouchers) complete with shop logos and tax PINs.</p>
          </div>

          <div className="p-8 space-y-2">
            <span className="font-mono text-xs text-zinc-400 font-semibold">[04] ARCHITECTURE</span>
            <h3 className="font-semibold uppercase tracking-tight text-lg text-black font-sans">Passwordless Client Links</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">Clients never configure passwords. They view, download PDFs, and inspect settlements via secure 64-character token links sent straight to their inbox.</p>
          </div>

          <div className="p-8 space-y-2 border-t border-zinc-200/80 border-r border-zinc-200/80">
            <span className="font-mono text-xs text-zinc-400 font-semibold">[05] DIRECTORY &amp; COMPLIANCE</span>
            <h3 className="font-semibold uppercase tracking-tight text-lg text-black font-sans">Staff &amp; ID PIN Directory</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">Dedicated employee directory with National ID and KRA PIN uniqueness validation, base commitment metrics, and individual historical payment sub-ledgers.</p>
          </div>

          <div className="p-8 space-y-2 border-t border-zinc-200/80 border-r border-zinc-200/80">
            <span className="font-mono text-xs text-zinc-400 font-semibold">[06] INTELLIGENCE</span>
            <h3 className="font-semibold uppercase tracking-tight text-lg text-black font-sans">A/R Aging &amp; Cash Streams</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">Monitor 6-month revenue vs. expense streams, 0–30/31–60/90+ day Accounts Receivable risk matrix, product velocity, and client LTV leaderboards.</p>
          </div>

          <div className="p-8 space-y-2 border-t border-zinc-200/80 border-r border-zinc-200/80">
            <span className="font-mono text-xs text-zinc-400 font-semibold">[07] BRANDING &amp; REMITTANCE</span>
            <h3 className="font-semibold uppercase tracking-tight text-lg text-black font-sans">Shop Themes &amp; Channels</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">Custom shop branding, logo uploads, and payment destination auditing (Bank, M-Pesa Till/Paybill, Cash, Cheque) with transaction reference tracking.</p>
          </div>

          <div className="p-8 space-y-2 border-t border-zinc-200/80">
            <span className="font-mono text-xs text-zinc-400 font-semibold">[08] PWA APPLIANCE</span>
            <h3 className="font-semibold uppercase tracking-tight text-lg text-black font-sans">Installable PWA Appliance</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">Install Manna Books directly to desktop or mobile home screens as a native standalone PWA appliance with offline fallback resilience.</p>
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