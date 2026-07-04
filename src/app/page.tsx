import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col bg-white text-black selection:bg-black selection:text-white font-sans">
      
      {/* GLOBAL NAVIGATION HEADER */}
      <header className="border-b border-black px-6 py-4 flex justify-between items-center bg-white sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Manna Books" className="w-7 h-7 object-contain border border-black p-0.5 bg-white" />
          <Link href="/" className="font-mono text-xl font-bold tracking-tighter uppercase">
            Manna Books.
          </Link>
        </div>

        <nav className="flex items-center gap-6 font-mono text-xs font-bold uppercase">
          <Link href="/login" className="hover:underline underline-offset-4">
            Console Login
          </Link>
          <Link href="/signup" className="bg-black text-white px-4 py-2 hover:bg-zinc-800 transition-colors">
            Initialize Workspace
          </Link>
        </nav>
      </header>

      {/* HERO SECTION */}
      <main className="flex-1 flex flex-col">
        <section className="border-b border-black px-6 py-20 md:py-28 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 border border-black px-3 py-1 text-[11px] font-mono uppercase tracking-widest bg-zinc-50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Edition 2026.4 // KRA eTIMS &amp; PWA Enabled
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-none uppercase">
              Financial velocity &amp; statutory compliance for SMEs.
            </h1>
            <p className="text-base md:text-lg text-zinc-600 max-w-xl font-normal leading-relaxed">
              A minimalist fiscal tracking engine to manage clients, issue multi-rate tax invoices, automate KRA 20th monthly VAT returns, track A/R aging, and dispatch custom branded client portals.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-4 font-mono text-xs">
              <Link href="/signup" className="bg-black text-white text-center px-8 py-3.5 font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors">
                Initialize Free Workspace
              </Link>
              <a href="#features" className="border border-black text-center px-8 py-3.5 font-bold uppercase tracking-wider hover:bg-zinc-50 transition-colors">
                Explore Specifications
              </a>
            </div>
          </div>
          
          {/* STARK WIREFRAME VISUAL PREVIEW */}
          <div className="lg:col-span-5 border border-black p-6 bg-zinc-50 space-y-5 font-mono text-xs hidden lg:block shadow-sm">
            <div className="flex justify-between border-b border-black pb-3 items-center">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-black inline-block" />
                <span className="font-bold uppercase">Manna Console Node</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 font-bold uppercase">
                eTIMS 16% Active
              </span>
            </div>

            {/* LIVE KRA 20TH VAT ALERT PREVIEW */}
            <div className="bg-white border border-black p-3 space-y-1">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase text-zinc-500">
                <span>Statutory KRA 20th VAT Tracker</span>
                <span className="text-amber-700">⏰ 16 Days Left</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-black pt-1">
                <span>Output VAT (16%):</span>
                <span>KES 42,800.00</span>
              </div>
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
              <span>THEME: BRAND_PRIMARY</span>
            </div>
          </div>
        </section>

        {/* METRICS & FEATURES MATRIX GRID */}
        <section id="features" className="border-b border-black grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y lg:divide-y-0 divide-black bg-zinc-50">
          <div className="p-8 space-y-2 border-r border-black">
            <span className="font-mono text-xs text-zinc-400 font-bold">[01] ARCHITECTURE</span>
            <h3 className="font-bold uppercase tracking-tight text-lg">Passwordless Client Links</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">Your clients never configure passwords. They view, download PDFs, and inspect settlements via secure 64-character token links sent straight to their inbox.</p>
          </div>

          <div className="p-8 space-y-2 border-r border-black">
            <span className="font-mono text-xs text-zinc-400 font-bold">[02] KRA TAX ENGINE</span>
            <h3 className="font-bold uppercase tracking-tight text-lg">Statutory 20th VAT Tracker</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">Automate monthly KRA eTIMS VAT return preparation. Automatically aggregate 16% Output VAT, 0% Zero-Rated, and Exempt sales with 20th filing deadline alerts.</p>
          </div>

          <div className="p-8 space-y-2">
            <span className="font-mono text-xs text-zinc-400 font-bold">[03] INTELLIGENCE</span>
            <h3 className="font-bold uppercase tracking-tight text-lg">A/R Aging &amp; Cash Streams</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">Monitor chronological 6-month revenue vs. expense streams, 0–30/31–60/90+ day Accounts Receivable risk matrix, product velocity, and client LTV leaderboards.</p>
          </div>

          <div className="p-8 space-y-2 border-t border-black border-r border-black">
            <span className="font-mono text-xs text-zinc-400 font-bold">[04] BRANDING</span>
            <h3 className="font-bold uppercase tracking-tight text-lg">Custom Shop Themes</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">Upload custom logos to Cloudinary and choose your shop's primary brand hex color. Themes dynamically reflect across the workspace app, portals, PDFs, and Resend emails.</p>
          </div>

          <div className="p-8 space-y-2 border-t border-black border-r border-black">
            <span className="font-mono text-xs text-zinc-400 font-bold">[05] SETTLEMENTS</span>
            <h3 className="font-bold uppercase tracking-tight text-lg">Payment Channels &amp; Ref #</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">Record remittance destinations (Bank, M-Pesa Till/Paybill, Cash, Cheque) alongside transaction reference codes (M-Pesa Code / Bank Ref) for full ledger auditing.</p>
          </div>

          <div className="p-8 space-y-2 border-t border-black">
            <span className="font-mono text-xs text-zinc-400 font-bold">[06] PWA APPLIANCE</span>
            <h3 className="font-bold uppercase tracking-tight text-lg">Installable PWA Appliance</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">Install Manna Books directly to desktop or mobile home screens as a native standalone PWA appliance with offline fallback resilience.</p>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-black px-6 py-8 flex flex-col sm:flex-row justify-between items-center bg-white text-xs text-zinc-500 font-mono gap-4">
        <p>© 2026 Manna Books LTD. All rights reserved. Powered by <Link href="https://corbantechnologies.org/" target="_blank" className="hover:underline text-black font-bold">Corban Technologies LTD</Link></p>
        <div className="flex gap-6">
          <Link href="/terms" className="hover:underline">Terms of Specification</Link>
          <Link href="/privacy" className="hover:underline">Privacy Logic</Link>
        </div>
      </footer>
    </div>
  );
}