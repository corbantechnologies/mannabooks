// src/app/privacy/page.tsx
import Link from "next/link";

export default function PrivacyPage() {
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
          <span className="font-mono text-xs text-zinc-400 uppercase">SPECIFICATION // PRIVACY_LOGIC</span>
          <h1 className="text-3xl font-bold uppercase tracking-tight">Privacy Logic &amp; Security</h1>
          <p className="font-mono text-xs text-zinc-500 uppercase">Effective Date: Edition 2026</p>
        </div>

        <section className="space-y-4 text-sm text-zinc-700 leading-relaxed font-sans">
          <h2 className="font-mono font-bold text-black uppercase text-base">&gt; 1. Client Confidentiality</h2>
          <p>
            Client details, billing documents, and transactional entries are strictly isolated to your tenant workspace. We do not sell or monetize client financial metadata.
          </p>

          <h2 className="font-mono font-bold text-black uppercase text-base pt-4">&gt; 2. Passwordless Client Links</h2>
          <p>
            Client document portals are accessible via cryptographically un-guessable 64-character tokens. Clients do not need account credentials to view and acknowledge issued invoices.
          </p>

          <h2 className="font-mono font-bold text-black uppercase text-base pt-4">&gt; 3. Data Protection Standards</h2>
          <p>
            Sessions are protected using stateful HTTP-only cookies with cryptographic token IDs stored securely in PostgreSQL.
          </p>
        </section>
      </main>

      <footer className="border-t border-black px-6 py-6 text-xs text-zinc-500 font-mono text-center">
        © 2026 Manna Books LTD. Privacy Logic Node.
      </footer>
    </div>
  );
}
