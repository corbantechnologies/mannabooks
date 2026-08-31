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
          <section id="module-8" className="space-y-4 scroll-mt-20 border-t border-zinc-100 pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="bg-[#064e3b] text-white px-2.5 py-1 text-xs font-bold uppercase font-mono rounded-md shrink-0">[MODULE 08]</span>
              <h2 className="text-xl font-bold uppercase font-sans text-black">Passwordless Client Portals, Signatures &amp; Amendments</h2>
            </div>
            <p className="font-sans text-sm text-zinc-600 leading-relaxed">
              Clients view documents via secure 64-character unguessable token links — no accounts or passwords required.
            </p>
            <div className="bg-emerald-50/40 border border-emerald-100 p-5 space-y-3 rounded-xl">
              <h4 className="font-bold uppercase text-black text-xs">Operating Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-sm leading-relaxed">
                <li>Open any document detail page.</li>
                <li>Click <strong>Copy Public Portal Link</strong> to copy the secure 64-character token URL for sharing via WhatsApp or messaging.</li>
                <li>Or click <strong>Dispatch via Email</strong> to send a styled Resend HTML email with your shop logo and brand color CTA button.</li>
                <li><strong>Quotation Acceptance:</strong> Clients can electronically sign and accept quotes directly on the portal.</li>
                <li><strong>Quotation Expiry Warning:</strong> If a quote has expired, the portal displays a warning banner disabling acceptance and offering a 1-click &quot;Request Updated Quote&quot; button.</li>
              </ol>
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
