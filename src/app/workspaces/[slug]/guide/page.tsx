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
    <div className="p-4 sm:p-8 space-y-10 selection:bg-black selection:text-white font-mono text-xs">
      
      {/* HEADER BAR */}
      <div className="border-b border-zinc-200/80 pb-6 space-y-2">
        <span className="text-[10px] text-zinc-400 uppercase font-semibold">DOCUMENTATION</span>
        <h1 className="text-xl font-semibold uppercase tracking-tight font-sans text-black">{shop.name} Operator Manual</h1>
        <p className="font-sans text-xs text-zinc-600">
          Comprehensive step-by-step operating guide for managing billing ledgers, eTIMS tax returns, payment channels, and financial analytics.
        </p>
      </div>

      {/* MODULE CARDS */}
      <div className="grid grid-cols-1 gap-6 max-w-4xl">
        
        {/* MODULE 0 */}
        <div className="card-modern p-6 space-y-3">
          <div className="flex items-center gap-2 border-b border-zinc-200/80 pb-2">
            <span className="bg-black text-white px-2 py-0.5 font-semibold uppercase text-[10px] rounded">[00] WALK-IN POS &amp; THERMAL RECEIPT PRINTING</span>
          </div>
          <p className="font-sans text-xs text-zinc-600 leading-relaxed">
            Rapid point-of-sale register for walk-in counter sales. Supports M-Pesa, Cash (with change calculator), and instant 58mm/80mm continuous thermal ticket printing with KRA eTIMS CU verification QR codes.
          </p>
          <div className="bg-zinc-50 border border-zinc-200 p-3 rounded text-[11px] font-sans text-zinc-700 space-y-1">
            <p className="font-bold text-black font-mono text-[10px] uppercase">⚡ Zero-Click Silent Kiosk Printing Setup:</p>
            <p>To print receipts silently without a popup confirmation on retail counters, set your thermal printer as the default in Windows/Mac and launch Google Chrome with the <code className="bg-zinc-200 px-1 py-0.5 rounded font-mono text-[10px]">--kiosk-printing</code> flag.</p>
          </div>
          <div className="pt-2">
            <Link
              href={`/workspaces/${slug}/pos`}
              className="btn-secondary-modern px-3 py-1.5 font-semibold uppercase text-[10px] inline-block"
            >
              Open POS Register -&gt;
            </Link>
          </div>
        </div>

        {/* MODULE 1 */}
        <div className="card-modern p-6 space-y-3">
          <div className="flex items-center gap-2 border-b border-zinc-200/80 pb-2">
            <span className="bg-black text-white px-2 py-0.5 font-semibold uppercase text-[10px] rounded">[01] SYSTEM SETTINGS &amp; BRAND THEMES</span>
          </div>
          <p className="font-sans text-xs text-zinc-600">
            Configure business profile parameters, VAT PIN, phone numbers, website, Cloudinary logo uploads, and custom shop theme colors.
          </p>
          <div className="pt-2">
            <Link
              href={`/workspaces/${slug}/settings`}
              className="btn-secondary-modern px-3 py-1.5 font-semibold uppercase text-[10px] inline-block"
            >
              Go to System Settings -&gt;
            </Link>
          </div>
        </div>

        {/* MODULE 2 */}
        <div className="card-modern p-6 space-y-3">
          <div className="flex items-center gap-2 border-b border-zinc-200/80 pb-2">
            <span className="bg-black text-white px-2 py-0.5 font-semibold uppercase text-[10px] rounded">[02] CLIENT FLOW &amp; SUPPLIER NETWORK</span>
          </div>
          <p className="font-sans text-xs text-zinc-600">
            Register clients and suppliers with tax PINs for statutory eTIMS compliance (email is optional for walk-in accounts). Generate invoices or LPOs directly from client/supplier detail pages, or inspect their complete running Statement of Account.
          </p>
          <div className="flex gap-3 pt-2">
            <Link
              href={`/workspaces/${slug}/clients`}
              className="btn-secondary-modern px-3 py-1.5 font-semibold uppercase text-[10px] inline-block"
            >
              Go to Client Directory -&gt;
            </Link>
            <Link
              href={`/workspaces/${slug}/suppliers`}
              className="btn-secondary-modern px-3 py-1.5 font-semibold uppercase text-[10px] inline-block"
            >
              Go to Supplier Network -&gt;
            </Link>
          </div>
        </div>

        {/* MODULE 3 */}
        <div className="card-modern p-6 space-y-3">
          <div className="flex items-center gap-2 border-b border-zinc-200/80 pb-2">
            <span className="bg-black text-white px-2 py-0.5 font-semibold uppercase text-[10px] rounded">[03] FISCAL LEDGERS &amp; KRA eTIMS TAXES</span>
          </div>
          <p className="font-sans text-xs text-zinc-600">
            Issue Invoices, Receipts, Quotations, LPOs, and Credit Notes. Assign row-level tax rates (16% VAT, 0% Zero-Rated, Exempt), enter eTIMS CU serial numbers, and print A4 vector PDFs or 58mm/80mm thermal slips.
          </p>
          <div className="pt-2">
            <Link
              href={`/workspaces/${slug}/documents`}
              className="btn-secondary-modern px-3 py-1.5 font-semibold uppercase text-[10px] inline-block"
            >
              Go to Fiscal Ledgers -&gt;
            </Link>
          </div>
        </div>

        {/* MODULE 4 */}
        <div className="card-modern p-6 space-y-3">
          <div className="flex items-center gap-2 border-b border-zinc-200/80 pb-2">
            <span className="bg-black text-white px-2 py-0.5 font-semibold uppercase text-[10px] rounded">[04] PAYMENT CHANNELS &amp; REMITTANCE REF #</span>
          </div>
          <p className="font-sans text-xs text-zinc-600">
            When settling documents, record payment destination channels (Bank, M-Pesa Till/Paybill, Cash, Cheque) and transaction reference codes (e.g. M-Pesa Code `QAB71239X` or Bank Ref).
          </p>
        </div>

        {/* MODULE 5 */}
        <div className="card-modern p-6 space-y-3">
          <div className="flex items-center gap-2 border-b border-zinc-200/80 pb-2">
            <span className="bg-black text-white px-2 py-0.5 font-semibold uppercase text-[10px] rounded">[05] FINANCIAL INTELLIGENCE &amp; KRA 20TH VAT TRACKER</span>
          </div>
          <p className="font-sans text-xs text-zinc-600">
            Monitor real-time cash flow streams, 0–90+ day A/R aging risk matrix, top bestseller product velocity, and the statutory 20th KRA monthly VAT return deadline tracker.
          </p>
          <div className="pt-2">
            <Link
              href={`/workspaces/${slug}/analytics`}
              className="btn-secondary-modern px-3 py-1.5 font-semibold uppercase text-[10px] inline-block"
            >
              Go to Financial Analytics -&gt;
            </Link>
          </div>
        </div>

        {/* MODULE 6 */}
        <div className="card-modern p-6 space-y-3">
          <div className="flex items-center gap-2 border-b border-zinc-200/80 pb-2">
            <span className="bg-black text-white px-2 py-0.5 font-semibold uppercase text-[10px] rounded">[06] MULTI-LOCATION INVENTORY &amp; STOCK TRANSFERS</span>
          </div>
          <p className="font-sans text-xs text-zinc-600">
            Establish multiple warehouses or branch stores. Log manual adjustments, execute inter-location stock transfers with dispatch/receive timelines, and monitor FIFO stock valuations and ABC Pareto tiers.
          </p>
          <div className="flex gap-3 pt-2">
            <Link
              href={`/workspaces/${slug}/inventory`}
              className="btn-secondary-modern px-3 py-1.5 font-semibold uppercase text-[10px] inline-block"
            >
              Go to Stock Overview -&gt;
            </Link>
            <Link
              href={`/workspaces/${slug}/inventory/transfers`}
              className="btn-secondary-modern px-3 py-1.5 font-semibold uppercase text-[10px] inline-block"
            >
              Go to Stock Transfers -&gt;
            </Link>
          </div>
        </div>

        {/* MODULE 7 */}
        <div className="card-modern p-6 space-y-3">
          <div className="flex items-center gap-2 border-b border-zinc-200/80 pb-2">
            <span className="bg-black text-white px-2 py-0.5 font-semibold uppercase text-[10px] rounded">[07] SHARED B2B INBOX &amp; INTERCOMPANY ROUTING</span>
          </div>
          <p className="font-sans text-xs text-zinc-600">
            Route invoices and LPOs between related workspaces (e.g. parent and division) instantly matching by KRA PIN and Email. Convert incoming items directly to purchase records.
          </p>
          <div className="pt-2">
            <Link
              href={`/workspaces/${slug}/inbox`}
              className="btn-secondary-modern px-3 py-1.5 font-semibold uppercase text-[10px] inline-block"
            >
              Go to Shared Inbox -&gt;
            </Link>
          </div>
        </div>

        {/* MODULE 8 */}
        <div className="card-modern p-6 space-y-3">
          <div className="flex items-center gap-2 border-b border-zinc-200/80 pb-2">
            <span className="bg-black text-white px-2 py-0.5 font-semibold uppercase text-[10px] rounded">[08] GENERAL LEDGER, BALANCE SHEET &amp; BANK RECONCILIATION</span>
          </div>
          <p className="font-sans text-xs text-zinc-600 leading-relaxed">
            Full 5-class double-entry accounting suite. Generate Balance Sheets (Statement of Financial Position), perform automated Bank &amp; M-Pesa CSV reconciliations, plan monthly operating budgets, and inspect journal ledgers.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href={`/workspaces/${slug}/finance/reports/balance-sheet`}
              className="btn-secondary-modern px-3 py-1.5 font-semibold uppercase text-[10px] inline-block"
            >
              Balance Sheet -&gt;
            </Link>
            <Link
              href={`/workspaces/${slug}/finance/reconciliation`}
              className="btn-secondary-modern px-3 py-1.5 font-semibold uppercase text-[10px] inline-block"
            >
              Bank Reconciliation -&gt;
            </Link>
            <Link
              href={`/workspaces/${slug}/finance/ledger`}
              className="btn-secondary-modern px-3 py-1.5 font-semibold uppercase text-[10px] inline-block"
            >
              General Ledger -&gt;
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
