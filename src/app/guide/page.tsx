// src/app/guide/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/PublicNavbar";

export const metadata: Metadata = {
  title: "Operator Guide | Manna Books — How to Use KRA eTIMS Invoicing, Payroll & POS",
  description:
    "Step-by-step operator manual for Manna Books. Learn how to issue KRA eTIMS invoices, run statutory payroll, manage walk-in POS sales, track inventory and COGS, automate your monthly 20th VAT return, and use the A/R aging analytics dashboard.",
  keywords: [
    "Manna Books guide",
    "KRA eTIMS invoicing tutorial Kenya",
    "statutory payroll guide Kenya",
    "POS sales Kenya",
    "20th VAT return Kenya tutorial",
    "mannabooks.co.ke guide",
    "how to use Manna Books",
  ],
  openGraph: {
    title: "Operator Guide | Manna Books — KRA eTIMS, Payroll & Analytics",
    description: "Complete step-by-step guide for Manna Books: eTIMS invoicing, statutory payroll, walk-in POS, COGS tracking, VAT return automation, and A/R analytics.",
    url: "https://mannabooks.co.ke/guide",
    siteName: "Manna Books",
    locale: "en_KE",
    type: "article",
  },
  alternates: {
    canonical: "https://mannabooks.co.ke/guide",
  },
};

export default function PublicOperatorGuidePage() {
  return (
    <div className="flex-1 flex flex-col bg-white text-black selection:bg-black selection:text-white font-sans">

      <PublicNavbar />

      {/* DOCUMENTATION CONTENT BODY */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full">

        {/* STICKY LEFT SIDEBAR — TABLE OF CONTENTS (desktop only) */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-zinc-200/80 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto p-6 space-y-6">
          <div className="space-y-1">
            <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 font-semibold block mb-3">Contents</span>
            <nav className="flex flex-col gap-1 font-mono text-xs font-semibold uppercase">
              {[
                { href: "#module-0", label: "[00] Walk-in POS Terminal" },
                { href: "#module-1", label: "[01] Workspace Setup" },
                { href: "#module-2", label: "[02] Product Catalog & COGS" },
                { href: "#module-3", label: "[03] Client & Supplier Directory" },
                { href: "#module-4", label: "[04] Fiscal Invoices & eTIMS" },
                { href: "#module-5", label: "[05] Passwordless Portals" },
                { href: "#module-6", label: "[06] Payment Channels" },
                { href: "#module-7", label: "[07] KRA 20th VAT Tracker" },
                { href: "#module-8", label: "[08] Analytics & A/R Aging" },
                { href: "#module-9", label: "[09] Statutory Payroll" },
                { href: "#module-10", label: "[10] Multi-Location Stock" },
                { href: "#module-11", label: "[11] Shared B2B Inbox" },
                { href: "#module-12", label: "[12] PWA Appliance" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 text-zinc-500 border border-transparent rounded hover:border-zinc-300 hover:bg-zinc-50 hover:text-black transition-all block text-[10px] tracking-wider"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* MAIN DOCUMENTATION BODY */}
        <main className="flex-1 min-w-0 p-6 md:p-10 space-y-12 font-mono text-xs">

          {/* GUIDE TITLE HEADER */}
          <div className="border-b border-zinc-200/80 pb-8 space-y-4">
            <div className="inline-block border border-zinc-300 px-3 py-1 text-[10px] font-mono uppercase tracking-widest bg-zinc-50 rounded-full font-semibold text-zinc-600">
              Official Operator Manual // Version 2026.5
            </div>
            <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tight font-sans text-black">
              Manna Books Platform Guide &amp; Operating Specifications
            </h1>
            <p className="font-sans text-sm text-zinc-600 max-w-2xl leading-relaxed">
              Step-by-step documentation for managing workspaces, issuing eTIMS invoices, running POS counter sales, tracking COGS profitability, managing statutory payroll, and analyzing business cash flows.
            </p>

            {/* MOBILE INDEX (shown on mobile only) */}
            <div className="lg:hidden border border-zinc-200 rounded-xl p-5 space-y-3 mt-4">
              <span className="font-bold text-black uppercase text-xs block font-sans">&gt; Documentation Index</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-semibold text-[10px] uppercase">
                {[
                  { href: "#module-0", label: "[00] Walk-in POS Terminal" },
                  { href: "#module-1", label: "[01] Workspace Setup" },
                  { href: "#module-2", label: "[02] Product Catalog & COGS" },
                  { href: "#module-3", label: "[03] Client & Supplier Directory" },
                  { href: "#module-4", label: "[04] Fiscal Invoices & eTIMS" },
                  { href: "#module-5", label: "[05] Passwordless Portals" },
                  { href: "#module-6", label: "[06] Payment Channels" },
                  { href: "#module-7", label: "[07] KRA 20th VAT Tracker" },
                  { href: "#module-8", label: "[08] Analytics & A/R Aging" },
                  { href: "#module-9", label: "[09] Statutory Payroll" },
                  { href: "#module-10", label: "[10] Multi-Location Stock" },
                  { href: "#module-11", label: "[11] Shared B2B Inbox" },
                  { href: "#module-12", label: "[12] PWA Appliance" },
                ].map((item) => (
                  <a key={item.href} href={item.href} className="hover:underline text-black">{item.label}</a>
                ))}
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 0: WALK-IN POS TERMINAL */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-0" className="space-y-4 scroll-mt-20">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-emerald-700 text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-sm shrink-0">[MODULE 00]</span>
              <h2 className="text-xl font-bold uppercase font-sans">Walk-in POS Counter Terminal</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              The dedicated walk-in sales counter for point-of-sale transactions that require no client record. Generates an official PAID receipt and automatically decrements stock.
            </p>
            <div className="bg-zinc-50 border border-zinc-200 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Operating Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>Navigate to <strong>[02] Walk-in Sales</strong> in the workspace sidebar.</li>
                <li>Use the <strong>Catalog Quick Picker</strong> to search items by name or SKU. Click an item to add it to the basket — a badge shows the quantity already added.</li>
                <li>Adjust quantities using the <strong>+ / −</strong> buttons or type directly into the quantity field in the basket panel.</li>
                <li>Select the payment method: <strong>M-Pesa</strong> (enter transaction ref), <strong>Cash</strong> (enter amount received for change calculation), or <strong>Bank/Card</strong>.</li>
                <li>Click <strong>⚡ Complete Sale &amp; Print Receipt</strong>. An official PAID receipt is generated, stock is decremented automatically, and you are redirected to the receipt detail page.</li>
              </ol>
            </div>
            <div className="bg-black text-white p-4 rounded-xl font-mono text-[10px] space-y-1">
              <div className="text-emerald-400 font-bold uppercase">IMPORTANT</div>
              <p>Out-of-stock items are automatically blocked (dimmed and disabled) in the catalog. The basket also warns if quantity exceeds available stock levels.</p>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 1: PROVISIONING WORKSPACE */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-1" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-black text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-sm shrink-0">[MODULE 01]</span>
              <h2 className="text-xl font-bold uppercase font-sans">Provisioning Workspaces &amp; Custom Shop Themes</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Manna Books supports multi-tenancy. Operate multiple business profiles under a single user account. Each workspace has its own brand color, logo, documents, products, and client directory.
            </p>
            <div className="bg-zinc-50 border border-zinc-200 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Operating Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>Navigate to <strong>[09] System Settings</strong> in the workspace sidebar.</li>
                <li>Enter your <strong>Business Name</strong>, <strong>KRA Tax PIN</strong>, <strong>Phone Number</strong>, <strong>Short Name</strong>, and <strong>Website URL</strong>.</li>
                <li>Upload your shop logo asset to Cloudinary via the logo upload button.</li>
                <li>Select your shop&apos;s <strong>Primary Theme Hex Color</strong> (e.g. Navy Blue <code>#1e3a8a</code> or Emerald Green <code>#065f46</code>). This color auto-styles action buttons, invoice portals, vector PDFs, and Resend emails.</li>
                <li>Toggle <strong>VAT Registered</strong> if your business is registered for 16% Standard VAT.</li>
                <li>Click <strong>Commit Changes</strong> to save.</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 2: PRODUCT CATALOG & COGS */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-2" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-black text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-sm shrink-0">[MODULE 02]</span>
              <h2 className="text-xl font-bold uppercase font-sans">Product Catalog, Inventory &amp; COGS Tracking</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Register your full catalog of products and services. Setting cost prices (COGS) enables automatic gross profit margin analysis in the Analytics dashboard.
            </p>
            <div className="bg-zinc-50 border border-zinc-200 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Registering a New Catalog Item:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>Navigate to <strong>[04] Product Catalog</strong> and click <strong>+ Register Catalog Item</strong>.</li>
                <li>Select the <strong>Item Classification</strong>: <strong>📦 Product</strong> (tangible good, eligible for stock tracking) or <strong>🛠️ Service</strong> (labor/consulting, no stock tracking).</li>
                <li>Enter the item <strong>Name</strong>, an optional <strong>SKU</strong> code (auto-generated if blank), the <strong>Selling Price</strong>, and the <strong>Cost Price / COGS</strong>.</li>
                <li>Set the <strong>Default Tax Type</strong>: <code>V_16</code> (16% VAT), <code>V_0</code> (Zero-Rated), or <code>EXEMPT</code>.</li>
                <li>For Products, toggle <strong>Track Inventory Stock</strong> ON to enter opening stock quantity and low-stock alert threshold.</li>
                <li>Click <strong>Save Item</strong>.</li>
              </ol>
            </div>
            <div className="bg-zinc-50 border border-zinc-200 p-5 space-y-2 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">How COGS Powers Analytics:</h4>
              <p className="font-sans text-sm text-zinc-600 leading-relaxed">
                When products with a <strong>Cost Price</strong> are sold (via receipt or POS), the Analytics engine calculates: <strong>Gross Profit = Total Revenue − Total COGS</strong>. The Gross Profit Margin % is displayed in the Analytics dashboard under &quot;COGS &amp; Gross Profit Intelligence&quot;.
              </p>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 3: CLIENT & SUPPLIER DIRECTORY */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-3" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-black text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-sm shrink-0">[MODULE 03]</span>
              <h2 className="text-xl font-bold uppercase font-sans">Client &amp; Supplier Directory Management</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Store client and supplier entities with KRA Tax PINs for statutory compliance. Walk-in sales don&apos;t require a registered client — use the POS terminal instead.
            </p>
            <div className="bg-zinc-50 border border-zinc-200 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Operating Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>Open <strong>[03] Client Flow</strong> or <strong>[05] Supplier Network</strong>.</li>
                <li>Click <strong>+ Register Client</strong> or <strong>+ Register Supplier</strong>.</li>
                <li>Select the Entity Type: <strong>Individual</strong> (Personal PIN e.g. A...) or <strong>Corporate</strong> (Company PIN e.g. P...). No rigid PIN format constraints.</li>
                <li>Toggle <strong>Requires eTIMS</strong> if this entity needs KRA eTIMS CU serial numbers embedded on their documents.</li>
                <li>From the client/supplier detail page, you can issue billing documents or procurement LPOs directly.</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 4: FISCAL INVOICES & ETIMS */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-4" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-black text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-sm shrink-0">[MODULE 04]</span>
              <h2 className="text-xl font-bold uppercase font-sans">Issuing Fiscal Invoices, Receipts &amp; eTIMS Taxes</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Generate all outbound sales documents and procurement documents. Multi-rate tax (16% VAT, 0% Zero-Rated, Exempt) is handled at the line-item level. Receipts are automatically marked PAID and trigger stock deduction.
            </p>
            <div className="bg-zinc-50 border border-zinc-200 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Operating Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>Click <strong>+ Issue Document</strong> from the Fiscal Ledgers stream or from a client/supplier profile page.</li>
                <li>Select the <strong>Document Type</strong>: Invoice, Receipt, Quotation, LPO, PO, Delivery Note, Credit Note, Debit Note, GRN, or Payment Voucher.</li>
                <li>For Receipts — a <strong>Client</strong> is optional (useful for walk-in / counter sales). For Invoices, select the target client. For procurement documents, select the supplier.</li>
                <li>Add catalog line items from your product registry, or type custom descriptions. Set the tax rate per row: <code>V_16 (16%)</code>, <code>V_0 (0%)</code>, or <code>EXEMPT</code>.</li>
                <li>(Optional) Enter the statutory <strong>KRA eTIMS Control Unit (CU) Serial Number</strong> (e.g. <code>CU012345/2026</code>).</li>
                <li>Set the <strong>Issue Date</strong>. Due Date is optional — receipts don&apos;t require a due date since payment is immediate.</li>
                <li>Click <strong>Publish Ledger Document</strong>. Receipts are automatically set to <strong>PAID</strong> status and trigger stock deduction immediately.</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 5: PASSWORDLESS PORTALS */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-5" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-black text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-sm shrink-0">[MODULE 05]</span>
              <h2 className="text-xl font-bold uppercase font-sans">Passwordless Client Portals &amp; Email Dispatch</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Clients view documents via secure 64-character unguessable token links — no accounts or passwords required. Share via WhatsApp, email, or any messaging channel.
            </p>
            <div className="bg-zinc-50 border border-zinc-200 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Operating Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>Open any document detail page.</li>
                <li>Click <strong>Copy Public Portal Link</strong> to copy the secure 64-character token URL for sharing via WhatsApp or messaging.</li>
                <li>Or click <strong>Dispatch via Email</strong> to send a styled Resend HTML email with your shop logo and brand color CTA button.</li>
                <li>The client portal shows the full document, payment status, remittance details, and a <strong>Download PDF</strong> button — all without logging in.</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 6: PAYMENT CHANNELS */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-6" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-black text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-sm shrink-0">[MODULE 06]</span>
              <h2 className="text-xl font-bold uppercase font-sans">Recording Payment Channels &amp; Remittance Ref #</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Record payment settlement destinations and transaction reference codes for full payment audit trails visible on the document, client portal, PDF, and email.
            </p>
            <div className="bg-zinc-50 border border-zinc-200 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Operating Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>In the Document Status Panel on any document detail page, locate the <strong>Mark as Paid</strong> section.</li>
                <li>Select <strong>Payment Channel</strong>: Bank Account, M-Pesa (Till/Paybill), Cash, Cheque, or Other.</li>
                <li>Enter the transaction reference code (e.g. M-Pesa: <code>QAB71239X</code> or Bank Ref: <code>FT261900123</code>).</li>
                <li>Click <strong>Mark as PAID</strong> to finalize. Payment details appear on the document, client portal, PDF, and outbound emails. For invoices, this also triggers stock deduction.</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 7: KRA 20TH VAT TRACKER */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-7" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-black text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-sm shrink-0">[MODULE 07]</span>
              <h2 className="text-xl font-bold uppercase font-sans">Statutory KRA 20th Monthly VAT Return Tracker</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              In Kenya, monthly VAT returns must be remitted on iTax before the <strong>20th of every month</strong>. Manna Books auto-aggregates all VAT figures for you.
            </p>
            <div className="bg-zinc-50 border border-zinc-200 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Operating Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>Open <strong>[08] Analytics</strong> in the workspace sidebar.</li>
                <li>Locate the <strong>KRA eTIMS VAT Return Tracker</strong> banner — it always shows the current calendar month&apos;s figures regardless of the timeframe filter.</li>
                <li>The countdown badge is color-coded: <span className="text-emerald-700 font-bold">Green</span> (&gt;10 days), <span className="text-amber-700 font-bold">Amber</span> (&lt;10 days), <span className="text-rose-700 font-bold">Red</span> (&lt;5 days).</li>
                <li>Use the four VAT figures — <strong>Output VAT (16%)</strong>, <strong>Taxable Sales Volume</strong>, <strong>0% Zero-Rated Volume</strong>, and <strong>Exempt Volume</strong> — to fill in your iTax monthly return directly.</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 8: ANALYTICS & A/R AGING */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-8" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-black text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-sm shrink-0">[MODULE 08]</span>
              <h2 className="text-xl font-bold uppercase font-sans">Financial Intelligence &amp; A/R Aging Matrix</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Real-time visibility into operating cash flows, profitability margins, overdue client receivables, product velocity, and client LTV ranking.
            </p>
            <div className="bg-zinc-50 border border-zinc-200 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Operating Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>Open <strong>[08] Analytics</strong> in the workspace sidebar.</li>
                <li>Use the <strong>Scope Horizon</strong> timeframe tabs to filter metrics: This Month, Last Month, This Quarter, This Year, or All Time.</li>
                <li>Review the <strong>COGS &amp; Gross Profit Intelligence</strong> panel to see your gross margin % and how much of your revenue is profit vs. cost.</li>
                <li>Inspect the <strong>Monthly Cash Flow Timeline</strong> chart — hover bars to see exact inflow/outflow figures per month.</li>
                <li>Review the <strong>A/R Aging Risk Matrix</strong> (0–30, 31–60, 61–90, 90+ days) to identify high-risk overdue collection accounts.</li>
                <li>Check the <strong>Product Sales Velocity</strong> and <strong>Client LTV</strong> leaderboards to understand what drives your revenue.</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 9: STATUTORY PAYROLL */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-9" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-black text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-sm shrink-0">[MODULE 09]</span>
              <h2 className="text-xl font-bold uppercase font-sans">Statutory Payroll &amp; Wage Compiler</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Execute full Kenyan statutory payroll runs. Automatically computes PAYE, SHIF (2.75%), AHL (1.5%), and NSSF Tier I &amp; II. Generates official A4 Landscape PDF payroll vouchers.
            </p>
            <div className="bg-zinc-50 border border-zinc-200 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Operating Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>Navigate to <strong>[06] Employee Directory</strong> and register all staff with their National ID and KRA PIN.</li>
                <li>Open <strong>[07] Payroll Vouchers</strong> and click <strong>+ New Payroll Run</strong>.</li>
                <li>Select a <strong>Pay Period</strong> (e.g. July 2026) and add employees to the run.</li>
                <li>Enter each employee&apos;s <strong>Base Salary</strong>, <strong>Allowances</strong>, <strong>Commission</strong>, and any <strong>Advance Recoveries</strong>. The system automatically computes statutory deductions.</li>
                <li>Save as <strong>DRAFT</strong> to review, or click <strong>Lock &amp; Pay</strong> to finalize the run at PAID status.</li>
                <li>Download the <strong>A4 Landscape PDF Payroll Voucher</strong> featuring 11 unbundled breakdown columns for each employee.</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 10: MULTI-LOCATION STOCK TRANSFERS */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-10" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-black text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-sm shrink-0">[MODULE 10]</span>
              <h2 className="text-xl font-bold uppercase font-sans">Multi-Location Inventory &amp; Stock Transfers</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Define multiple locations (stores, warehouses, branches) and move products between them with dual-step dispatch and receipt validation.
            </p>
            <div className="bg-zinc-50 border border-zinc-200 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Operating Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>Create stock locations at <strong>Inventory &rarr; Locations</strong>. Mark one as the Default.</li>
                <li>To perform a transfer, navigate to <strong>Inventory &rarr; Transfers &rarr; New Transfer</strong>. Select the source (From) and destination (To) locations.</li>
                <li>Add lines for the products and requested quantities. Save to create a <strong>DRAFT</strong> transfer.</li>
                <li>To dispatch, click <strong>🚚 Dispatch Transfer</strong>. This immediately writes a <code>TRANSFER_OUT</code> ledger entry and deducts stock from the source warehouse. The status moves to <strong>IN_TRANSIT</strong>.</li>
                <li>When the shipment arrives, open the transfer and click <strong>✅ Confirm Receipt</strong>. Enter the received quantities (supports partial arrivals). This writes a <code>TRANSFER_IN</code> entry and credits stock to the destination.</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 11: SHARED B2B INBOX & INTERCOMPANY ROUTING */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-11" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-black text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-sm shrink-0">[MODULE 11]</span>
              <h2 className="text-xl font-bold uppercase font-sans">Shared B2B Inbox &amp; Intercompany Routing</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Route invoices and procurement documents between workspaces (e.g. from parent to division) directly using strict KRA PIN and Email matching, skipping email downloads.
            </p>
            <div className="bg-zinc-50 border border-zinc-200 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Operating Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>Ensure the target division/workspace is registered in your client or supplier directory with their matching KRA PIN and Business Email.</li>
                <li>Create an invoice or LPO, and set the recipient.</li>
                <li>In the document details page, click **Send via Manna Network** to route the document instantly.</li>
                <li>The receiving division opens **Shared Inbox** in their workspace. The document will appear as a pending incoming item.</li>
                <li>Click **Accept &amp; Convert to Expense** (for invoices) or **Convert to Sale** (for LPOs). The invoice fields populate automatically, and a read receipt is sent back to the sender.</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 12: PWA APPLIANCE */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-12" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-black text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-sm shrink-0">[MODULE 12]</span>
              <h2 className="text-xl font-bold uppercase font-sans">Installing the Standalone PWA Appliance</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Install Manna Books directly to your Windows, Mac, Android, or iOS device as a standalone app with offline fallback resilience.
            </p>
            <div className="bg-zinc-50 border border-zinc-200 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Installation Steps:</h4>
              <ul className="list-disc list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li><strong>Chrome / Edge / Windows / Mac:</strong> Click the <strong>📲 Install App</strong> prompt in the bottom-right corner, or use the install icon in your browser address bar.</li>
                <li><strong>iOS Safari (iPhone / iPad):</strong> Tap the <strong>Share</strong> icon in Safari, then select <strong>Add to Home Screen</strong>.</li>
                <li><strong>Android Chrome:</strong> Tap the three-dot menu and select <strong>Add to Home Screen</strong> or <strong>Install App</strong>.</li>
              </ul>
            </div>
          </section>

          {/* CTA */}
          <div className="border-t border-zinc-200 pt-10 space-y-4 text-center">
            <p className="font-sans text-sm text-zinc-600">Ready to get started with Manna Books?</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center font-mono text-xs">
              <Link href="/signup" className="btn-primary-modern px-8 py-3.5 font-bold uppercase tracking-wider">
                Initialize Free Workspace →
              </Link>
              <Link href="/features" className="btn-secondary-modern px-8 py-3.5 font-semibold uppercase tracking-wider">
                View All Features
              </Link>
            </div>
          </div>

        </main>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200/80 px-6 py-8 flex flex-col sm:flex-row justify-between items-center bg-zinc-50 text-xs text-zinc-500 font-mono gap-4">
        <p>© 2026 Manna Books LTD. All rights reserved. Powered by <Link href="https://corbantechnologies.org/" target="_blank" className="hover:underline text-black font-bold">Corban Technologies LTD</Link></p>
        <div className="flex gap-6">
          <Link href="/terms" className="hover:underline hover:text-black">Terms</Link>
          <Link href="/privacy" className="hover:underline hover:text-black">Privacy</Link>
        </div>
      </footer>

    </div>
  );
}
