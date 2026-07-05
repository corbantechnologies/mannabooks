// src/app/guide/page.tsx
import Link from "next/link";

export default function PublicOperatorGuidePage() {
  return (
    <div className="flex-1 flex flex-col bg-white text-black selection:bg-black selection:text-white font-sans">
      
      {/* GLOBAL HEADER */}
      <header className="border-b border-zinc-200/80 px-6 py-4 flex justify-between items-center glass-panel sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Manna Books" className="w-7 h-7 object-contain border border-zinc-200 p-0.5 bg-white rounded" />
          <Link href="/" className="font-mono text-xl font-semibold tracking-tight uppercase text-black font-sans">
            Manna Books.
          </Link>
        </div>

        <nav className="flex items-center gap-3 sm:gap-6 font-mono text-xs font-semibold uppercase">
          <Link href="/features" className="hover:underline underline-offset-4">
            Features
          </Link>
          <Link href="/guide" className="underline underline-offset-4 font-bold text-black">
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

      {/* DOCUMENTATION CONTENT BODY */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-12 space-y-12 font-mono text-xs">
        
        {/* GUIDE TITLE HEADER */}
        <div className="border-b border-zinc-200/80 pb-8 space-y-3">
          <div className="inline-block border border-zinc-300 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-widest bg-zinc-50 rounded font-semibold text-zinc-600">
            OFFICIAL OPERATOR MANUAL // VERSION 2026.4
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold uppercase tracking-tight font-sans text-black">
            Manna Books Platform Guide &amp; Operating Specifications
          </h1>
          <p className="font-sans text-sm text-zinc-600 max-w-2xl leading-relaxed">
            Step-by-step documentation for managing multi-tenant business profiles, issuing eTIMS tax invoices, tracking monthly KRA VAT filings, analyzing cash flow streams, and setting up your PWA appliance.
          </p>
        </div>

        {/* GUIDE SECTION NAVIGATION INDEX */}
        <div className="card-modern p-6 space-y-3">
          <span className="font-semibold text-black uppercase text-sm block border-b border-zinc-200/80 pb-2 font-sans">
            &gt; Documentation Index &amp; Operating Modules
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-semibold text-[11px] uppercase">
            <a href="#module-1" className="hover:underline text-black">[01] Provisioning Workspaces &amp; Themes</a>
            <a href="#module-2" className="hover:underline text-black">[02] Client &amp; Supplier Directory</a>
            <a href="#module-3" className="hover:underline text-black">[03] Fiscal Invoices &amp; eTIMS Taxes</a>
            <a href="#module-4" className="hover:underline text-black">[04] Passwordless Client Portals</a>
            <a href="#module-5" className="hover:underline text-black">[05] Payment Channels &amp; Ref Codes</a>
            <a href="#module-6" className="hover:underline text-black">[06] KRA 20th VAT Return Tracker</a>
            <a href="#module-7" className="hover:underline text-black">[07] Financial Intelligence &amp; A/R Aging</a>
            <a href="#module-8" className="hover:underline text-black">[08] Standalone PWA Appliance</a>
          </div>
        </div>

        {/* MODULE 1 */}
        <section id="module-1" className="space-y-4 border-b border-black pb-8">
          <div className="flex items-center gap-2">
            <span className="bg-black text-white px-2 py-0.5 text-xs font-bold uppercase font-mono">[MODULE 01]</span>
            <h2 className="text-xl font-bold uppercase font-sans">Provisioning Workspaces &amp; Custom Shop Themes</h2>
          </div>
          <p className="font-sans text-sm text-zinc-600 leading-relaxed">
            Manna Books supports multi-tenancy. You can operate multiple business profiles under a single user account.
          </p>
          <div className="bg-zinc-50 border border-black p-4 space-y-2">
            <h4 className="font-bold uppercase text-black">Operating Steps:</h4>
            <ol className="list-decimal list-inside space-y-1.5 text-zinc-700">
              <li>Navigate to <strong>[06] System Settings</strong> in your workspace sidebar.</li>
              <li>Enter your <strong>Business Name</strong>, <strong>KRA Tax PIN</strong>, <strong>Phone Number</strong>, <strong>Business Short Name</strong>, and <strong>Website URL</strong>.</li>
              <li>Upload your shop logo asset to Cloudinary.</li>
              <li>Select your shop&apos;s <strong>Primary Theme Hex Color</strong> (e.g. Navy Blue `#1e3a8a` or Emerald Green `#065f46`). This color will automatically style all action buttons, borders, public invoice portals, vector PDFs, and Resend emails.</li>
              <li>Click <strong>Commit Changes</strong> to save your profile.</li>
            </ol>
          </div>
        </section>

        {/* MODULE 2 */}
        <section id="module-2" className="space-y-4 border-b border-black pb-8">
          <div className="flex items-center gap-2">
            <span className="bg-black text-white px-2 py-0.5 text-xs font-bold uppercase font-mono">[MODULE 02]</span>
            <h2 className="text-xl font-bold uppercase font-sans">Client &amp; Supplier Directory Management</h2>
          </div>
          <p className="font-sans text-sm text-zinc-600 leading-relaxed">
            Store client and supplier entities with their respective KRA Tax PINs for statutory compliance.
          </p>
          <div className="bg-zinc-50 border border-black p-4 space-y-2">
            <h4 className="font-bold uppercase text-black">Operating Steps:</h4>
            <ol className="list-decimal list-inside space-y-1.5 text-zinc-700">
              <li>Open <strong>[02] Client Flow</strong> or <strong>[04] Supplier Network</strong>.</li>
              <li>Click <strong>+ Register Client / Supplier</strong>.</li>
              <li>Specify the Entity Type: <strong>Individual</strong> (Personal PIN e.g. `A...`) or <strong>Corporate</strong> (Company PIN e.g. `P...`). There are no rigid PIN format blocks, accommodating all individual and corporate customers.</li>
              <li>Once registered, you can issue billing documents or generate procurement LPOs directly from the client/supplier detail screen.</li>
            </ol>
          </div>
        </section>

        {/* MODULE 3 */}
        <section id="module-3" className="space-y-4 border-b border-black pb-8">
          <div className="flex items-center gap-2">
            <span className="bg-black text-white px-2 py-0.5 text-xs font-bold uppercase font-mono">[MODULE 03]</span>
            <h2 className="text-xl font-bold uppercase font-sans">Issuing Fiscal Invoices, Receipts &amp; eTIMS Taxes</h2>
          </div>
          <p className="font-sans text-sm text-zinc-600 leading-relaxed">
            Manna Books handles multi-rate tax structures (Standard 16% Output VAT, 0% Zero-Rated, and Exempt items).
          </p>
          <div className="bg-zinc-50 border border-black p-4 space-y-2">
            <h4 className="font-bold uppercase text-black">Operating Steps:</h4>
            <ol className="list-decimal list-inside space-y-1.5 text-zinc-700">
              <li>Click <strong>+ Issue Document</strong> from the Fiscal Ledgers stream.</li>
              <li>Select Document Type: <strong>Invoice</strong>, <strong>Receipt</strong>, <strong>Quotation</strong>, <strong>LPO</strong>, or <strong>Credit Note</strong>.</li>
              <li>Add catalog line items. Set tax rate per row: <strong>V_16 (16%)</strong>, <strong>V_0 (0%)</strong>, or <strong>EXEMPT</strong>.</li>
              <li>(Optional) Enter the statutory <strong>KRA eTIMS Control Unit (CU) Serial Number</strong> (e.g. `CU012345/2026`).</li>
              <li>Click <strong>Publish Ledger Document</strong>.</li>
            </ol>
          </div>
        </section>

        {/* MODULE 4 */}
        <section id="module-4" className="space-y-4 border-b border-black pb-8">
          <div className="flex items-center gap-2">
            <span className="bg-black text-white px-2 py-0.5 text-xs font-bold uppercase font-mono">[MODULE 04]</span>
            <h2 className="text-xl font-bold uppercase font-sans">Passwordless Client Portals &amp; Email Dispatch</h2>
          </div>
          <p className="font-sans text-sm text-zinc-600 leading-relaxed">
            Clients view documents via secure 64-character unguessable token links sent to their email or WhatsApp without setting passwords.
          </p>
          <div className="bg-zinc-50 border border-black p-4 space-y-2">
            <h4 className="font-bold uppercase text-black">Operating Steps:</h4>
            <ol className="list-decimal list-inside space-y-1.5 text-zinc-700">
              <li>Open any document detail page.</li>
              <li>Click <strong>Copy Public Portal Link</strong> to share the secure link via WhatsApp or messaging.</li>
              <li>Or click <strong>Dispatch via Email</strong> to send a styled Resend HTML email with your shop logo and brand color CTA.</li>
            </ol>
          </div>
        </section>

        {/* MODULE 5 */}
        <section id="module-5" className="space-y-4 border-b border-black pb-8">
          <div className="flex items-center gap-2">
            <span className="bg-black text-white px-2 py-0.5 text-xs font-bold uppercase font-mono">[MODULE 05]</span>
            <h2 className="text-xl font-bold uppercase font-sans">Recording Payment Channels &amp; Remittance Ref #</h2>
          </div>
          <p className="font-sans text-sm text-zinc-600 leading-relaxed">
            Record payment settlement destinations and transaction code references for full audit trails.
          </p>
          <div className="bg-zinc-50 border border-black p-4 space-y-2">
            <h4 className="font-bold uppercase text-black">Operating Steps:</h4>
            <ol className="list-decimal list-inside space-y-1.5 text-zinc-700">
              <li>In the Document Status Panel, locate <strong>Payment Confirmation &amp; Remittance Ref</strong>.</li>
              <li>Select Payment Channel: <strong>Bank Account</strong>, <strong>M-Pesa (Till/Paybill)</strong>, <strong>Cash</strong>, <strong>Cheque</strong>, or <strong>Other</strong>.</li>
              <li>Type the transaction reference code (e.g. M-Pesa Code `QAB71239X` or Bank Ref `FT261900123`).</li>
              <li>Click <strong>Paid</strong> to finalize the settlement. The payment details will appear on the document details, client portal, downloadable PDF, and email.</li>
            </ol>
          </div>
        </section>

        {/* MODULE 6 */}
        <section id="module-6" className="space-y-4 border-b border-black pb-8">
          <div className="flex items-center gap-2">
            <span className="bg-black text-white px-2 py-0.5 text-xs font-bold uppercase font-mono">[MODULE 06]</span>
            <h2 className="text-xl font-bold uppercase font-sans">Statutory KRA 20th Monthly VAT Return Tracker</h2>
          </div>
          <p className="font-sans text-sm text-zinc-600 leading-relaxed">
            In Kenya, monthly VAT returns must be remitted on iTax before the <strong>20th of every month</strong>.
          </p>
          <div className="bg-zinc-50 border border-black p-4 space-y-2">
            <h4 className="font-bold uppercase text-black">Operating Steps:</h4>
            <ol className="list-decimal list-inside space-y-1.5 text-zinc-700">
              <li>Open <strong>[05] Financial Analytics</strong>.</li>
              <li>Review the <strong>Statutory KRA 20th VAT Return Tracker</strong> alert banner.</li>
              <li>Check the live countdown to the 20th filing deadline.</li>
              <li>Inspect your calculated <strong>Output VAT (16%)</strong>, <strong>Taxable Sales Volume</strong>, <strong>0% Zero-Rated Volume</strong>, and <strong>Exempt Volume</strong> totals to complete your monthly iTax return seamlessly.</li>
            </ol>
          </div>
        </section>

        {/* MODULE 7 */}
        <section id="module-7" className="space-y-4 border-b border-black pb-8">
          <div className="flex items-center gap-2">
            <span className="bg-black text-white px-2 py-0.5 text-xs font-bold uppercase font-mono">[MODULE 07]</span>
            <h2 className="text-xl font-bold uppercase font-sans">Financial Intelligence &amp; A/R Aging Matrix</h2>
          </div>
          <p className="font-sans text-sm text-zinc-600 leading-relaxed">
            Gain real-time visibility into operating cash flows and overdue client receivables.
          </p>
          <div className="bg-zinc-50 border border-black p-4 space-y-2">
            <h4 className="font-bold uppercase text-black">Operating Steps:</h4>
            <ol className="list-decimal list-inside space-y-1.5 text-zinc-700">
              <li>Open <strong>[05] Financial Analytics</strong>.</li>
              <li>Use the Timeframe Filter tabs to view metrics for <strong>This Month</strong>, <strong>Last Month</strong>, <strong>This Quarter</strong>, <strong>This Year</strong>, or <strong>All Time</strong>.</li>
              <li>Analyze your 6-month <strong>Monthly Cash Flow Timeline Stream</strong> comparing sales receipts against procurement expenses.</li>
              <li>Review the <strong>A/R Aging Risk Matrix</strong> (0–30, 31–60, 61–90, 90+ days) to target high-risk collection accounts.</li>
            </ol>
          </div>
        </section>

        {/* MODULE 8 */}
        <section id="module-8" className="space-y-4 pb-4">
          <div className="flex items-center gap-2">
            <span className="bg-black text-white px-2 py-0.5 text-xs font-bold uppercase font-mono">[MODULE 08]</span>
            <h2 className="text-xl font-bold uppercase font-sans">Installing the Standalone PWA Appliance</h2>
          </div>
          <p className="font-sans text-sm text-zinc-600 leading-relaxed">
            Install Manna Books directly to your Windows, Mac, Android, or iOS desktop/home screen.
          </p>
          <div className="bg-zinc-50 border border-black p-4 space-y-2">
            <h4 className="font-bold uppercase text-black">Installation Steps:</h4>
            <ul className="list-disc list-inside space-y-1.5 text-zinc-700">
              <li><strong>Chrome / Edge / Windows / Mac:</strong> Click the <strong>📲 Install App</strong> prompt banner at the bottom right corner or the install icon in your browser address bar.</li>
              <li><strong>iOS Safari (iPhone / iPad):</strong> Tap the <strong>Share</strong> icon in Safari and select <strong>Add to Home Screen</strong>.</li>
            </ul>
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
