// src/app/workspaces/[slug]/guide/page.tsx
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";

interface WorkspaceGuidePageProps {
  params: Promise<{ slug: string }>;
}

const GUIDE_MODULES = [
  { id: "mod-00", label: "[00] Walk-in POS & Thermal Printing", category: "POS & Sales" },
  { id: "mod-01", label: "[01] Workspace Settings & FX Currencies", category: "Admin" },
  { id: "mod-02", label: "[02] Staff RBAC & Permissions", category: "Admin" },
  { id: "mod-03", label: "[03] Notifications & Activity Bell", category: "Alerts" },
  { id: "mod-04", label: "[04] Products, Services & Rate Cards", category: "Commerce" },
  { id: "mod-05", label: "[05] Inventory, Warehouses & Stock Reconciler", category: "Commerce" },
  { id: "mod-06", label: "[06] Client Directory & Supplier Procurement", category: "Entities" },
  { id: "mod-07", label: "[07] Fiscal Invoicing, eTIMS & Quote Expiry", category: "Fiscal" },
  { id: "mod-08", label: "[08] Passwordless Portals & E-Signatures", category: "Fiscal" },
  { id: "mod-09", label: "[09] Payment Methods & Remittance Codes", category: "Banking" },
  { id: "mod-10", label: "[10] Statutory KRA 20th VAT Tracker", category: "Compliance" },
  { id: "mod-11", label: "[11] Financial Intelligence & Aging Matrices", category: "Analytics" },
  { id: "mod-12", label: "[12] Statutory Payroll (SHIF, AHL, PAYE)", category: "Payroll" },
  { id: "mod-13", label: "[13] Shared B2B Inbox & Intercompany Routing", category: "Commerce" },
  { id: "mod-14", label: "[14] General Ledger & Operating Budgets", category: "Accounting" },
  { id: "mod-15", label: "[15] PWA Offline & Desktop Installation", category: "Device" },
  { id: "mod-16", label: "[16] Bank & M-Pesa CSV Reconciliation", category: "Accounting" },
  { id: "mod-17", label: "[17] Compound Multi-Line Journal Grid", category: "Accounting" },
  { id: "mod-18", label: "[18] Accounts Payable & Vendor Bills (AP)", category: "Accounting" },
  { id: "mod-19", label: "[19] Fiscal Calendar & Period Month-End", category: "Accounting" },
  { id: "mod-20", label: "[20] High-Volume Bulk Operations", category: "Operations" },
  { id: "mod-21", label: "[21] Financial Statements & Board Reports", category: "Accounting" },
  { id: "mod-22", label: "[22] Three Workspace Operating Modes", category: "Admin" },
  { id: "mod-23", label: "[23] CRM Pipeline & Deals Management", category: "CRM" },
  { id: "mod-24", label: "[24] Interactive Proposals & e-Signatures", category: "CRM" },
  { id: "mod-25", label: "[25] Contracts, Retainers & Projects", category: "Operations" },
  { id: "mod-26", label: "[26] Multi-Branch Staff & Scoped Roles", category: "Admin" },
  { id: "mod-27", label: "[27] Unified Approvals & Requisition Engine", category: "Operations" },
  { id: "mod-28", label: "[28] Storage Bins Hierarchy & FEFO Expiry Risk", category: "WMS" },
  { id: "mod-29", label: "[29] Bill of Materials (BOM) & Light Manufacturing", category: "Operations" },
  { id: "mod-30", label: "[30] Physical Stocktake Audit & Reconciliation", category: "Operations" },
];

export default async function WorkspaceGuidePage({ params }: WorkspaceGuidePageProps) {
  const { slug } = await params;

  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) notFound();

  const businessModeLabel =
    shop.businessMode === "SERVICES"
      ? "💼 Pure Financial & Services"
      : shop.businessMode === "RETAIL"
      ? "🏪 Retail & Walk-in POS"
      : "🏗️ Complete Hybrid Enterprise";

  return (
    <div className="p-4 sm:p-7 space-y-8 font-sans text-xs bg-zinc-50/50 min-h-screen">
      
      {/* HEADER BAR */}
      <div className="card-modern p-6 bg-white border border-zinc-200/80 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold tracking-widest">
                OFFICIAL WORKSPACE OPERATING MANUAL
              </span>
              <span className="text-[10px] font-mono font-semibold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {businessModeLabel}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-black">
              {shop.name} Operator Guide
            </h1>
            <p className="text-xs text-zinc-600 max-w-3xl leading-relaxed">
              Step-by-step operating procedures, accounting controls, statutory Kenyan compliance rules (KRA eTIMS, 20th VAT, SHIF, AHL, WHT), and quick navigation shortcuts tailored to your workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href={`/workspaces/${slug}/settings`}
              className="btn-secondary-modern px-3.5 py-2 font-mono text-[11px] font-semibold uppercase"
            >
              ⚙️ Workspace Settings
            </Link>
            <Link
              href={`/workspaces/${slug}/documents/new`}
              className="btn-primary-modern px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider"
            >
              + Issue Document
            </Link>
          </div>
        </div>

        {/* QUICK JUMP PILLS */}
        <div className="space-y-2 pt-1">
          <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">Quick Jump to Module:</span>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-zinc-50 rounded-lg border border-zinc-100">
            {GUIDE_MODULES.map((mod) => (
              <a
                key={mod.id}
                href={`#${mod.id}`}
                className="px-2.5 py-1 text-[10px] font-mono font-semibold rounded bg-white text-zinc-700 border border-zinc-200 hover:border-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                {mod.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT: DESKTOP STICKY SIDEBAR + CONTENT BODY */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* STICKY DESKTOP TOC */}
        <aside className="hidden lg:block w-72 shrink-0 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto card-modern p-4 bg-white border border-zinc-200 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#064e3b] font-bold block px-2 pb-1 border-b border-zinc-100">
            Navigation Index
          </span>
          <nav className="flex flex-col gap-0.5">
            {GUIDE_MODULES.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="px-2.5 py-1.5 rounded text-[11px] font-mono text-zinc-600 hover:text-[#064e3b] hover:bg-emerald-50 transition-colors truncate"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* MAIN DOCUMENTATION STREAM */}
        <div className="flex-1 min-w-0 space-y-8">

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 00: WALK-IN POS */}
          {/* ─────────────────────────────────────────── */}
          <section id="mod-00" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                  [MODULE 00]
                </span>
                <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                  Walk-in POS Counter Terminal &amp; Thermal Printing
                </h2>
              </div>
              <Link
                href={`/workspaces/${slug}/pos`}
                className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
              >
                Launch POS Register →
              </Link>
            </div>
            
            <p className="text-xs text-zinc-600 leading-relaxed">
              Engineered for high-volume retail counters where speed is critical. Allows cashiers to ring up walk-in sales without requiring client profile records, splits tender between M-Pesa and Cash, computes change automatically, decrements stock in real-time, and fires thermal receipts.
            </p>

            <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-lg space-y-2">
              <span className="text-[11px] font-bold uppercase text-emerald-950 font-mono block">
                Standard Counter Operating Flow:
              </span>
              <ol className="list-decimal list-inside space-y-1.5 text-zinc-700 text-xs leading-relaxed">
                <li>Search items via the <strong>Catalog Quick Picker</strong>, SKU search, or barcode scanner. Click or scan to add to the active ticket.</li>
                <li>Adjust quantities with the <strong>+ / −</strong> buttons or type numerical amounts directly in the basket table.</li>
                <li>Choose the tender mode: <strong>M-Pesa</strong> (enter M-Pesa transaction reference), <strong>Cash</strong> (enter amount received to display exact change owed), or <strong>Bank/Card</strong>.</li>
                <li>Click <strong>⚡ Complete Sale &amp; Print Receipt</strong>. The transaction is instantly committed, stock is deducted from the active location, and the continuous thermal slip dialog opens.</li>
                <li>Select <strong>58mm</strong> (2-inch mobile/mini printer) or <strong>80mm</strong> (standard 3-inch counter printer) and press Enter to print.</li>
              </ol>
            </div>

            {/* SILENT KIOSK PRINTING CALLOUT */}
            <div className="bg-zinc-900 border border-zinc-800 text-white p-4 rounded-lg font-mono text-[11px] space-y-2">
              <div className="text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                <span>⚡</span>
                <span>Zero-Click Silent Kiosk Printing (Chrome &amp; Edge Counter Setup)</span>
              </div>
              <p className="font-sans text-xs text-zinc-300 leading-relaxed">
                To bypass the browser print confirmation dialog completely on busy counters:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-zinc-400 text-[11px] pl-2 font-mono">
                <li>Set your 58mm/80mm USB thermal printer as the <strong>Default Printer</strong> in Windows/Mac settings.</li>
                <li>Right-click your Google Chrome desktop icon &rarr; select <strong>Properties</strong>.</li>
                <li>In the <strong>Target</strong> field, append <code>--kiosk-printing</code> at the end (e.g., <code>chrome.exe --kiosk-printing</code>).</li>
                <li>Launch your POS terminal using this shortcut. Receipts will now print physically in 1 second with zero confirmation popups!</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 01: SYSTEM SETTINGS & MULTI-CURRENCY */}
          {/* ─────────────────────────────────────────── */}
          <section id="mod-01" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                  [MODULE 01]
                </span>
                <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                  Workspace Identity, Multi-Currency FX &amp; Three Business Modes
                </h2>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/workspaces/${slug}/settings`}
                  className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
                >
                  Settings →
                </Link>
                <Link
                  href={`/workspaces/${slug}/settings/currencies`}
                  className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
                >
                  FX Rates →
                </Link>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Manna Books is a multi-tenant platform. Each workspace functions as an independent legal and financial entity with its own KRA Tax PIN, VAT rules, Cloudinary logo asset, brand accent color, and foreign exchange rates.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-zinc-200 p-3.5 rounded-lg space-y-1.5 bg-zinc-50/50">
                <span className="font-bold uppercase text-[11px] text-black font-mono block">Brand Styling &amp; Vector Theme</span>
                <p className="text-zinc-600 text-xs">
                  Your chosen <strong>Primary Theme Color</strong> (e.g. Emerald <code>#064e3b</code>, Corporate Navy <code>#1e3a8a</code>, or Black <code>#000000</code>) automatically colors client invoice portals, vector PDF headers, and outbound transactional emails.
                </p>
              </div>
              <div className="border border-zinc-200 p-3.5 rounded-lg space-y-1.5 bg-zinc-50/50">
                <span className="font-bold uppercase text-[11px] text-black font-mono block">Multi-Currency (FX) Billing</span>
                <p className="text-zinc-600 text-xs">
                  Maintain billing in USD, EUR, GBP, TZS, or UGX. Set current exchange rates in <strong>Settings &rarr; Multi-Currency</strong> to automatically convert line items and display dual-currency summaries for cross-border clients.
                </p>
              </div>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 02: STAFF RBAC */}
          {/* ─────────────────────────────────────────── */}
          <section id="mod-02" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                  [MODULE 02]
                </span>
                <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                  Staff Management &amp; Granular Role-Based Permissions (RBAC)
                </h2>
              </div>
              <Link
                href={`/workspaces/${slug}/team`}
                className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
              >
                Manage Staff →
              </Link>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Protect your business data with strict server-enforced RBAC. Never share owner passwords with counter cashiers or field sales agents.
            </p>

            <div className="border border-zinc-200 rounded-lg overflow-hidden">
              <table className="w-full text-left font-mono text-[11px]">
                <thead className="bg-zinc-100 text-zinc-700 uppercase font-bold text-[10px] border-b border-zinc-200">
                  <tr>
                    <th className="p-3">Role Tier</th>
                    <th className="p-3">Authorized Permissions</th>
                    <th className="p-3">Ideal For</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-zinc-700">
                  <tr>
                    <td className="p-3 font-bold text-black">ADMIN / OWNER</td>
                    <td className="p-3">Full permissions: settings, fiscal period locking, clean slate reset, staff invite/removal.</td>
                    <td className="p-3">Managing Directors, Partners, Business Owners.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-emerald-800">MANAGER</td>
                    <td className="p-3">Create/approve documents, manage catalog, inventory adjustments, view reports.</td>
                    <td className="p-3">Operations Managers, Store Supervisors.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-blue-800">ACCOUNTANT</td>
                    <td className="p-3">Access General Ledger, compound journals, vendor bills, period audits, tax exports.</td>
                    <td className="p-3">CPK Bookkeepers, Finance Associates.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-zinc-800">EMPLOYEE (Granular)</td>
                    <td className="p-3">Configurable checkboxes: Documents only, Catalog only, or POS only. Sensitive financials hidden.</td>
                    <td className="p-3">Cashiers, Sales Reps, Warehouse Clerks.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 03: IN-APP ACTIVITY BELL */}
          {/* ─────────────────────────────────────────── */}
          <section id="mod-03" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
              <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                [MODULE 03]
              </span>
              <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                In-App Notifications Stream &amp; Activity Bell
              </h2>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Located in the top header bar, the real-time notification bell aggregates key commercial events across your workspace without requiring manual page refreshes:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded space-y-1">
                <span className="font-bold text-emerald-800 font-mono text-[11px] block">✍️ Quotation Acceptance &amp; E-Signatures</span>
                <p className="text-zinc-600">Triggers immediately when a client electronically signs your quotation on their passwordless portal.</p>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded space-y-1">
                <span className="font-bold text-amber-800 font-mono text-[11px] block">💬 Scope &amp; Pricing Amendment Requests</span>
                <p className="text-zinc-600">Alerts you when a client requests scope changes or price reviews before approving an open quote.</p>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded space-y-1">
                <span className="font-bold text-rose-800 font-mono text-[11px] block">⚠️ Overdue Invoices &amp; Credit Limits</span>
                <p className="text-zinc-600">Fires when client billing crosses agreed payment terms (30/60/90 days) without payment.</p>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded space-y-1">
                <span className="font-bold text-orange-800 font-mono text-[11px] block">📦 Low Stock Reorder Thresholds</span>
                <p className="text-zinc-600">Notifies warehouse managers when inventory balances hit minimum replenishment levels.</p>
              </div>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 04: PRODUCT & SERVICE CATALOG */}
          {/* ─────────────────────────────────────────── */}
          <section id="mod-04" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                  [MODULE 04]
                </span>
                <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                  Product &amp; Service Catalog, COGS Tracking &amp; WhatsApp Rate Cards
                </h2>
              </div>
              <Link
                href={`/workspaces/${slug}/products`}
                className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
              >
                Catalog &amp; Rates →
              </Link>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Register both physical goods and non-physical billable services. Track Cost of Goods Sold (COGS) to safeguard your gross profit margins on every quotation and invoice.
            </p>

            <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-lg space-y-2">
              <span className="text-[11px] font-bold uppercase text-emerald-950 font-mono block">
                ⚡ Curated WhatsApp Rate Card Sharing (Stop Sending Messy PDFs):
              </span>
              <ol className="list-decimal list-inside space-y-1.5 text-zinc-700 text-xs leading-relaxed">
                <li>On the Products table, select the checkboxes <code>[✓]</code> next to the 3–5 specific items the prospective client requested.</li>
                <li>In the top selection bar, click <strong>🔗 Share Selected</strong> to generate a compact, secure public catalog token URL.</li>
                <li>Click <strong>💬 WhatsApp</strong> to automatically launch WhatsApp Web or mobile app with a formatted rate card message.</li>
                <li>When the client opens the link, they view high-res product photos, specs, and selling prices (COGS remain hidden). They select quantities and tap <strong>&quot;Submit Quote Request&quot;</strong>, instantly creating an ISSUED Quotation in your dashboard!</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 05: INVENTORY & DISCREPANCY RECONCILER */}
          {/* ─────────────────────────────────────────── */}
          <section id="mod-05" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                  [MODULE 05]
                </span>
                <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                  Multi-Location Inventory, Warehouse Transfers &amp; 1-Click Reconciler
                </h2>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/workspaces/${slug}/inventory`}
                  className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
                >
                  Stock Overview →
                </Link>
                <Link
                  href={`/workspaces/${slug}/inventory/transfers`}
                  className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
                >
                  Transfers →
                </Link>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Track physical items across multiple warehouses, retail storefronts, or consignment depots. Every stock movement is logged to an immutable double-entry movement ledger.
            </p>

            <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-lg space-y-2">
              <span className="text-[11px] font-bold uppercase text-black font-mono block">
                ⚡ 1-Click Discrepancy Reconciler Protocol:
              </span>
              <p className="text-xs text-zinc-600 leading-relaxed">
                If network interruptions or concurrent cashier checkouts ever cause product catalog counts to diverge from physical warehouse balances, navigate to <strong>Inventory</strong> and click <strong>&quot;⚡ Reconcile Inventory &amp; Location Stock&quot;</strong>. The engine executes a mathematical re-alignment sweep across all location allocations, restoring 100% balance integrity.
              </p>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 06: CLIENT & SUPPLIER DIRECTORY */}
          {/* ─────────────────────────────────────────── */}
          <section id="mod-06" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                  [MODULE 06]
                </span>
                <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                  Client Directory, Supplier Procurement &amp; Statements of Account
                </h2>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/workspaces/${slug}/clients`}
                  className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
                >
                  Clients →
                </Link>
                <Link
                  href={`/workspaces/${slug}/suppliers`}
                  className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
                >
                  Suppliers →
                </Link>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Maintain structured profiles for corporate and individual counterparties with statutory Tax PIN validation. Generate chronological running Statements of Account showing opening balance, invoices issued, payments received, and net outstanding dues in 1 click.
            </p>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 07: FISCAL INVOICING & ETIMS */}
          {/* ─────────────────────────────────────────── */}
          <section id="mod-07" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                  [MODULE 07]
                </span>
                <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                  Fiscal Invoicing, KRA eTIMS Tax Compliance &amp; Quotation Expiry
                </h2>
              </div>
              <Link
                href={`/workspaces/${slug}/documents`}
                className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
              >
                Fiscal Ledgers →
              </Link>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Issue compliant commercial documents: Invoices, Receipts, Quotations, Local Purchase Orders (LPOs), Delivery Notes, Credit Notes, and Payment Vouchers.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2">
                <span className="font-bold text-black uppercase font-mono text-[11px] block">Row-Level Tax Rules</span>
                <ul className="list-disc list-inside space-y-1 text-zinc-600">
                  <li><code>V_16 (16% Standard VAT)</code>: Computes Output VAT on its own dedicated subtotal row above Grand Total.</li>
                  <li><code>V_0 (0% Zero-Rated)</code>: For exported goods or privileged institutions.</li>
                  <li><code>EXEMPT</code>: Unprocessed agricultural items and non-taxable services.</li>
                  <li><strong>eTIMS CU Serial Number</strong>: Embeds the KRA fiscal device control serial on the document.</li>
                </ul>
              </div>

              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2">
                <span className="font-bold text-black uppercase font-mono text-[11px] block">Quotation Validity &amp; Expiry</span>
                <p className="text-zinc-600">
                  Select validity presets (<strong>+7d</strong>, <strong>+14d</strong>, <strong>+30d</strong>, <strong>+60d</strong>). When quotes expire, the automated sweep tags them as <code>EXPIRED</code>, disabling portal signing and prompting clients to request an updated quotation.
                </p>
              </div>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 08: PASSWORDLESS PORTALS */}
          {/* ─────────────────────────────────────────── */}
          <section id="mod-08" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
              <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                [MODULE 08]
              </span>
              <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                Passwordless Client Portals, E-Signatures &amp; Telemetry
              </h2>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Eliminate client friction. Every commercial document (Quotation, Tax Invoice, Receipt, Delivery Note, Payment Voucher) is equipped with a secure, unguessable 64-character cryptographic token URL (<code>/portal/invoice/[token]</code>). Customers access their branded document instantly on any mobile phone, tablet, or desktop without downloading apps or remembering passwords.
            </p>

            <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-lg font-mono text-xs space-y-3">
              <span className="font-bold text-emerald-950 uppercase text-[11px] block">
                How Operators Direct Clients to Their Portals:
              </span>
              <ol className="list-decimal list-inside space-y-2 text-zinc-700 font-sans text-xs leading-relaxed">
                <li>
                  <strong>Locate the Document:</strong> Open any issued Quotation or Tax Invoice from <strong>Fiscal Ledgers</strong> (or from the client&apos;s transaction record).
                </li>
                <li>
                  <strong>Copy the Portal Link:</strong> In the upper-right <em>Document Status Panel</em>, click the <strong>Share &amp; Export</strong> dropdown and select <strong>&quot;🔗 Copy Portal Link&quot;</strong>. A green confirmation toast confirms the link is copied to your clipboard.
                </li>
                <li>
                  <strong>Share via WhatsApp or SMS:</strong> Paste the link directly into your WhatsApp conversation or SMS. In WhatsApp, the link automatically unfurls with your business name and document reference.
                </li>
                <li>
                  <strong>Send Branded Resend Email:</strong> Alternatively, click <strong>&quot;📧 Dispatch via Email&quot;</strong> to send an automated responsive HTML email featuring your company logo and a direct <em>&quot;View &amp; Settle Online&quot;</em> button.
                </li>
              </ol>
            </div>

            <div className="space-y-2 pt-1">
              <h4 className="font-bold uppercase text-black text-xs">What Clients Experience on the Portal:</h4>
              <ul className="list-disc list-inside space-y-1.5 text-zinc-700 text-xs leading-relaxed font-sans">
                <li>
                  <strong>Branded Company Letterhead:</strong> Displays your custom logo, contacts, KRA PIN, and primary brand theme color.
                </li>
                <li>
                  <strong>Configured Settlement Instructions:</strong> Embeds your active payment channels (M-Pesa Till / Paybill number &amp; account, plus Commercial Bank account number, branch, and SWIFT/BIC code) so clients can settle immediately.
                </li>
                <li>
                  <strong>KRA eTIMS Verification QR:</strong> A live scannable QR code that allows clients and corporate auditors to verify invoice tax validity directly on KRA servers.
                </li>
                <li>
                  <strong>1-Click Quotation Acceptance &amp; Amendments:</strong> Clients can click <strong>&quot;Accept Quotation&quot;</strong> to confirm the order (transitioning the quote to <code>CONFIRMED</code>), or click <strong>&quot;Request Changes&quot;</strong> to submit scope/rate adjustments directly back to your team.
                </li>
                <li>
                  <strong>Quotation Expiry Protection:</strong> Once a quote expires, acceptance is disabled and replaced with a 1-click <em>&quot;Request Updated Quote&quot;</em> prompt.
                </li>
                <li>
                  <strong>Vector PDF Download:</strong> High-resolution, letterhead-styled vector PDFs download in 1 click (<code>/portal/pdf/[token]</code>).
                </li>
              </ul>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-lg text-xs space-y-1">
              <span className="font-bold text-black uppercase text-[11px] block">Real-Time Operator Telemetry:</span>
              <p className="text-zinc-600 leading-relaxed font-sans">
                When a client opens their portal link, the database timestamps the visit and an emerald <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">👁️ Portal Viewed</span> badge lights up on the document in your workspace. When a client confirms or requests amendments on a quote, you receive an instant in-app notification in your top navigation activity bell.
              </p>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 09: PAYMENT CHANNELS */}
          {/* ─────────────────────────────────────────── */}
          <section id="mod-09" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
              <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                [MODULE 09]
              </span>
              <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                Payment Channel Audits &amp; Remittance Reference Tracking
              </h2>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              When marking documents as <strong>PAID</strong>, record the settlement channel (Bank Transfer, M-Pesa Till, M-Pesa Paybill, Cash, Cheque) alongside the transaction reference code (e.g. M-Pesa 10-char code <code>QAB71239X</code> or Bank EFT Ref <code>FT261900123</code>). Details are permanently logged for audit trails.
            </p>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 10: KRA 20TH VAT TRACKER */}
          {/* ─────────────────────────────────────────── */}
          <section id="mod-10" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                  [MODULE 10]
                </span>
                <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                  Statutory KRA 20th Monthly VAT Return Tracker
                </h2>
              </div>
              <Link
                href={`/workspaces/${slug}/analytics`}
                className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
              >
                VAT Tracker →
              </Link>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              In Kenya, VAT returns must be submitted on KRA iTax before the <strong>20th day of each following month</strong>. Manna Books provides a real-time countdown tracker with live statutory totals:
            </p>

            <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-lg font-mono text-xs space-y-2">
              <span className="font-bold text-emerald-950 uppercase text-[11px] block">Four Direct iTax Filing Figures:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-white p-2.5 rounded border border-emerald-200">
                  <span className="text-[10px] text-zinc-500 uppercase block">Output VAT (16%)</span>
                  <span className="font-bold text-black text-xs">Auto-Aggregated</span>
                </div>
                <div className="bg-white p-2.5 rounded border border-emerald-200">
                  <span className="text-[10px] text-zinc-500 uppercase block">Taxable Sales (16%)</span>
                  <span className="font-bold text-black text-xs">Auto-Aggregated</span>
                </div>
                <div className="bg-white p-2.5 rounded border border-emerald-200">
                  <span className="text-[10px] text-zinc-500 uppercase block">Zero-Rated (0%)</span>
                  <span className="font-bold text-black text-xs">Auto-Aggregated</span>
                </div>
                <div className="bg-white p-2.5 rounded border border-emerald-200">
                  <span className="text-[10px] text-zinc-500 uppercase block">Exempt Sales</span>
                  <span className="font-bold text-black text-xs">Auto-Aggregated</span>
                </div>
              </div>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 11: FINANCIAL INTELLIGENCE */}
          {/* ─────────────────────────────────────────── */}
          <section id="mod-11" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                  [MODULE 11]
                </span>
                <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                  Financial Intelligence, Cash Flow Horizons &amp; A/R Aging Matrix
                </h2>
              </div>
              <Link
                href={`/workspaces/${slug}/analytics`}
                className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
              >
                Analytics →
              </Link>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Track revenue momentum across rolling 6-month and 12-month horizons, inspect Top 10 Clients by lifetime revenue share, monitor the Quotation Conversion Funnel, and audit the <strong>0–30, 31–60, 61–90, 90+ day Accounts Receivable Aging Risk Matrix</strong> to prevent bad debts.
            </p>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 12: STATUTORY PAYROLL */}
          {/* ─────────────────────────────────────────── */}
          <section id="mod-12" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                  [MODULE 12]
                </span>
                <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                  Statutory Payroll &amp; Wage Compiler (SHIF 2.75%, AHL 1.5%, NSSF, PAYE)
                </h2>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/workspaces/${slug}/employees`}
                  className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
                >
                  Employees →
                </Link>
                <Link
                  href={`/workspaces/${slug}/payroll`}
                  className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
                >
                  Payroll Runs →
                </Link>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Manna Books includes a native Kenyan statutory payroll compiler. Add salaried staff or casual wages and the engine computes all mandatory deductions with zero external spreadsheets:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded">
                <span className="font-bold text-black uppercase text-[10px] block">SHIF (2.75% of Gross)</span>
                <p className="text-zinc-600 font-sans text-[11px]">Social Health Insurance Fund calculated at statutory 2.75% on gross salary.</p>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded">
                <span className="font-bold text-black uppercase text-[10px] block">AHL (1.5% Housing Levy)</span>
                <p className="text-zinc-600 font-sans text-[11px]">Affordable Housing Levy calculated at 1.5% employee contribution.</p>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded">
                <span className="font-bold text-black uppercase text-[10px] block">NSSF Tier I &amp; Tier II</span>
                <p className="text-zinc-600 font-sans text-[11px]">Calculated automatically up to the statutory upper earning limit.</p>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded">
                <span className="font-bold text-black uppercase text-[10px] block">PAYE Tax Bands &amp; Relief</span>
                <p className="text-zinc-600 font-sans text-[11px]">Graduated income tax bands with statutory personal relief (KES 2,400/month).</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 font-sans">
              Locking a payroll run generates an official <strong>A4 Landscape 11-Column PDF Payslip Voucher</strong> ready for staff distribution and bank disbursement.
            </p>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 13: SHARED B2B INBOX */}
          {/* ─────────────────────────────────────────── */}
          <section id="mod-13" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
              <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                [MODULE 13]
              </span>
              <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                Shared B2B Network Inbox &amp; Intercompany Routing
              </h2>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              When two businesses use Manna Books, an issued invoice or LPO routes directly into the counterparty&apos;s <strong>Shared Inbox</strong> using KRA PIN and Email matching. The recipient reviews the document and converts it to a Vendor Bill or Sales Order in 1 click—eliminating manual re-typing and transcription errors.
            </p>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 14: GENERAL LEDGER & BUDGETS */}
          {/* ─────────────────────────────────────────── */}
          <section id="mod-14" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                  [MODULE 14]
                </span>
                <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                  General Ledger, Chart of Accounts &amp; Operating Budgets
                </h2>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/workspaces/${slug}/finance/ledger`}
                  className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
                >
                  General Ledger →
                </Link>
                <Link
                  href={`/workspaces/${slug}/finance/budgets`}
                  className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
                >
                  Budgets →
                </Link>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Full 5-class double-entry accounting architecture (1000s Assets, 2000s Liabilities, 3000s Equity, 4000s Revenue, 5000s COGS, 6000s Operating Expenses). Inspect the real-time stream of debits and credits, filter by account code, and set monthly category budget caps with 1-click month cloning (<code>Copy Last Month&apos;s Budget</code>).
            </p>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 15: PWA APPLIANCE */}
          {/* ─────────────────────────────────────────── */}
          <section id="mod-15" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
              <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                [MODULE 15]
              </span>
              <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                Progressive Web App (PWA) Standalone Installation
              </h2>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Install Manna Books as a standalone desktop or mobile application without browser toolbars:
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-600 text-xs">
              <li><strong>Windows / Mac Chrome / Edge:</strong> Click the <strong>📲 Install App</strong> prompt or the icon in your browser address bar.</li>
              <li><strong>iOS Safari:</strong> Tap the <strong>Share</strong> button &rarr; tap <strong>Add to Home Screen</strong>.</li>
              <li><strong>Android:</strong> Tap the three-dot menu &rarr; tap <strong>Install App</strong>.</li>
            </ul>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 16: BANK & M-PESA RECONCILIATION */}
          {/* ─────────────────────────────────────────── */}
          <section id="mod-16" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                  [MODULE 16]
                </span>
                <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                  Bank &amp; M-Pesa CSV Statement Reconciliation (KES 0.00 Variance)
                </h2>
              </div>
              <Link
                href={`/workspaces/${slug}/finance/reconciliation`}
                className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
              >
                Reconciliation →
              </Link>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Achieve audited financial integrity by matching external commercial bank statements (corporate or retail online banking) or Safaricom M-Pesa Business CSVs directly against General Ledger Account 1200 (Cash &amp; Bank).
            </p>

            <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-lg space-y-2">
              <span className="text-[11px] font-bold uppercase text-emerald-950 font-mono block">Reconciliation Workflow:</span>
              <ol className="list-decimal list-inside space-y-1.5 text-zinc-700 text-xs leading-relaxed">
                <li>Download your monthly statement CSV from your commercial bank or M-Pesa portal.</li>
                <li>Go to <strong>Finance &rarr; Bank Reconciliation</strong> and upload the CSV file.</li>
                <li>The engine parses either <strong>Format A</strong> (separate Debit/Credit columns) or <strong>Format B</strong> (single Amount column with Cr/Dr indicators).</li>
                <li>The auto-matcher pairs statement credits with book cash debits, and withdrawals with book credits based on exact amounts and transaction references.</li>
                <li>Post adjustments for bank maintenance fees or excise duty until the variance reads exactly <strong>KES 0.00</strong>.</li>
              </ol>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 17: COMPOUND MULTI-LINE JOURNALS */}
          {/* ─────────────────────────────────────────── */}
          <section id="mod-17" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                  [MODULE 17]
                </span>
                <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                  Compound Multi-Line Journal Entry Builder &amp; Auto-Balance
                </h2>
              </div>
              <Link
                href={`/workspaces/${slug}/finance/ledger`}
                className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
              >
                Open Journal Builder →
              </Link>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Post complex multi-leg entries (such as payroll statutory splits, partner equity disbursements, inter-company settlements, and depreciation runs) across arbitrary N-lines in a single atomic transaction.
            </p>

            <div className="border border-zinc-200 p-4 rounded-lg space-y-2 bg-zinc-50/50 text-xs">
              <span className="font-bold text-black uppercase font-mono text-[11px] block">Key Features:</span>
              <ul className="list-disc list-inside space-y-1 text-zinc-600">
                <li><strong>Dynamic Multi-Row Grid:</strong> Add as many debit and credit lines as required.</li>
                <li><strong>⚡ 1-Click Auto-Balance:</strong> Click Auto-Balance on any row to automatically calculate the exact residual difference needed to reach mathematical equilibrium.</li>
                <li><strong>Live Balance Status:</strong> Shows total debits, total credits, and difference with green/red status badges before posting.</li>
                <li><strong>Cost Center Attribution:</strong> Tag individual legs with departmental cost centers for segmented reporting.</li>
              </ul>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 18: ACCOUNTS PAYABLE & VENDOR BILLS */}
          {/* ─────────────────────────────────────────── */}
          <section id="mod-18" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                  [MODULE 18]
                </span>
                <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                  Accounts Payable: Vendor Bills, 5%/10% WHT Deductions &amp; Remittance Vouchers
                </h2>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/workspaces/${slug}/finance/bills`}
                  className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
                >
                  Vendor Bills →
                </Link>
                <Link
                  href={`/workspaces/${slug}/finance/reports/payables-aging`}
                  className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
                >
                  Payables Aging →
                </Link>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Manage operating creditors (office rent, cloud infrastructure, professional legal/audit fees, outsourced contractors) with statutory Withholding Tax (WHT) deductions.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1.5">
                <span className="font-bold text-black uppercase font-mono text-[11px] block">Withholding Tax (WHT) Automation</span>
                <p className="text-zinc-600">
                  Select <strong>5% Professional Fees</strong> or <strong>10% Rent</strong>. The system automatically books the net vendor liability to Accounts Payable (2100) and segregates the deducted tax into <strong>KRA WHT Payable (2350)</strong> for iTax settlement.
                </p>
              </div>
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1.5">
                <span className="font-bold text-black uppercase font-mono text-[11px] block">Payment Vouchers &amp; Remittance Advice</span>
                <p className="text-zinc-600">
                  Authorizing a bill payment debits Accounts Payable (2100) and credits Bank (1200). Generates an official downloadable PDF payment voucher and emails remittance advice directly to the supplier.
                </p>
              </div>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 19: FISCAL PERIODS & MONTH CLOSING */}
          {/* ─────────────────────────────────────────── */}
          <section id="mod-19" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                  [MODULE 19]
                </span>
                <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                  Fiscal Calendar, Monthly Period Closing &amp; Audit Reopening
                </h2>
              </div>
              <Link
                href={`/workspaces/${slug}/finance/periods`}
                className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
              >
                Accounting Periods →
              </Link>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Enforce enterprise governance. Declare 12-month fiscal years, lock completed months against retroactive tampering, and enforce justification logging for audit reopenings:
            </p>

            <ol className="list-decimal list-inside space-y-1.5 text-zinc-700 text-xs">
              <li><strong>Setup 12-Month Year:</strong> Initialize your fiscal year starting in January, July, or custom month.</li>
              <li><strong>Month-End Locking:</strong> After bank reconciliation and payroll postings, click <strong>Close Period</strong>. That month enters read-only status.</li>
              <li><strong>Reopening with Justification:</strong> To post an audit adjustment in a closed month, an Admin clicks <strong>Reopen Period</strong> and inputs a mandatory audit log explanation.</li>
              <li><strong>Year-End Sweep:</strong> When period 12 is closed, click <strong>Close Fiscal Year</strong> to automatically sweep net Revenue and Expenses into Retained Earnings (3300) and reset P&L accounts for the new year.</li>
            </ol>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 20: HIGH-VOLUME BULK OPERATIONS */}
          {/* ─────────────────────────────────────────── */}
          <section id="mod-20" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                  [MODULE 20]
                </span>
                <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                  High-Volume Bulk Financial Operations &amp; Batch Payouts
                </h2>
              </div>
              <Link
                href={`/workspaces/${slug}/documents`}
                className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
              >
                Documents Stream →
              </Link>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Process hundreds of customer invoices, vendor disbursements, and journal entries in seconds:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded space-y-1">
                <span className="font-bold text-black uppercase font-mono text-[11px] block">Bulk Email Dispatch</span>
                <p className="text-zinc-600">Select multiple invoices with checkboxes and click <strong>Bulk Email</strong> to dispatch customized PDF billing emails simultaneously.</p>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded space-y-1">
                <span className="font-bold text-black uppercase font-mono text-[11px] block">Encrypted ZIP Archive</span>
                <p className="text-zinc-600">Click <strong>Download ZIP</strong> to bundle selected client invoices or vouchers into a single archive for board audit review.</p>
              </div>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded space-y-1">
                <span className="font-bold text-black uppercase font-mono text-[11px] block">Batch Payout Manifest</span>
                <p className="text-zinc-600">Export approved vendor bills into standardized Bank EFT or M-Pesa B2B payout CSV manifests for corporate banking upload.</p>
              </div>
            </div>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 21: REPORT EXPORTS & STATEMENTS */}
          {/* ─────────────────────────────────────────── */}
          <section id="mod-21" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                  [MODULE 21]
                </span>
                <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                  Financial Statements &amp; Board Report Exports (CSV &amp; PDF)
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/workspaces/${slug}/finance/reports/trial-balance`}
                  className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
                >
                  Trial Balance →
                </Link>
                <Link
                  href={`/workspaces/${slug}/finance/reports/balance-sheet`}
                  className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
                >
                  Balance Sheet →
                </Link>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Every financial report in Manna Books is exportable in 1 click as formula-ready CSV spreadsheets for Excel modeling or boardroom-ready executive PDFs:
            </p>

            <ul className="list-disc list-inside space-y-1.5 text-zinc-700 text-xs">
              <li><strong>Trial Balance (CSV / PDF):</strong> Live debit and credit balance verification across all accounts (1000s–6000s).</li>
              <li><strong>Profit &amp; Loss / Income Statement (CSV / PDF):</strong> Filter by This Month, Last Month, Quarter, or Fiscal Year YTD.</li>
              <li><strong>Balance Sheet (Statement of Financial Position):</strong> Live snapshot enforcing <code>Assets = Liabilities + Equity</code>.</li>
              <li><strong>Cash Flow Statement:</strong> Segregated into Operating, Investing, and Financing activities.</li>
              <li><strong>Payables Aging Report:</strong> 0–30, 31–60, 61–90, 90+ day vendor debt breakdown.</li>
            </ul>
          </section>

          {/* ─────────────────────────────────────────── */}
          {/* MODULE 22: THREE WORKSPACE OPERATING MODES */}
          {/* ─────────────────────────────────────────── */}
          <section id="mod-22" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                  [MODULE 22]
                </span>
                <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                  Three Workspace Operating Modes &amp; UI Customization
                </h2>
              </div>
              <Link
                href={`/workspaces/${slug}/settings`}
                className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
              >
                Change Mode in Settings →
              </Link>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Manna Books adapts its sidebar navigation, tools, and terminology to match your business model:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-1.5">
                <span className="font-bold text-[#064e3b] font-mono text-xs block">💼 Mode 1: Services</span>
                <p className="text-zinc-600 text-[11px] leading-tight">
                  For law firms, consultancies, wealth managers &amp; SACCOs. Hides walk-in POS and warehouse clutter. Renames catalog to <strong>Services &amp; Rates</strong>. Surfaces General Ledger, Vendor Bills, and Bank Reconciliation.
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-1.5">
                <span className="font-bold text-[#064e3b] font-mono text-xs block">🏪 Mode 2: Retail &amp; POS</span>
                <p className="text-zinc-600 text-[11px] leading-tight">
                  For retail shops, supermarkets, pharmacies &amp; hardware stores. Puts the rapid walk-in POS counter terminal, barcode scanning, stock reconciler, and customer points loyalty engine front and center.
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-1.5">
                <span className="font-bold text-[#064e3b] font-mono text-xs block">🏗️ Mode 3: Hybrid Enterprise</span>
                <p className="text-zinc-600 text-[11px] leading-tight">
                  The complete unified suite for wholesalers, contractors &amp; distributors. Unlocks walk-in trade counter sales, multi-warehouse transfers, project cost centers, and full double-entry board accounting.
                </p>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 font-mono pt-1">
              To switch your mode at any time, navigate to <strong>Settings</strong> &rarr; scroll to <strong>Workspace Business Mode</strong> &rarr; pick your preferred card &rarr; click <strong>Commit Changes</strong>.
            </p>
          </section>

          {/* MODULE 23: CRM PIPELINE & DEALS */}
          <section id="mod-23" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                  [MODULE 23]
                </span>
                <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                  CRM Deal Pipeline &amp; Visual Kanban
                </h2>
              </div>
              <Link
                href={`/workspaces/${slug}/crm`}
                className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
              >
                Open CRM Pipeline →
              </Link>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Track prospects through 6 stages: Lead, Qualified, Proposal Sent, Negotiation, Won, and Lost. Monitor weighted pipeline forecasting, assign team reps, log activities (calls, meetings, notes), and seamlessly link won deals to proposals and contracts.
            </p>
          </section>

          {/* MODULE 24: INTERACTIVE PROPOSALS */}
          <section id="mod-24" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                  [MODULE 24]
                </span>
                <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                  Tiered Proposals &amp; Passwordless Client e-Signatures
                </h2>
              </div>
              <Link
                href={`/workspaces/${slug}/crm/proposals`}
                className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
              >
                View Proposals →
              </Link>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Build tiered proposals (e.g. Silver, Gold, Platinum packages) and share them via secure 64-char public tokens. Clients review terms, draw signatures directly on their phone or laptop, or request amendments with zero friction. Approved proposals convert into invoices in 1 click.
            </p>
          </section>

          {/* MODULE 25: CONTRACTS & PROJECTS */}
          <section id="mod-25" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                  [MODULE 25]
                </span>
                <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                  Retainer Contracts, SLA Hours &amp; Project Workspaces
                </h2>
              </div>
              <Link
                href={`/workspaces/${slug}/crm/contracts`}
                className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
              >
                Manage Contracts &amp; Projects →
              </Link>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Automate monthly recurring retainer invoices and SLA burn-down tracking. Monitor 30-day and 60-day expiry alert thresholds. Manage project workspaces with per-member billable rates, timesheet approvals, and phased milestone invoices.
            </p>
          </section>

          {/* MODULE 26: MULTI-BRANCH STAFF & SCOPED ROLES */}
          <section id="mod-26" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                  [MODULE 26]
                </span>
                <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                  Multi-Branch Staff Governance &amp; Cost-Price Blindness
                </h2>
              </div>
              <Link
                href="/workspaces"
                className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
              >
                Open Organization Directory →
              </Link>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Centralized organization directory allowing headquarters to manage staff across multiple branch workspaces from a single roster. Assign specialized operational roles (Storekeeper, Cashier, Dispatcher, Sales Rep, Accountant, Manager) and enforce strict <strong>Branch Location Scoping</strong> so warehouse clerks only access their designated branches. Enable <strong>Cost-Price Blindness</strong> to prevent storekeepers and cashiers from seeing sensitive vendor purchase costs and profit margins.
            </p>
          </section>

          {/* MODULE 27: UNIFIED APPROVALS ENGINE */}
          <section id="mod-27" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                  [MODULE 27]
                </span>
                <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                  Unified Corporate Approvals &amp; Requisition Engine
                </h2>
              </div>
              <Link
                href={`/workspaces/${slug}/approvals`}
                className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
              >
                Approvals Inbox →
              </Link>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Enforce corporate governance across purchase requisitions, employee expense claims, customer credit notes, and inventory write-offs. Configure tiered threshold policies with automatic approvals below specified spending limits, manager queues, slide-over timeline drawers, and required justification notes on all rejected tickets.
            </p>
          </section>

          {/* MODULE 28: ADVANCED WMS STORAGE BINS & FEFO */}
          <section id="mod-28" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                  [MODULE 28]
                </span>
                <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                  WMS Storage Bins, QR Labeling &amp; FEFO Expiry Risk
                </h2>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/workspaces/${slug}/inventory/bins`}
                  className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase"
                >
                  Storage Bins →
                </Link>
                <Link
                  href={`/workspaces/${slug}/inventory/reports/expiry`}
                  className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase"
                >
                  Expiry Risk →
                </Link>
              </div>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Map physical warehouse slotting down to Zone, Rack, Shelf, and Bin. Print scannable QR barcode labels for physical shelving and picking optimization. Track batches with supplier traceability and manufacture/expiry dates. Mitigate write-offs using First Expired, First Out (FEFO) automated order routing and multi-tier expiry aging dashboards (&lt;30 days Critical, 30–60 days Warning, 60–90 days Notice).
            </p>
          </section>

          {/* MODULE 29: BILL OF MATERIALS & LIGHT MANUFACTURING */}
          <section id="mod-29" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                  [MODULE 29]
                </span>
                <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                  Bill of Materials (BOM) &amp; Light Manufacturing
                </h2>
              </div>
              <Link
                href={`/workspaces/${slug}/inventory/bom`}
                className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
              >
                BOM Recipes &amp; Assembly →
              </Link>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Define multi-part assembly recipes with raw material ratios, expected scrap/wastage percentages, and allocated labor/overhead cost allowances. Execute one-click production orders that atomically consume raw materials from stock ledgers and capitalize finished goods at computed unit costs.
            </p>
          </section>

          {/* MODULE 30: PHYSICAL STOCKTAKE AUDIT WIZARD */}
          <section id="mod-30" className="card-modern p-6 space-y-4 bg-white border border-zinc-200 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white px-2.5 py-1 font-bold uppercase font-mono text-[10px] rounded">
                  [MODULE 30]
                </span>
                <h2 className="text-base sm:text-lg font-bold uppercase text-black">
                  Physical Stocktake Audit Wizard &amp; Reconciliation
                </h2>
              </div>
              <Link
                href={`/workspaces/${slug}/inventory/stocktakes`}
                className="btn-secondary-modern px-3 py-1 font-mono text-[10px] font-bold uppercase shrink-0"
              >
                Stocktake Wizard →
              </Link>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Conduct periodic cycle counts and full physical inventory audits per warehouse branch. Freeze ledger balances, print count sheets, record actual on-hand quantities, and view real-time variance quantities and shrinkage costs. Post one-click reconciliation adjustments that generate immutable stock ledger journals and balance sheet inventory corrections.
            </p>
          </section>

        </div>
      </div>

    </div>
  );
}
