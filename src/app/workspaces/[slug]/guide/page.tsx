// src/app/workspaces/[slug]/guide/page.tsx
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";

interface WorkspaceGuidePageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceGuidePage({ params }: WorkspaceGuidePageProps) {
  const { slug } = await params;

  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) notFound();

  return (
    <div className="p-4 sm:p-8 space-y-10 selection:bg-black selection:text-white font-sans text-xs">
      
      {/* HEADER BAR */}
      <div className="border-b border-zinc-200 pb-6 space-y-2">
        <span className="text-[10px] text-zinc-400 uppercase font-mono font-semibold">WORKSPACE OPERATING MANUAL</span>
        <h1 className="text-2xl font-bold uppercase tracking-tight text-black">{shop.name} Operator Guide</h1>
        <p className="text-xs text-zinc-600 max-w-3xl leading-relaxed">
          Comprehensive step-by-step operating instructions for running day-to-day point of sale transactions, statutory eTIMS billing, multi-location inventory reconciliation, payroll, team permissions, and double-entry accounting.
        </p>
      </div>

      {/* MODULE CARDS */}
      <div className="grid grid-cols-1 gap-6 max-w-4xl">
        
        {/* MODULE 00: WALK-IN POS */}
        <div className="card-modern p-6 space-y-3 bg-white">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
            <span className="bg-black text-white px-2.5 py-0.5 font-bold uppercase font-mono text-[10px] rounded">[00] WALK-IN POS &amp; THERMAL RECEIPT PRINTING</span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Rapid point-of-sale register for walk-in counter sales. Supports M-Pesa, Cash (with change calculator), and instant 58mm/80mm continuous thermal ticket printing with KRA eTIMS CU verification QR codes.
          </p>
          <div className="bg-zinc-50 border border-zinc-200 p-3.5 rounded-lg text-xs text-zinc-700 space-y-1.5 font-mono text-[11px]">
            <p className="font-bold text-black uppercase text-[10px]">⚡ Zero-Click Silent Kiosk Printing Setup:</p>
            <p className="font-sans text-xs text-zinc-600">To print receipts silently without a popup confirmation on retail counters, set your thermal printer as the default in Windows/Mac and launch Google Chrome with the <code className="bg-zinc-200 px-1 py-0.5 rounded font-mono text-[10px]">--kiosk-printing</code> flag.</p>
          </div>
          <div className="pt-2">
            <Link
              href={`/workspaces/${slug}/pos`}
              className="btn-secondary-modern px-3 py-1.5 font-bold uppercase text-[10px] inline-block"
            >
              Open POS Register →
            </Link>
          </div>
        </div>

        {/* MODULE 01: SYSTEM SETTINGS & MULTI-CURRENCY */}
        <div className="card-modern p-6 space-y-3 bg-white">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
            <span className="bg-black text-white px-2.5 py-0.5 font-bold uppercase font-mono text-[10px] rounded">[01] SYSTEM SETTINGS &amp; MULTI-CURRENCY</span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Configure business legal profile parameters, KRA PIN, VAT status, Cloudinary brand logo assets, custom shop accent colors, default payment remittance terms, and foreign exchange currency rates.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={`/workspaces/${slug}/settings`}
              className="btn-secondary-modern px-3 py-1.5 font-bold uppercase text-[10px] inline-block"
            >
              System Settings →
            </Link>
            <Link
              href={`/workspaces/${slug}/settings/currencies`}
              className="btn-secondary-modern px-3 py-1.5 font-bold uppercase text-[10px] inline-block"
            >
              Multi-Currency &amp; FX Rates →
            </Link>
            <Link
              href={`/workspaces/${slug}/settings/billing`}
              className="btn-secondary-modern px-3 py-1.5 font-bold uppercase text-[10px] inline-block"
            >
              Subscription &amp; Plan →
            </Link>
          </div>
        </div>

        {/* MODULE 02: STAFF MANAGEMENT & RBAC */}
        <div className="card-modern p-6 space-y-3 bg-white">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
            <span className="bg-black text-white px-2.5 py-0.5 font-bold uppercase font-mono text-[10px] rounded">[02] STAFF MANAGEMENT &amp; ROLE-BASED PERMISSIONS (RBAC)</span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Invite cashiers, managers, and accountants with fine-grained access control. Customize granular permissions for Employee accounts: <strong>Can Create Documents</strong>, <strong>Can Edit Clients</strong>, <strong>Can View Finance</strong>, <strong>Can Export Reports</strong>, <strong>Can Manage Catalog</strong>, and <strong>Can Manage Payroll</strong>.
          </p>
          <div className="pt-2">
            <Link
              href={`/workspaces/${slug}/team`}
              className="btn-secondary-modern px-3 py-1.5 font-bold uppercase text-[10px] inline-block"
            >
              Manage Staff &amp; Permissions →
            </Link>
          </div>
        </div>

        {/* MODULE 03: IN-APP ACTIVITY BELL & NOTIFICATIONS */}
        <div className="card-modern p-6 space-y-3 bg-white">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
            <span className="bg-black text-white px-2.5 py-0.5 font-bold uppercase font-mono text-[10px] rounded">[03] IN-APP NOTIFICATIONS &amp; ACTIVITY BELL</span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            The bell icon in the top navigation provides real-time workspace alerts with unread badge indicators. Automatically notifies you when:
          </p>
          <ul className="list-disc list-inside space-y-1 text-zinc-600 text-xs">
            <li>A client formally accepts or signs an issued Quotation on the public portal.</li>
            <li>A client requests scope or pricing amendments on an open quote.</li>
            <li>Invoices cross their due date and enter overdue status.</li>
            <li>A quotation reaches its expiry validity date and is cancelled by the automated sweep.</li>
            <li>Tracked inventory items reach low-stock warning thresholds.</li>
          </ul>
        </div>

        {/* MODULE 04: PRODUCT CATALOG & RATE CARDS */}
        <div className="card-modern p-6 space-y-3 bg-white">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
            <span className="bg-black text-white px-2.5 py-0.5 font-bold uppercase font-mono text-[10px] rounded">[04] PRODUCT CATALOG, CURATED LISTS &amp; RATE CARDS</span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Maintain your product catalog with COGS cost tracking. Share your complete digital catalog or select specific models (curated lists) with prospective clients so they can browse specifications and request quotations directly into your dashboard.
          </p>
          <div className="pt-2">
            <Link
              href={`/workspaces/${slug}/products`}
              className="btn-secondary-modern px-3 py-1.5 font-bold uppercase text-[10px] inline-block"
            >
              Open Product Catalog →
            </Link>
          </div>
        </div>

        {/* MODULE 05: SMART INVENTORY & 1-CLICK RECONCILER */}
        <div className="card-modern p-6 space-y-3 bg-white">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
            <span className="bg-black text-white px-2.5 py-0.5 font-bold uppercase font-mono text-[10px] rounded">[05] MULTI-LOCATION INVENTORY, DISCREPANCY RECONCILER &amp; LPO RECEIVING</span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Track stock across multiple physical warehouses or branches. Product catalog quantities automatically synchronize with location stock balances. Receiving LPOs, POs, or Goods Received Notes (GRN) automatically credits stock inflow.
          </p>
          <div className="bg-zinc-50 border border-zinc-200 p-3.5 rounded-lg text-xs text-zinc-700 space-y-1">
            <p className="font-bold text-black uppercase font-mono text-[10px]">⚡ 1-Click Discrepancy Reconciler:</p>
            <p className="text-zinc-600">If stock ever falls out of sync, click the <strong>&quot;⚡ Reconcile Inventory &amp; Location Stock&quot;</strong> button on the Stock Overview or Locations page to re-align all product quantities with physical warehouse allocations instantly.</p>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={`/workspaces/${slug}/inventory`}
              className="btn-secondary-modern px-3 py-1.5 font-bold uppercase text-[10px] inline-block"
            >
              Stock Overview &amp; Reconciler →
            </Link>
            <Link
              href={`/workspaces/${slug}/inventory/locations`}
              className="btn-secondary-modern px-3 py-1.5 font-bold uppercase text-[10px] inline-block"
            >
              Warehouse Locations →
            </Link>
            <Link
              href={`/workspaces/${slug}/inventory/transfers`}
              className="btn-secondary-modern px-3 py-1.5 font-bold uppercase text-[10px] inline-block"
            >
              Stock Transfers →
            </Link>
          </div>
        </div>

        {/* MODULE 06: CLIENT & SUPPLIER NETWORK */}
        <div className="card-modern p-6 space-y-3 bg-white">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
            <span className="bg-black text-white px-2.5 py-0.5 font-bold uppercase font-mono text-[10px] rounded">[06] CLIENT DIRECTORY &amp; SUPPLIER PROCUREMENT</span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Register clients and suppliers with tax PINs for statutory compliance. View client lifetime value (LTV) rankings, issue billing or procurement documents directly, and download complete running Statements of Account.
          </p>
          <div className="flex gap-3 pt-2">
            <Link
              href={`/workspaces/${slug}/clients`}
              className="btn-secondary-modern px-3 py-1.5 font-bold uppercase text-[10px] inline-block"
            >
              Client Directory →
            </Link>
            <Link
              href={`/workspaces/${slug}/suppliers`}
              className="btn-secondary-modern px-3 py-1.5 font-bold uppercase text-[10px] inline-block"
            >
              Supplier Network →
            </Link>
          </div>
        </div>

        {/* MODULE 07: FISCAL LEDGERS & QUOTATION EXPIRY */}
        <div className="card-modern p-6 space-y-3 bg-white">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
            <span className="bg-black text-white px-2.5 py-0.5 font-bold uppercase font-mono text-[10px] rounded">[07] FISCAL LEDGERS, ETIMS TAXES &amp; QUOTATION EXPIRY</span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Issue Invoices, Receipts, Quotations, LPOs, Delivery Notes, and Credit Notes. Row-level tax rates (16% Standard VAT, 0% Zero-Rated, Exempt) compute dynamically. Quotations feature validity presets (+7d, +14d, +30d, +60d) and automated expiry sweep monitoring.
          </p>
          <div className="pt-2">
            <Link
              href={`/workspaces/${slug}/documents`}
              className="btn-secondary-modern px-3 py-1.5 font-bold uppercase text-[10px] inline-block"
            >
              Go to Fiscal Ledgers →
            </Link>
          </div>
        </div>

        {/* MODULE 08: FINANCIAL INTELLIGENCE & 20TH VAT */}
        <div className="card-modern p-6 space-y-3 bg-white">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
            <span className="bg-black text-white px-2.5 py-0.5 font-bold uppercase font-mono text-[10px] rounded">[08] FINANCIAL INTELLIGENCE, LEADERBOARDS &amp; 20TH VAT TRACKER</span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Monitor real-time cash flows with 6-month / 12-month rolling horizon toggles, Top 10 Clients by revenue leaderboard, Product vs Service revenue split visualizer, Quotation Conversion Funnel, 0–90+ day A/R aging risk matrix, and the statutory 20th KRA monthly VAT return tracker.
          </p>
          <div className="pt-2">
            <Link
              href={`/workspaces/${slug}/analytics`}
              className="btn-secondary-modern px-3 py-1.5 font-bold uppercase text-[10px] inline-block"
            >
              Open Financial Analytics →
            </Link>
          </div>
        </div>

        {/* MODULE 09: STATUTORY PAYROLL */}
        <div className="card-modern p-6 space-y-3 bg-white">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
            <span className="bg-black text-white px-2.5 py-0.5 font-bold uppercase font-mono text-[10px] rounded">[09] STATUTORY PAYROLL &amp; WAGE COMPILER</span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Execute full Kenyan statutory payroll runs for salaried staff and casual wages. Automatically computes PAYE tax bands with personal relief, SHIF (2.75%), AHL (1.5%), and NSSF Tier I &amp; II. Generates A4 Landscape 11-column payroll voucher PDFs.
          </p>
          <div className="flex gap-3 pt-2">
            <Link
              href={`/workspaces/${slug}/employees`}
              className="btn-secondary-modern px-3 py-1.5 font-bold uppercase text-[10px] inline-block"
            >
              Employee Directory →
            </Link>
            <Link
              href={`/workspaces/${slug}/payroll`}
              className="btn-secondary-modern px-3 py-1.5 font-bold uppercase text-[10px] inline-block"
            >
              Payroll Vouchers →
            </Link>
          </div>
        </div>

        {/* MODULE 10: DOUBLE-ENTRY GENERAL LEDGER */}
        <div className="card-modern p-6 space-y-3 bg-white">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
            <span className="bg-black text-white px-2.5 py-0.5 font-bold uppercase font-mono text-[10px] rounded">[10] DOUBLE-ENTRY GENERAL LEDGER &amp; BALANCE SHEET</span>
          </div>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Full 5-class double-entry accounting suite. Generate Balance Sheets (Statement of Financial Position), perform automated Bank &amp; M-Pesa CSV reconciliations, plan multi-month operating budgets with 1-click month cloning, and inspect real-time journal ledgers.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={`/workspaces/${slug}/finance/reports/balance-sheet`}
              className="btn-secondary-modern px-3 py-1.5 font-bold uppercase text-[10px] inline-block"
            >
              Balance Sheet →
            </Link>
            <Link
              href={`/workspaces/${slug}/finance/reconciliation`}
              className="btn-secondary-modern px-3 py-1.5 font-bold uppercase text-[10px] inline-block"
            >
              Bank Reconciliation →
            </Link>
            <Link
              href={`/workspaces/${slug}/finance/ledger`}
              className="btn-secondary-modern px-3 py-1.5 font-bold uppercase text-[10px] inline-block"
            >
              General Ledger →
            </Link>
            <Link
              href={`/workspaces/${slug}/finance/budgets`}
              className="btn-secondary-modern px-3 py-1.5 font-bold uppercase text-[10px] inline-block"
            >
              Operating Budgets →
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
