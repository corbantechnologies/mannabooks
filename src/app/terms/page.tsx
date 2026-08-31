// src/app/terms/page.tsx
import Link from "next/link";

export default function TermsPage() {
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
          <h1 className="text-xl font-semibold uppercase tracking-tight text-black font-sans">Terms of Service</h1>
          <p className="font-mono text-xs text-zinc-500 uppercase font-semibold">Effective Date: Edition 2026</p>
        </div>

        <section className="space-y-4 text-sm text-zinc-700 leading-relaxed font-sans">
          <h2 className="font-sans font-semibold text-black uppercase text-sm">1. Service Scope</h2>
          <p>
            Manna Books provides financial tracking, automated document generation (quotations, invoices, receipts),
            and statutory tax calculation tools for small and medium enterprises.
          </p>

          <h2 className="font-sans font-semibold text-black uppercase text-sm pt-4">2. Data Ownership &amp; Integrity</h2>
          <p>
            You retain 100% ownership of your business records, client profiles, and billing line items.
          </p>

          <h2 className="font-sans font-semibold text-black uppercase text-sm pt-4">3. Account Responsibilities</h2>
          <p>
            Account holders are responsible for maintaining the confidentiality of their credentials and ensuring statutory tax compliance (such as valid KRA PIN numbers) mapped onto issued document templates.
          </p>
        </section>
      </main>

      <footer className="border-t border-zinc-200/80 px-6 py-6 text-xs text-zinc-500 font-sans text-center">
        © 2026 Manna Books LTD. All rights reserved.
      </footer>
    </div>
  );
}
