import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col bg-white text-black selection:bg-black selection:text-white">
      
      {/* GLOBAL HEADER HEADER */}
      <header className="border-b border-black px-6 py-4 flex justify-between items-center bg-white sticky top-0 z-50">
        <Link href="/" className="font-mono text-xl font-bold tracking-tighter uppercase">
          Manna Books.
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/login" className="hover:underline underline-offset-4">
            Login
          </Link>
          <Link href="/signup" className="bg-black text-white px-4 py-2 hover:bg-zinc-900 transition-colors">
            Get Started
          </Link>
        </nav>
      </header>

      {/* HERO SECTION */}
      <main className="flex-1 flex flex-col">
        <section className="border-b border-black px-6 py-24 md:py-36 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-block border border-black px-2 py-0.5 text-xs font-mono uppercase tracking-widest">
              Edition 2026 // Active Compliance
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter leading-none uppercase">
              Financial velocity for small businesses.
            </h1>
            <p className="text-base md:text-lg text-zinc-600 max-w-xl font-normal leading-relaxed">
              A minimalist tracking platform built from scratch to manage your clients, track quotations, instantly compile invoices, and protect cash flow. Complete structural support for individual and corporate tax requirements.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <Link href="/signup" className="bg-black text-white text-center px-8 py-3 text-sm font-bold uppercase tracking-wider hover:bg-zinc-900 transition-colors">
                Initialize Workspace
              </Link>
              <a href="#features" className="border border-black text-center px-8 py-3 text-sm font-bold uppercase tracking-wider hover:bg-zinc-50 transition-colors">
                Read Specifications
              </a>
            </div>
          </div>
          
          {/* STARK WIREFRAME VISUAL PREVIEW */}
          <div className="lg:col-span-5 border border-black p-6 bg-zinc-50 space-y-6 font-mono text-xs hidden lg:block">
            <div className="flex justify-between border-b border-zinc-300 pb-2">
              <span>SYSTEM LOG // LEDGER_STREAM</span>
              <span className="text-emerald-600">ONLINE</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between bg-white p-2 border border-black">
                <span>INV-2026-001</span>
                <span className="font-bold">KES 142,000.00</span>
                <span className="bg-emerald-100 text-emerald-800 px-1 font-sans font-bold">PAID</span>
              </div>
              <div className="flex justify-between bg-white p-2 border border-zinc-200">
                <span>QT-2026-042</span>
                <span className="font-bold">KES 89,500.00</span>
                <span className="bg-purple-100 text-purple-800 px-1 font-sans font-medium">DRAFT</span>
              </div>
              <div className="flex justify-between bg-white p-2 border border-zinc-200">
                <span>INV-2026-002</span>
                <span className="font-bold">KES 310,000.00</span>
                <span className="bg-rose-100 text-rose-800 px-1 font-sans font-bold">OVERDUE</span>
              </div>
            </div>
            <div className="border-t border-zinc-300 pt-4 space-y-1 text-zinc-400">
              <p>&gt; FILTER: shop_id = current_session</p>
              <p>&gt; TAX_ENGINE: statutory_vat_16_enabled</p>
            </div>
          </div>
        </section>

        {/* METRICS SUMMARY STRIP */}
        <section id="features" className="border-b border-black grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black bg-zinc-50">
          <div className="p-8 space-y-2">
            <span className="font-mono text-sm text-zinc-400">01 / ARCHITECTURE</span>
            <h3 className="font-bold uppercase tracking-tight text-lg">Passwordless Client Links</h3>
            <p className="text-sm text-zinc-600">Your clients never sign up or configure passwords. They view and manage settlements via secure, cryptographically un-guessable 64-character tokens sent straight to their inbox.</p>
          </div>
          <div className="p-8 space-y-2">
            <span className="font-mono text-sm text-zinc-400">02 / TAX MATRIX</span>
            <h3 className="font-bold uppercase tracking-tight text-lg">Compliance Ready</h3>
            <p className="text-sm text-zinc-600">Seamlessly assign Individual or Corporate tax configurations. Handle multi-rate document layouts by swapping rows instantly between 16% VAT, Zero-Rated, and Exempt flags.</p>
          </div>
          <div className="p-8 space-y-2">
            <span className="font-mono text-sm text-zinc-400">03 / PERFORMANCE</span>
            <h3 className="font-bold uppercase tracking-tight text-lg">Zero Numerical Precision Drift</h3>
            <p className="text-sm text-zinc-600">Powered by high-precision decimal mapping layers. All currency metrics are stored as absolute snapshots, safeguarding your accounts from floating-point rounding errors.</p>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-black px-6 py-6 flex flex-col sm:flex-row justify-between items-center bg-white text-xs text-zinc-500 font-mono">
        <p>© 2026 Manna Books LTD. All rights reserved. Powered by <Link href="https://corbantechnologies.org/" target="_blank" className="hover:underline">Corban Technologies LTD</Link></p>
        <div className="flex gap-4 mt-2 sm:mt-0">
          <Link href="/terms" className="hover:underline">Terms of Specification</Link>
          <Link href="/privacy" className="hover:underline">Privacy Logic</Link>
        </div>
      </footer>
    </div>
  );
}