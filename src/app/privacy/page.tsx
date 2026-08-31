// src/app/privacy/page.tsx
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col justify-between selection:bg-black selection:text-white">
      <header className="border-b border-zinc-200/80 px-6 py-4 flex justify-between items-center glass-panel sticky top-0 z-50">
        <Link href="/" className="font-mono text-xl font-semibold tracking-tight uppercase text-black font-sans">
          Manna Books.
        </Link>
        <Link href="/" className="font-mono text-xs font-semibold uppercase hover:underline">
          ← Back to Overview
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-8 flex-1">
        <div className="space-y-2 border-b border-zinc-200/80 pb-6">
          <span className="font-sans text-xs text-zinc-400 font-semibold uppercase tracking-wider">Legal</span>
          <h1 className="text-xl font-semibold uppercase tracking-tight text-black font-sans">Privacy &amp; Security</h1>
          <p className="font-mono text-xs text-zinc-500 uppercase font-semibold">Effective Date: Edition 2026</p>
        </div>

        <section className="space-y-4 text-sm text-zinc-700 leading-relaxed font-sans">
          <h2 className="font-sans font-semibold text-black uppercase text-sm">1. Client Confidentiality</h2>
          <p>
            Client details, billing documents, and transactional entries are strictly isolated to your business workspace. We do not sell or monetize client financial data.
          </p>

          <h2 className="font-sans font-semibold text-black uppercase text-sm pt-4">2. Secure Client Links</h2>
          <p>
            Client document portals are accessible via unique, secure links. Clients do not need passwords or account credentials to view and acknowledge issued invoices.
          </p>

          <h2 className="font-sans font-semibold text-black uppercase text-sm pt-4">3. Data Protection Standards</h2>
          <p>
            All user sessions and data are protected using industry-standard encryption and secure cookies.
          </p>
        </section>
      </main>

      <footer className="border-t border-zinc-200/80 px-6 py-6 text-xs text-zinc-500 font-sans text-center">
        © 2026 Manna Books LTD. All rights reserved.
      </footer>
    </div>
  );
}
