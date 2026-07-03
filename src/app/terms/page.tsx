// src/app/terms/page.tsx
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col justify-between selection:bg-black selection:text-white">
      <header className="border-b border-black px-6 py-4 flex justify-between items-center bg-white">
        <Link href="/" className="font-mono text-xl font-bold tracking-tighter uppercase">
          Manna Books.
        </Link>
        <Link href="/" className="font-mono text-xs font-bold uppercase hover:underline">
          ← Back to Overview
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-8 flex-1">
        <div className="space-y-2 border-b border-black pb-6">
          <span className="font-mono text-xs text-zinc-400 uppercase">SPECIFICATION // LEGAL_TERMS</span>
          <h1 className="text-3xl font-bold uppercase tracking-tight">Terms of Specification</h1>
          <p className="font-mono text-xs text-zinc-500 uppercase">Effective Date: Edition 2026</p>
        </div>

        <section className="space-y-4 text-sm text-zinc-700 leading-relaxed font-sans">
          <h2 className="font-mono font-bold text-black uppercase text-base">&gt; 1. Service Scope</h2>
          <p>
            Manna Books provides financial ledger tracking, automated document generation (quotations, invoices, receipts),
            and statutory tax calculation tools for small and medium enterprises.
          </p>

          <h2 className="font-mono font-bold text-black uppercase text-base pt-4">&gt; 2. Data Ownership &amp; Integrity</h2>
          <p>
            You retain 100% ownership of your business records, client profiles, and billing line items. Manna Books provides high-precision data storage to prevent floating-point calculation drift.
          </p>

          <h2 className="font-mono font-bold text-black uppercase text-base pt-4">&gt; 3. Account Responsibilities</h2>
          <p>
            Master account holders are responsible for maintaining the confidentiality of their credentials and ensuring statutory tax compliance (such as valid KRA PIN numbers) mapped onto issued document templates.
          </p>
        </section>
      </main>

      <footer className="border-t border-black px-6 py-6 text-xs text-zinc-500 font-mono text-center">
        © 2026 Manna Books LTD. Terms of Specification Node.
      </footer>
    </div>
  );
}
