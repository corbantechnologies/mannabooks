// src/app/guide/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/PublicNavbar";

export const metadata: Metadata = {
  title: "Operator Guide | Manna Books — How to Use KRA eTIMS Invoicing, Payroll, POS, RBAC & Inventory",
  description:
    "Step-by-step operator manual for Manna Books. Learn how to issue KRA eTIMS invoices, manage quotation expiry, share digital catalogs, run statutory payroll, manage walk-in POS sales, reconcile multi-location inventory, configure staff RBAC, automate monthly 20th VAT returns, and inspect double-entry general ledgers.",
  keywords: [
    "Manna Books guide",
    "KRA eTIMS invoicing tutorial Kenya",
    "digital product catalog guide Kenya",
    "statutory payroll guide Kenya",
    "POS sales Kenya",
    "inventory reconciliation Kenya",
    "staff permissions RBAC Kenya",
    "in-app notifications Kenya",
    "quotation expiry tutorial Kenya",
    "20th VAT return Kenya tutorial",
    "general ledger double entry guide Kenya",
    "mannabooks.co.ke guide",
    "how to use Manna Books",
  ],
  openGraph: {
    title: "Operator Guide | Manna Books — KRA eTIMS, Payroll, Catalog & Analytics",
    description: "Complete step-by-step guide for Manna Books: eTIMS invoicing, digital product catalogs, statutory payroll, walk-in POS, inventory reconciler, staff RBAC, VAT return automation, and double-entry accounting.",
    url: "https://mannabooks.co.ke/guide",
    siteName: "Manna Books",
    locale: "en_KE",
    type: "article",
  },
  alternates: {
    canonical: "https://mannabooks.co.ke/guide",
  },
};

const GUIDE_MODULES = [
  { href: "#module-0", label: "[00] Walk-in POS Terminal" },
  { href: "#module-1", label: "[01] Workspace & Multi-Currency" },
  { href: "#module-2", label: "[02] Staff & Granular RBAC" },
  { href: "#module-3", label: "[03] In-App Notifications Bell" },
  { href: "#module-4", label: "[04] Product Catalog & Rate Cards" },
  { href: "#module-5", label: "[05] Inventory & 1-Click Reconciler" },
  { href: "#module-6", label: "[06] Client & Supplier Directory" },
  { href: "#module-7", label: "[07] Fiscal Invoices & Quote Expiry" },
  { href: "#module-8", label: "[08] Portals & Quote Amendments" },
  { href: "#module-9", label: "[09] Payment Channels & Remittances" },
  { href: "#module-10", label: "[10] KRA 20th VAT Tracker" },
  { href: "#module-11", label: "[11] Advanced Analytics & Leaderboard" },
  { href: "#module-12", label: "[12] Statutory Payroll" },
  { href: "#module-13", label: "[13] Shared B2B Inbox" },
  { href: "#module-14", label: "[14] General Ledger & Budgets" },
  { href: "#module-15", label: "[15] PWA Appliance" },
  { href: "#module-16", label: "[16] Bank & M-Pesa Reconciliation" },
  { href: "#module-17", label: "[17] Compound Multi-Line Journals" },
  { href: "#module-18", label: "[18] Accounts Payable & Vendor Bills" },
  { href: "#module-19", label: "[19] Fiscal Periods & Month Closing" },
  { href: "#module-20", label: "[20] High-Volume Bulk Operations" },
  { href: "#module-21", label: "[21] Report Exports & Statements" },
  { href: "#module-22", label: "[22] CRM & Deals Pipeline" },
  { href: "#module-23", label: "[23] Interactive Proposals & e-Sign" },
  { href: "#module-24", label: "[24] Retainer Contracts & Projects" },
  { href: "#module-25", label: "[25] Multi-Branch Staff & Scoped Roles" },
  { href: "#module-26", label: "[26] Unified Corporate Approvals" },
  { href: "#module-27", label: "[27] Storage Bins & FEFO Expiry Risk" },
  { href: "#module-28", label: "[28] BOM & Light Manufacturing" },
  { href: "#module-29", label: "[29] Stocktake Audit & Reconciliation" },
];

export default function PublicOperatorGuidePage() {
  return (
    <div className="flex-1 flex flex-col bg-white text-black selection:bg-[#064e3b] selection:text-white font-sans min-h-screen">

      <PublicNavbar />

      {/* DOCUMENTATION CONTENT BODY */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full bg-white">

        {/* STICKY LEFT SIDEBAR — TABLE OF CONTENTS (desktop only) */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-zinc-200/80 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto p-6 space-y-6 bg-white">
          <div className="space-y-1">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#064e3b] font-semibold block mb-3">Contents</span>
            <nav className="flex flex-col gap-1 font-mono text-xs font-semibold uppercase">
              {GUIDE_MODULES.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 text-zinc-600 border border-transparent rounded hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#064e3b] transition-all block text-[10px] tracking-wider"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* MAIN DOCUMENTATION BODY */}
        <main className="flex-1 min-w-0 p-6 md:p-10 space-y-12 font-mono text-xs bg-white">

          {/* GUIDE TITLE HEADER */}
          <div className="border-b border-zinc-200/80 pb-8 space-y-4">
            <div className="inline-block border border-emerald-200 px-3.5 py-1 text-[10px] font-mono uppercase tracking-widest bg-emerald-50 rounded-full font-semibold text-[#064e3b]">
              Official Operator Manual // Version 2026.8
            </div>
            <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tight font-sans text-black">
              Manna Books Platform Guide &amp; Operating Specifications
            </h1>
            <p className="font-sans text-sm text-zinc-600 max-w-2xl leading-relaxed">
              Step-by-step documentation for managing workspaces, issuing eTIMS invoices, tracking quotation validity, sharing digital product catalogs, running POS counter sales, reconciling multi-location stock, configuring staff RBAC, managing statutory payroll, and inspecting double-entry accounting ledgers.
            </p>

            {/* MOBILE INDEX (shown on mobile only) */}
            <div className="lg:hidden border border-emerald-200 rounded-xl p-5 space-y-3 mt-4 bg-emerald-50/30">
              <span className="font-bold text-[#064e3b] uppercase text-xs block font-sans">Documentation Index</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-semibold text-[10px] uppercase">
                {GUIDE_MODULES.map((item) => (
                  <a key={item.href} href={item.href} className="hover:underline text-zinc-800 hover:text-[#064e3b]">{item.label}</a>
                ))}
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 0: WALK-IN POS TERMINAL */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-0" className="space-y-4 scroll-mt-20">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 00]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">Walk-in POS Counter Terminal</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              The dedicated walk-in sales counter for point-of-sale transactions that require no client record. Generates an official PAID receipt and automatically decrements stock.
            </p>
            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Operating Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>Navigate to <strong>[02] Walk-in Sales</strong> in the workspace sidebar.</li>
                <li>Use the <strong>Catalog Quick Picker</strong> to search items by name or SKU. Click an item to add it to the basket — a badge shows the quantity already added.</li>
                <li>Adjust quantities using the <strong>+ / −</strong> buttons or type directly into the quantity field in the basket panel.</li>
                <li>Select the payment method: <strong>M-Pesa</strong> (enter transaction ref), <strong>Cash</strong> (enter amount received for change calculation), or <strong>Bank/Card</strong>.</li>
                <li>Click <strong>⚡ Complete Sale &amp; Print Receipt</strong>. An official PAID receipt is generated, stock is decremented in real-time, and the <strong>POS Thermal Slip Modal</strong> opens immediately.</li>
                <li>Choose your roll width (<strong>58mm</strong> for 2-inch mini printers or <strong>80mm</strong> for standard 3-inch POS printers) and click <strong>🖨️ Print Ticket</strong>.</li>
                <li>You can also reprint thermal slips at any time from any Receipt or Invoice by opening the document and clicking <strong>🖨️ Thermal Slip</strong> in the Document Status Panel.</li>
              </ol>
            </div>

            {/* THERMAL PRINTER & SILENT KIOSK PRINTING SETUP */}
            <div className="bg-zinc-950 border border-emerald-900/60 text-white p-5 rounded-xl font-mono text-[11px] space-y-3">
              <div className="text-emerald-300 font-bold uppercase text-xs flex items-center gap-1.5">
                <span>🖨️</span>
                <span>Thermal Printer Setup &amp; Zero-Click Silent Kiosk Printing</span>
              </div>
              <div className="text-zinc-300 font-sans text-xs space-y-2 leading-relaxed">
                <p>
                  <strong>Standard Browser Printing:</strong> When you click <em>Print Ticket</em> for the first time, your browser (Chrome/Edge) will prompt you to select your thermal printer (e.g. <em>Xprinter 80mm</em>, <em>Epson TM-T20</em>, <em>POS-58</em>). The browser remembers your choice for all future sales so you can print with 1 keystroke.
                </p>
                <p>
                  <strong>Retail Zero-Click Silent Printing (Kiosk Mode):</strong> For high-traffic retail counters where receipts must print immediately without any confirmation dialog:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-zinc-400 font-mono text-[10px] pl-2">
                  <li>Set your thermal printer as the <strong>Default Printer</strong> in Windows/Mac settings.</li>
                  <li>Right-click your Google Chrome desktop shortcut &rarr; select <strong>Properties</strong>.</li>
                  <li>In the <strong>Target</strong> field, add <code>--kiosk-printing</code> to the end (e.g. <code>chrome.exe --kiosk-printing</code>).</li>
                  <li>Launch Chrome using this shortcut. All receipt print commands will now fire directly and silently to the printer with zero popups!</li>
                </ol>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-700 text-white p-4 rounded-xl font-mono text-[10px] space-y-1">
              <div className="text-amber-300 font-bold uppercase">STOCK LOCKOUT SAFETY</div>
              <p>Out-of-stock items are automatically blocked (dimmed and disabled) in the catalog picker. The basket also prevents checking out if the requested quantity exceeds physical inventory on hand.</p>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 1: PROVISIONING WORKSPACE & MULTI-CURRENCY */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-1" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 01]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">Provisioning Workspaces &amp; Multi-Currency FX</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Manna Books supports multi-tenancy. Operate multiple business profiles under a single user account. Each workspace has its own brand color, logo, documents, products, and foreign currency exchange rates.
            </p>
            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Operating Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>Navigate to <strong>System Settings</strong> in the workspace navigation.</li>
                <li>Enter your <strong>Business Name</strong>, <strong>KRA Tax PIN</strong>, <strong>Phone Number</strong>, <strong>Short Name</strong>, and <strong>Website URL</strong>.</li>
                <li>Upload your shop logo asset to Cloudinary via the logo upload button.</li>
                <li>Select your shop&apos;s <strong>Primary Theme Hex Color</strong> (e.g. Emerald Green <code>#064e3b</code> or Navy Blue <code>#1e3a8a</code>). This color auto-styles action buttons, invoice portals, vector PDFs, and Resend emails.</li>
                <li>To enable foreign currency billing, visit <strong>Settings &rarr; Multi-Currency</strong> to configure exchange rates for USD, EUR, GBP, or regional currencies.</li>
                <li>Click <strong>Commit Changes</strong> to save.</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 2: STAFF MANAGEMENT & GRANULAR RBAC */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-2" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 02]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">Staff Management &amp; Role-Based Permissions (RBAC)</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Control workspace access with server-enforced RBAC. Invite cashiers, sales staff, managers, and accountants with customized operational scopes.
            </p>
            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Managing Roles &amp; Permissions:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>Navigate to <strong>Settings &rarr; Staff &amp; Permissions</strong> (or <code>/workspaces/[slug]/team</code>).</li>
                <li>Click <strong>+ Add Member</strong> and enter the employee&apos;s registered email address.</li>
                <li>Select the target role: <strong>Viewer</strong> (Read Only), <strong>Employee</strong> (Custom Granular), <strong>Accountant</strong> (Financials), <strong>Manager</strong> (Operational), or <strong>Admin</strong>.</li>
                <li>For <strong>Employee</strong> accounts, check the exact permissions permitted:
                  <ul className="list-disc list-inside pl-4 pt-1 space-y-1 text-xs text-zinc-600 font-mono">
                    <li><code>[✓] Can Create Documents (Invoices, Quotations, Receipts)</code></li>
                    <li><code>[✓] Can Edit Clients &amp; Directory</code></li>
                    <li><code>[✓] Can View Finance, Ledgers &amp; Analytics</code></li>
                    <li><code>[✓] Can Export Reports &amp; Summaries</code></li>
                    <li><code>[✓] Can Manage Product Catalog &amp; Stock</code></li>
                    <li><code>[✓] Can Manage Payroll &amp; Staff Wages</code></li>
                  </ul>
                </li>
                <li>To modify an existing member&apos;s role or toggle permissions, click <strong>Edit</strong> next to their name to open the live configuration modal.</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 3: IN-APP ACTIVITY BELL */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-3" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 03]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">In-App Notifications &amp; Activity Bell</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Real-time workspace activity stream in the top navigation bar with unread count badges.
            </p>
            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Notification Features:</h4>
              <ul className="list-disc list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li><strong>Quotation Acceptance:</strong> Real-time alerts when a customer signs and accepts a quotation on the public portal.</li>
                <li><strong>Quotation Amendments:</strong> Alerts when a client requests scope or price updates before accepting.</li>
                <li><strong>Overdue Invoices:</strong> Automated warnings when invoices surpass payment terms.</li>
                <li><strong>Quotation Expiry:</strong> Alerts when quotes expire and are cancelled by automated sweeps.</li>
                <li><strong>Low Stock Warnings:</strong> Instant alerts when tracked products fall below reorder thresholds.</li>
                <li>Click any notification to navigate directly to the affected document and automatically mark the alert as read.</li>
              </ul>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 4: PRODUCT CATALOG & RATE CARDS */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-4" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 04]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">Product Catalog, Curated Selection &amp; Shareable Rate Cards</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Register products and services with COGS cost tracking. Share your complete digital catalog or select specific models (curated lists) with prospective clients so they can browse specifications and request quotations before formal billing.
            </p>
            
            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Sharing Curated Product Lists with Clients:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>On the Product Catalog table, <strong>check the boxes <code>[✓]</code></strong> next to the specific products you want to share.</li>
                <li>In the top selection toolbar, click <strong>🔗 Share Selected (X)</strong> to copy a compact token link (<code>/portal/catalog/[slug]?token=...</code>) containing only those models.</li>
                <li>Click <strong>💬 WhatsApp</strong> to send a pre-filled invitation directly to the client.</li>
                <li>Click <strong>📧 Email</strong> to send a styled quotation preview directly to the customer&apos;s inbox.</li>
                <li>Or click <strong>📄 Download PDF Price Card</strong> inside the Share modal to export a clean, branded PDF rate card.</li>
                <li>When the client opens the link, they browse specifications and prices (cost margins remain hidden), pick quantities, and click <strong>&quot;Submit Quote Request&quot;</strong> — automatically creating an ISSUED Quotation in your dashboard!</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 5: INVENTORY & DISCREPANCY RECONCILER */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-5" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 05]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">Multi-Location Inventory, Discrepancy Reconciler &amp; LPO Receiving</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Define physical stock locations (warehouses, stores, branches) and track products across them with a real-time, double-entry audit trail ledger.
            </p>
            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Operating Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>Create stock locations at <strong>Inventory &rarr; Locations</strong>. Mark one as the Default.</li>
                <li><strong>Automatic Catalog Sync:</strong> Updating catalog stock counts automatically synchronizes location stock and writes an audit ledger entry.</li>
                <li><strong>1-Click Discrepancy Reconciler:</strong> If quantities ever diverge, click <strong>&quot;⚡ Reconcile Inventory &amp; Location Stock&quot;</strong> on the Inventory or Locations page to re-align all balances instantly.</li>
                <li><strong>Receiving Supplier Goods:</strong> Open an issued LPO, PO, or GRN and click <strong>&quot;📦 Goods Delivered? Mark as Received&quot;</strong> to automatically credit physical stock inflow.</li>
                <li><strong>Stock Transfers:</strong> Move stock between locations with in-transit lifecycle validation (Dispatch &rarr; Confirm Receipt).</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 6: CLIENT & SUPPLIER DIRECTORY */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-6" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 06]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">Client &amp; Supplier Directory Management</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Store client and supplier entities with KRA Tax PINs for statutory compliance. View client lifetime value (LTV) rankings and download complete running Statements of Account.
            </p>
            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Operating Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>Open <strong>Client Flow</strong> or <strong>Supplier Network</strong>.</li>
                <li>Click <strong>+ Register Client</strong> or <strong>+ Register Supplier</strong>.</li>
                <li>Select the Entity Type: <strong>Individual</strong> (Personal PIN e.g. A...) or <strong>Corporate</strong> (Company PIN e.g. P...).</li>
                <li>Toggle <strong>Requires eTIMS</strong> if this entity needs KRA eTIMS CU serial numbers embedded on their documents.</li>
                <li>From the client/supplier detail page, you can issue billing documents or procurement LPOs directly.</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 7: FISCAL INVOICES & QUOTATION EXPIRY */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-7" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 07]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">Issuing Fiscal Invoices, Receipts, Taxes &amp; Quotation Expiry</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Generate all outbound sales documents, procurement orders, and credit notes. Multi-rate tax (16% VAT, 0% Zero-Rated, Exempt) is handled per line item with dedicated VAT line display above Grand Total.
            </p>
            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Operating Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>Click <strong>+ Issue Document</strong> from the Fiscal Ledgers stream.</li>
                <li>Select the <strong>Document Type</strong>: Invoice, Receipt, Quotation, LPO, PO, Delivery Note, Credit Note, Debit Note, GRN, or Payment Voucher.</li>
                <li>When issuing a <strong>Quotation</strong>, select a validity expiry preset (<strong>+7d</strong>, <strong>+14d</strong>, <strong>+30d</strong>, <strong>+60d</strong>) or pick a custom date.</li>
                <li>Add line items. Set the tax rate per row: <code>V_16 (16%)</code>, <code>V_0 (0%)</code>, or <code>EXEMPT</code>. 16% VAT calculates and appears on its dedicated line right above Grand Total.</li>
                <li>(Optional) Enter the statutory <strong>KRA eTIMS Control Unit (CU) Serial Number</strong>.</li>
                <li>For <strong>Credit Notes</strong>, link the parent invoice if crediting against receivables, or issue as a standalone cash refund.</li>
                <li>Click <strong>Publish Ledger Document</strong>.</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 8: PASSWORDLESS PORTALS */}
          {/* ─────────────────────────────────────────── */}
          {/* ─────────────────────────────────────────── */}
          {/* MODULE 8: PASSWORDLESS PORTALS */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-8" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 08]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">Passwordless Client Portals, E-Signatures &amp; Telemetry</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Eliminate client friction. Every commercial document (Quotation, Tax Invoice, Receipt, Delivery Note, Payment Voucher) is equipped with a secure, unguessable 64-character cryptographic token URL (<code>/portal/invoice/[token]</code>). Clients access their branded document instantly on any mobile phone, tablet, or desktop without needing to create an account, install an app, or remember a password.
            </p>

            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-4 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">How Operators Direct Clients to Their Portals:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>
                  <strong>Locate the Document:</strong> Open any issued Quotation or Invoice from <strong>Fiscal Ledgers</strong> (or from the client&apos;s transaction history).
                </li>
                <li>
                  <strong>Copy the Portal Link:</strong> In the upper-right <em>Document Status Panel</em>, click the <strong>Share &amp; Export</strong> dropdown and select <strong>&quot;🔗 Copy Portal Link&quot;</strong>. A green confirmation toast confirms the 64-character link is copied to your clipboard.
                </li>
                <li>
                  <strong>Direct via WhatsApp or SMS:</strong> Paste the link directly into your WhatsApp chat or SMS. When pasted into WhatsApp, the message automatically generates a rich preview with your business name and document reference.
                </li>
                <li>
                  <strong>Direct via Branded Email:</strong> Alternatively, click <strong>&quot;📧 Dispatch via Email&quot;</strong> to send an automated, responsive HTML email displaying your company logo, greeting, and a prominent <em>&quot;View &amp; Settle Online&quot;</em> action button.
                </li>
              </ol>

              <div className="border-t border-emerald-100 pt-3 space-y-3">
                <h5 className="font-bold uppercase text-black text-xs">What the Client Sees &amp; Can Do:</h5>
                <ul className="list-disc list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                  <li>
                    <strong>Custom Brand Identity:</strong> Displays your official business logo, corporate letterhead, contact details, KRA Tax PIN, and your configured primary brand color.
                  </li>
                  <li>
                    <strong>Settlement Channels &amp; Payment Details:</strong> The portal automatically embeds your active settlement instructions (configured under <em>Workspace Settings &rarr; Payment Methods</em>), displaying your <strong>M-Pesa Till / Paybill number &amp; Account</strong> and <strong>Commercial Bank details</strong> (Bank Name, Branch, Account Number, SWIFT/BIC) so the customer can pay immediately.
                  </li>
                  <li>
                    <strong>Official KRA eTIMS QR Verification:</strong> Renders a live scannable QR code that clients and corporate tax auditors can scan with any smartphone camera to verify authenticity directly on KRA tax authority servers.
                  </li>
                  <li>
                    <strong>1-Click Quotation Acceptance &amp; Amendments:</strong> On quotations, clients can click <strong>&quot;Accept Quotation&quot;</strong> to confirm the deal with optional notes (transitioning the quote to <code>CONFIRMED</code>), or click <strong>&quot;Request Changes&quot;</strong> to submit scope/rate adjustments without calling.
                  </li>
                  <li>
                    <strong>Quotation Expiry Safeguard:</strong> If the quote has passed its validity date, the acceptance button is automatically locked, and the portal displays an amber notice with a 1-click <em>&quot;Request Updated Quote&quot;</em> action.
                  </li>
                  <li>
                    <strong>Instant Vector PDF Downloads:</strong> Clients can click <strong>&quot;Download PDF&quot;</strong> to get an ultra-crisp, letterhead-formatted vector PDF for their internal procurement records.
                  </li>
                </ul>
              </div>

              <div className="border-t border-emerald-100 pt-3 space-y-2">
                <h5 className="font-bold uppercase text-black text-xs">Real-Time Operator Telemetry &amp; Alerts:</h5>
                <p className="text-zinc-700 font-sans text-sm leading-relaxed">
                  Manna Books tracks client engagement in real time. As soon as the client opens their portal link, the database records the view timestamp, and an emerald <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">👁️ Portal Viewed</span> badge illuminates on the document in your workspace. When a client accepts a quote or requests revisions, an instant alert triggers in the top navigation activity bell.
                </p>
              </div>

              <div className="border-t border-emerald-100 pt-3 space-y-2">
                <h5 className="font-bold uppercase text-black text-xs">Public Digital Catalog Portal (<code>/portal/catalog/[slug]</code>):</h5>
                <p className="text-zinc-700 font-sans text-sm leading-relaxed">
                  Direct prospective buyers to your live digital product &amp; services showcase. Send clients your public catalog URL where they can browse hardware specifications, service rate cards, inventory availability, and standard commercial payment terms.
                </p>
              </div>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 9: PAYMENT CHANNELS */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-9" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 09]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">Recording Payment Channels &amp; Remittance Ref #</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Record payment settlement destinations and transaction reference codes for full payment audit trails visible on the document, client portal, PDF, and email.
            </p>
            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
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
          {/* MODULE 10: KRA 20TH VAT TRACKER */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-10" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 10]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">Statutory KRA 20th Monthly VAT Return Tracker</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              In Kenya, monthly VAT returns must be remitted on iTax before the <strong>20th of every month</strong>. Manna Books auto-aggregates all VAT figures for you.
            </p>
            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Operating Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>Open <strong>Financial Analytics</strong> in the workspace navigation.</li>
                <li>Locate the <strong>KRA eTIMS VAT Return Tracker</strong> banner — it always shows the current calendar month&apos;s figures.</li>
                <li>The countdown badge is color-coded: <span className="text-emerald-700 font-bold">Green</span> (&gt;10 days), <span className="text-amber-700 font-bold">Amber</span> (&lt;10 days), <span className="text-rose-700 font-bold">Red</span> (&lt;5 days).</li>
                <li>Use the four VAT figures — <strong>Output VAT (16%)</strong>, <strong>Taxable Sales Volume</strong>, <strong>0% Zero-Rated Volume</strong>, and <strong>Exempt Volume</strong> — to fill in your iTax monthly return directly.</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 11: ADVANCED ANALYTICS & LEADERBOARDS */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-11" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 11]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">Financial Intelligence, Rolling Trajectories &amp; Leaderboards</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Real-time executive intelligence across cash flow streams, profitability margins, quotation conversion funnels, top 10 clients leaderboard, and accounts receivable aging risk.
            </p>
            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Operating Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>Open <strong>Financial Analytics</strong> in the workspace navigation.</li>
                <li>Toggle the <strong>Rolling Timeline Horizon</strong> between <strong>6 Months</strong> and <strong>12 Months</strong> to analyze cash flow momentum.</li>
                <li>Inspect the <strong>Top 10 Clients Leaderboard</strong> to see customer revenue share and LTV progress bars.</li>
                <li>Review the <strong>Product vs Service Split</strong> visualizer and the <strong>Quotation Conversion Funnel</strong>.</li>
                <li>Review the <strong>A/R Aging Risk Matrix</strong> (0–30, 31–60, 61–90, 90+ days) to identify high-risk overdue collection accounts.</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 12: STATUTORY PAYROLL */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-12" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 12]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">Statutory Payroll &amp; Wage Compiler</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Execute full Kenyan statutory payroll runs. Automatically computes PAYE, SHIF (2.75%), AHL (1.5%), and NSSF Tier I &amp; II. Generates official A4 Landscape PDF payroll vouchers.
            </p>
            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Operating Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>Navigate to <strong>Employee Directory</strong> and register all staff with their National ID and KRA PIN.</li>
                <li>Open <strong>Payroll Vouchers</strong> and click <strong>+ New Payroll Run</strong>.</li>
                <li>Select a <strong>Pay Period</strong> (e.g. August 2026) and add employees to the run.</li>
                <li>Enter each employee&apos;s <strong>Base Salary</strong>, <strong>Allowances</strong>, <strong>Commission</strong>, and any <strong>Advance Recoveries</strong>. The system automatically computes statutory deductions.</li>
                <li>Save as <strong>DRAFT</strong> to review, or click <strong>Lock &amp; Pay</strong> to finalize the run at PAID status.</li>
                <li>Download the <strong>A4 Landscape PDF Payroll Voucher</strong> featuring 11 unbundled breakdown columns for each employee.</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 13: SHARED B2B INBOX */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-13" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 13]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">Shared B2B Inbox &amp; Intercompany Routing</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Route invoices and procurement documents between workspaces (e.g. from parent to division) directly using strict KRA PIN and Email matching, skipping email downloads.
            </p>
            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Operating Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>Ensure the target division/workspace is registered in your client or supplier directory with their matching KRA PIN and Business Email.</li>
                <li>Create an invoice or LPO, and set the recipient.</li>
                <li>In the document details page, click <strong>Send via Manna Network</strong> to route the document instantly.</li>
                <li>The receiving division opens <strong>Shared Inbox</strong> in their workspace. The document will appear as a pending incoming item.</li>
                <li>Click <strong>Accept &amp; Convert to Expense</strong> (for invoices) or <strong>Convert to Sale</strong> (for LPOs).</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 14: GENERAL LEDGER, BUDGETS & DIAGNOSTICS */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-14" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 14]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">General Ledger, Operating Budgets &amp; Diagnostics</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Double-entry bookkeeping suite. Manage your chart of accounts, multi-month operating budgets, inspect accounting periods down to the journal entry, and perform clean slate factory resets with automated backup exports.
            </p>
            
            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Operating Budgets &amp; Month Cloning:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>Navigate to <strong>Finance &rarr; Operating Budgets</strong>.</li>
                <li>Use the <strong>Month &amp; Year Navigation Bar</strong> (<code>← Prev Month</code> / <code>Next Month →</code>) to inspect budget allocations and actual spend for any calendar month.</li>
                <li>Click <strong>Copy Last Month&apos;s Budget</strong> to carry forward all category expense limits from the preceding month with 1 click.</li>
              </ol>
            </div>

            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Inspecting Monthly Accounting Periods:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>Go to <strong>Finance &rarr; Accounting Periods</strong>.</li>
                <li>Click <strong>Inspect</strong> on any open or closed month (e.g. August 2026).</li>
                <li>Review the period&apos;s Gross Revenue, Operating Expenses, Net Income, and Debits vs Credits balance check (<code>✓ Balanced 0.00 Diff</code>).</li>
                <li>Search and inspect the real-time stream of double-entry journal postings for that month.</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 15: PWA APPLIANCE */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-15" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 15]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">Installing the Standalone PWA Appliance</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Install Manna Books directly to your Windows, Mac, Android, or iOS device as a standalone app with offline fallback resilience.
            </p>
            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Installation Steps:</h4>
              <ul className="list-disc list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li><strong>Chrome / Edge / Windows / Mac:</strong> Click the <strong>📲 Install App</strong> prompt in the bottom-right corner, or use the install icon in your browser address bar.</li>
                <li><strong>iOS Safari (iPhone / iPad):</strong> Tap the <strong>Share</strong> icon in Safari, then select <strong>Add to Home Screen</strong>.</li>
                <li><strong>Android Chrome:</strong> Tap the three-dot menu and select <strong>Add to Home Screen</strong> or <strong>Install App</strong>.</li>
              </ul>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 16: BANK & M-PESA RECONCILIATION */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-16" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 16]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">Bank &amp; M-Pesa CSV Statement Reconciliation</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Upload monthly statements from your bank or M-Pesa portal and match them against internal General Ledger Account 1200 (Cash &amp; Bank) to achieve a verified KES 0.00 variance.
            </p>

            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Step-by-Step Reconciliation Workflow:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li><strong>Export Statement:</strong> Download a CSV statement from your commercial bank online portal (corporate or retail banking) or Safaricom M-Pesa Business portal.</li>
                <li><strong>Upload Statement:</strong> Navigate to <strong>Finance &rarr; Bank Reconciliation</strong>, click <strong>Upload Bank / M-Pesa Statement (CSV)</strong>, and select your file.</li>
                <li><strong>Automatic Match:</strong> The engine automatically matches statement credits (money in) against book debits, and statement debits (withdrawals) against book credits based on exact amounts and M-Pesa/check references.</li>
                <li><strong>Adjustments &amp; Balancing:</strong> Click on any unmatched row to manually pair it or click <strong>Record Adjustment</strong> to post bank fee/tax journal entries until variance reads <strong>KES 0.00</strong>.</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 17: COMPOUND MULTI-LINE JOURNALS */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-17" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 17]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">Compound Multi-Line Journal Entry Builder</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Post arbitrary N-line compound journal entries with dynamic rows, live debit/credit balancing, and optional document receipt attachments.
            </p>

            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Creating a Compound Journal Entry:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>Navigate to <strong>Finance &rarr; General Ledger</strong> and click <strong>New Journal Entry</strong>.</li>
                <li>Enter the <strong>Posting Date</strong>, <strong>Reference Code</strong>, and <strong>Master Narrative</strong>.</li>
                <li>Click <strong>+ Add Line</strong> to add as many debit or credit lines as required (e.g. 5 lines for gross salary, PAYE, NSSF, SHIF, and net pay).</li>
                <li>Use the <strong>Auto-Balance</strong> button on the final row to automatically compute the residual balancing amount.</li>
                <li>Verify that <strong>Out of Balance = KES 0.00</strong>, attach an optional PDF/receipt image, and click <strong>Post Journal Entry</strong>.</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 18: ACCOUNTS PAYABLE & VENDOR BILLS */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-18" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 18]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">Accounts Payable: Vendor Bills &amp; Remittance Advice</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Manage operating creditors (office rent, cloud services, external audit, legal) with automated Withholding Tax (WHT) deductions and payment vouchers.
            </p>

            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Vendor Bill &amp; Settlement Flow:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li><strong>Bill Entry:</strong> Go to <strong>Finance &rarr; Bills</strong> and click <strong>+ New Bill</strong>. Select the supplier, input bill date, due date, and assign expense/asset accounts.</li>
                <li><strong>Withholding Tax:</strong> Select applicable WHT rates (5% professional fees or 10% rent). The system automatically books the net vendor liability and KRA WHT Payable (2350).</li>
                <li><strong>Payables Aging:</strong> Inspect <strong>Finance &rarr; Reports &rarr; Payables Aging</strong> to track overdue vendor debts across 30, 60, and 90+ day aging buckets.</li>
                <li><strong>Payment &amp; Remittance:</strong> Authorize a disbursement to debit Accounts Payable (2100) and credit Bank (1200), generating a downloadable PDF payment voucher and emailing a remittance slip to the vendor.</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 19: FISCAL PERIODS & MONTH CLOSING */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-19" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 19]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">Fiscal Calendar, Monthly Period Closing &amp; Reopening</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Enforce strict financial governance. Set up 12-month fiscal years, lock completed months against retroactive changes, and log audit justifications for reopened periods.
            </p>

            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Period Closing &amp; Reopening Protocol:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li><strong>Declare Fiscal Year:</strong> Navigate to <strong>Finance &rarr; Accounting Periods</strong> and declare your 12-month fiscal year. The system automatically populates 12 monthly periods in <code>OPEN</code> status.</li>
                <li><strong>Month-End Closing:</strong> Once bank reconciliation and payroll postings are complete, click <strong>Close Period</strong>. Postings and edits for that calendar month are strictly locked.</li>
                <li><strong>Reopening for Adjustments:</strong> If a late invoice is discovered during an audit, an authorized admin clicks <strong>Reopen Period</strong> and submits an audit justification reason to temporarily unlock the period.</li>
                <li><strong>Year-End Sweep:</strong> When all 12 periods are closed, click <strong>Close Fiscal Year</strong> to automatically sweep net Revenue and Expenses into Retained Earnings (3300) and reset P&L accounts for the new year.</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 20: HIGH-VOLUME BULK OPERATIONS */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-20" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 20]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">High-Volume Bulk Financial Operations</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Process hundreds of customer invoices, vendor disbursements, and journal migrations without repetitive manual data entry.
            </p>

            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Executing Bulk Operations:</h4>
              <ul className="list-disc list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li><strong>Bulk Invoicing &amp; Email:</strong> On the Documents table, select multiple issued invoices using checkboxes, then click <strong>Bulk Email</strong> to dispatch personalized PDF invoices to all selected clients simultaneously.</li>
                <li><strong>Bulk PDF ZIP Export:</strong> Click <strong>Download ZIP</strong> to bundle selected client invoices or payment vouchers into a single encrypted ZIP file for board or tax audit packs.</li>
                <li><strong>Batch Vendor Payment Runs:</strong> Select approved supplier bills and click <strong>Initiate Payment Run</strong> to export formatted Bank EFT or M-Pesa B2B disbursement sheets.</li>
                <li><strong>Atomic Journal CSV Import:</strong> Upload historical journal migrations from QuickBooks or Sage with all-or-nothing transaction rollback protection.</li>
              </ul>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 21: REPORT EXPORTS & STATEMENTS */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-21" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 21]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">Financial Statements &amp; Board Report Exports</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Every financial report in Manna Books is exportable in 1 click as formula-ready CSV spreadsheets for Excel modeling or boardroom-ready PDFs.
            </p>

            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Available Financial Statement Exports:</h4>
              <ul className="list-disc list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li><strong>Trial Balance (CSV / PDF):</strong> Live debit and credit balance verification across all 1000s–6000s accounts.</li>
                <li><strong>Profit &amp; Loss / Income Statement (CSV / PDF):</strong> Filter by This Month, Last Month, Quarter, or Fiscal Year YTD.</li>
                <li><strong>Balance Sheet (CSV / PDF):</strong> Live financial position enforcing Assets = Liabilities + Equity as of any cutoff date.</li>
                <li><strong>Cash Flow Statement (CSV / PDF):</strong> Cash flows segregated into Operating, Investing, and Financing activities.</li>
                <li><strong>Client &amp; Supplier Statements (CSV / PDF):</strong> Chronological running balances with 1-click customer email delivery.</li>
              </ul>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 22: CRM & DEALS PIPELINE */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-22" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 22]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">CRM Pipeline &amp; Deal Management</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Track prospects through the visual drag-and-drop Kanban pipeline: Lead &rarr; Qualified &rarr; Proposal Sent &rarr; Negotiation &rarr; Won &rarr; Lost. Monitor weighted pipeline revenue, assign staff reps, log call/meeting activities, and link closed deals directly to Proposals, Retainers, and Projects.
            </p>
            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">CRM Capabilities:</h4>
              <ul className="list-disc list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li><strong>Interactive Kanban:</strong> Drag-and-drop deal cards between stages with live column totals and win-probability forecasts.</li>
                <li><strong>Activity Timeline:</strong> Log calls, meeting minutes, notes, and stage changes per deal.</li>
                <li><strong>Loss Reasons &amp; Win Velocity:</strong> Capture competitive loss reasons to analyze conversion bottlenecks.</li>
              </ul>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 23: INTERACTIVE PROPOSALS & E-SIGN */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-23" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 23]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">Interactive Proposals &amp; Client e-Signatures</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Create branded, tiered package proposals (e.g. Silver / Gold / Enterprise) and deliver them via passwordless 64-char public client portal links. Clients can inspect scopes of work, choose packages, draw touch/mouse signatures, request amendments, or approve with immediate notification.
            </p>
            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Proposal Features:</h4>
              <ul className="list-disc list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li><strong>Client Portal (<code className="bg-white px-1.5 py-0.5 rounded border border-zinc-200">/portal/proposal/[token]</code>):</strong> Live view tracking, amendment requests, and drawn touch/mouse signatures.</li>
                <li><strong>1-Click Conversion:</strong> Accepted proposals convert instantly into KRA eTIMS invoices or contracts with zero manual re-entry.</li>
              </ul>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 24: RETAINER CONTRACTS & PROJECTS */}
          {/* ─────────────────────────────────────────── */}
          <section id="module-24" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 24]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">Retainer Contracts, SLA Burn-Down &amp; Project Timesheets</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Manage fixed-fee or hourly retainer contracts with monthly hours burn-down ledgers. Automatically generate recurring retainer invoices and dispatch 30-day/60-day renewal alerts via the cron engine. Track project workspaces, staff billable rates, timesheet approvals, and phased milestone billing.
            </p>
            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Contracts &amp; Projects Capabilities:</h4>
              <ul className="list-disc list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li><strong>Automated Retainer Invoicing:</strong> Cron engine generates monthly invoices on the designated billing day and advances next billing dates.</li>
                <li><strong>SLA Expiry Alerts:</strong> In-app notifications and email alerts triggered 60 days and 30 days prior to contract expiration.</li>
                <li><strong>Project Milestones &amp; Timesheets:</strong> Phased milestone billing gates and staff timesheet review workflows.</li>
              </ul>
            </div>
          </section>

          {/* MODULE 25: MULTI-BRANCH STAFF & SCOPED ROLES */}
          <section id="module-25" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 25]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">Multi-Branch Staff Directory &amp; Scoped Storekeeper Roles</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Manage cross-branch organizational rosters from a single master directory. Assign specialized operational personas—Storekeepers, Cashiers, Dispatchers, Sales Reps, Accountants, and Branch Managers. Implement physical warehouse branch scoping to fence operational staff to specific locations, and toggle Cost-Price Blindness to protect sensitive vendor purchasing terms from frontline employees.
            </p>
            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Staff Governance Capabilities:</h4>
              <ul className="list-disc list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li><strong>Multi-Branch Staff Allocation:</strong> Assign a staff member to multiple branch entities with distinct roles per branch.</li>
                <li><strong>Location-Fenced Access:</strong> Storekeepers only view and interact with inventory in their assigned warehouses.</li>
                <li><strong>Cost-Price Blindness:</strong> Frontline warehouse and cashier staff cannot view purchase costs or margins.</li>
              </ul>
            </div>
          </section>

          {/* MODULE 26: UNIFIED CORPORATE APPROVALS */}
          <section id="module-26" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 26]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">Unified Corporate Approvals &amp; Requisition Engine</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Standardize multi-tier approval flows across Purchase Requisitions, Staff Expense Claims, Customer Credit Notes, and Damaged Inventory Write-offs. Set spending thresholds for automatic approvals and require structured manager decision reasons with immutable audit timelines.
            </p>
            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Corporate Approval Features:</h4>
              <ul className="list-disc list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li><strong>Automated Spending Thresholds:</strong> Auto-approve routine operational requests below customizable spending caps.</li>
                <li><strong>Audit Timeline:</strong> Chronological logging of ticket creation, status changes, decider profiles, and comments.</li>
                <li><strong>Mandatory Rejection Reasons:</strong> Rejections require structured explanations communicated directly to the requester.</li>
              </ul>
            </div>
          </section>

          {/* MODULE 27: STORAGE BINS & FEFO */}
          <section id="module-27" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 27]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">WMS Storage Bins, QR Shelving &amp; FEFO Expiry Risk</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Full warehouse management system mapping physical storage down to Zone, Rack, Shelf, and Bin. Generate and print scannable QR barcode labels for warehouse aisles and racks. Enforce First Expired, First Out (FEFO) batch pick routing and monitor multi-tier expiration aging risks to minimize inventory spoilage.
            </p>
            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">WMS Capabilities:</h4>
              <ul className="list-disc list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li><strong>Shelf-Level Slotting:</strong> Precise mapping from warehouse zone to individual shelf bins.</li>
                <li><strong>QR Barcode Printing:</strong> Instant generation of warehouse labels for physical picking locations.</li>
                <li><strong>FEFO Risk Dashboard:</strong> Automated triage into &lt;30d Critical, 30–60d Warning, and 60–90d Notice categories.</li>
              </ul>
            </div>
          </section>

          {/* MODULE 28: BOM & LIGHT MANUFACTURING */}
          <section id="module-28" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 28]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">Bill of Materials (BOM) &amp; Light Manufacturing Assemblies</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Engineer multi-part formulas with component quantities, expected scrap percentages, and allocated labor/overhead allowances. Execute one-click production orders that atomically consume raw ingredients from inventory and credit finished goods at actual capitalized unit costs.
            </p>
            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Manufacturing &amp; Assembly Features:</h4>
              <ul className="list-disc list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li><strong>Multi-Component Recipes:</strong> Define dynamic assembly recipes with scrap and wastage buffers.</li>
                <li><strong>Atomic Production Runs:</strong> 1-click execution debiting raw stock and depositing capitalized assembled goods.</li>
                <li><strong>Accurate COGS Allocation:</strong> Dynamic inclusion of material cost, direct labor, and overhead into unit inventory values.</li>
              </ul>
            </div>
          </section>

          {/* MODULE 29: STOCKTAKE AUDIT WIZARD */}
          <section id="module-29" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 29]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">Physical Stocktake Audit Wizard &amp; Discrepancy Reconciliation</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Conduct periodic cycle counts and full physical inventory reconciliations. Snapshot warehouse balances, print physical count sheets, record actual shelf quantities, and view live discrepancy quantities and costs. Reconcile with 1 click to post shrinkage journals and balance sheet inventory adjustments.
            </p>
            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Stocktake Reconciliation Features:</h4>
              <ul className="list-disc list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li><strong>System Stock Freeze:</strong> Instant snapshot of current ledger quantities across warehouse products.</li>
                <li><strong>Interactive Count Sheet:</strong> Real-time variance tracking with color-coded shortages and surpluses.</li>
                <li><strong>Automatic Adjustment Posting:</strong> Atomically generates stock ledger entries and updates on-hand balances.</li>
              </ul>
            </div>
          </section>

          {/* CTA */}
          <div className="border-t border-zinc-200 pt-10 space-y-4 text-center">
            <p className="font-sans text-sm text-zinc-600">Ready to get started with Manna Books?</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center font-mono text-xs">
              <Link href="/signup" className="btn-primary-emerald px-8 py-3.5 font-bold uppercase tracking-wider">
                Initialize Free Workspace →
              </Link>
              <Link href="/features" className="btn-secondary-emerald px-8 py-3.5 font-semibold uppercase tracking-wider">
                View All Features
              </Link>
            </div>
          </div>

        </main>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200/80 px-6 py-8 flex flex-col sm:flex-row justify-between items-center bg-zinc-50 text-xs text-zinc-500 font-mono gap-4">
        <p>© 2026 Manna Books LTD. All rights reserved. Powered by <Link href="https://corbantechnologies.org/" target="_blank" className="hover:underline text-[#064e3b] font-bold">Corban Technologies LTD</Link></p>
        <div className="flex gap-6">
          <Link href="/features" className="hover:underline hover:text-[#064e3b]">Features</Link>
          <Link href="/pricing" className="hover:underline hover:text-[#064e3b]">Pricing</Link>
          <Link href="/terms" className="hover:underline hover:text-[#064e3b]">Terms</Link>
          <Link href="/privacy" className="hover:underline hover:text-[#064e3b]">Privacy</Link>
        </div>
      </footer>

    </div>
  );
}
