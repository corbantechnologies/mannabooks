// src/app/workspaces/[slug]/clients/[id]/page.tsx
import { db } from "@/db";
import { clients, documents, shops, suppliers } from "@/db/schema";
import { eq, and, desc, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { ClientActionsPopover } from "./ClientActionsPopover";
import { ClientDocumentsSubLedger } from "./ClientDocumentsSubLedger";
import Link from "next/link";

interface ClientProfilePageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function ClientProfileLedgerPage({ params }: ClientProfilePageProps) {
  // 1. Await params
  const { slug, id } = await params;

  // 2. Resolve multi-tenant shop criteria context
  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) {
    notFound();
  }

  // 3. Fetch the targeted client profile alongside all their historical document records
  const clientRecord = await db.query.clients.findFirst({
    where: and(
      eq(clients.id, id),
      eq(clients.shopId, shop.id)
    ),
    with: {
      documents: {
        orderBy: [desc(documents.issueDate)],
      },
    },
  });

  if (!clientRecord) {
    notFound();
  }

  // 3.5 Check if a corresponding supplier profile already exists
  const matchedSupplier = await db.query.suppliers.findFirst({
    where: and(
      eq(suppliers.shopId, shop.id),
      clientRecord.taxPin
        ? or(eq(suppliers.taxPin, clientRecord.taxPin), eq(suppliers.email, clientRecord.email))
        : eq(suppliers.email, clientRecord.email)
    ),
  });

  // 3. Compute structural customer performance aggregations with absolute precision
  const performanceMetrics = clientRecord.documents.reduce(
    (acc, doc) => {
      const value = parseFloat(doc.grandTotal);
      if (doc.type === "RECEIPT") {
        acc.lifetimeValue += value;
      } else if (doc.type === "INVOICE") {
        if (doc.status === "PAID") {
          acc.lifetimeValue += value;
        } else if (doc.status === "ISSUED") {
          acc.outstandingLiability += value;
        } else if (doc.status === "OVERDUE") {
          acc.outstandingLiability += value;
          acc.overdueLiability += value;
        }
      }
      return acc;
    },
    { lifetimeValue: 0, outstandingLiability: 0, overdueLiability: 0 }
  );

  return (
    <div className="p-4 sm:p-8 space-y-12 selection:bg-black selection:text-white">
      
      {/* BACK NAVIGATION AND INTERFACE HEADER */}
      <div className="border-b border-zinc-200/80 pb-6 space-y-3">
        <Link 
          href={`/workspaces/${slug}/clients`} 
          className="font-sans text-xs font-bold text-zinc-400 hover:underline inline-flex items-center gap-1"
        >
          ← Back to Client Directory
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Customer Statement</span>
              {clientRecord.requiresEtims && (
                <span className="border border-amber-300 bg-amber-50 text-amber-900 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide rounded">
                  eTIMS Required
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold uppercase tracking-tight text-black font-sans">
              {clientRecord.name}
            </h1>

            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-zinc-600">
              <span className="border border-zinc-300 px-2 py-0.5 bg-zinc-50 font-semibold uppercase rounded text-zinc-700">
                Class: {clientRecord.clientType}
              </span>
              {clientRecord.taxPin && (
                <span className="bg-black text-white px-2 py-0.5 font-semibold uppercase tracking-wide rounded">
                  PIN: {clientRecord.taxPin}
                </span>
              )}
              <span className="text-zinc-400 font-mono text-[10px]">ID: {clientRecord.id}</span>
            </div>
          </div>
          
          {/* STREAMLINED ACTION CONTROLS */}
          <div className="flex items-center gap-2.5">
            <Link
              href={`/workspaces/${slug}/documents/new?clientId=${clientRecord.id}`}
              className="btn-primary-modern px-4 py-2 font-semibold uppercase tracking-wider text-xs shadow-sm flex items-center gap-1.5"
            >
              <span>+</span>
              <span>Generate Document</span>
            </Link>

            <ClientActionsPopover
              client={clientRecord}
              shop={shop}
              shopSlug={slug}
              matchedSupplier={matchedSupplier}
            />
          </div>
        </div>
      </div>

      {/* INDIVIDUAL PIPELINE FINANCIAL SUMMARY CARD BLOCKS */}
      <div className="card-modern divide-y md:divide-y-0 md:divide-x divide-zinc-200/80 bg-white grid grid-cols-1 md:grid-cols-3">
        <div className="p-6 space-y-1">
          <p className="font-mono text-xs text-zinc-400 uppercase font-semibold">Computed Lifetime Value (LTV)</p>
          <p className="text-xl font-semibold font-mono tracking-tight text-black">
            {formatCurrency(performanceMetrics.lifetimeValue, shop.currency)}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Total settled invoice balances explicitly processed to date.</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="font-mono text-xs text-zinc-400 uppercase font-semibold">Accounts Receivable Debt</p>
          <p className="text-xl font-semibold font-mono tracking-tight text-black">
            {formatCurrency(performanceMetrics.outstandingLiability, shop.currency)}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Pending un-settled balance vectors current in processing paths.</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="font-mono text-xs text-zinc-400 uppercase font-semibold">Critically Overdue Pool</p>
          <p className="text-xl font-semibold font-mono tracking-tight text-rose-600">
            {formatCurrency(performanceMetrics.overdueLiability, shop.currency)}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Outstanding invoice values that have cleared their due date constraints.</p>
        </div>
      </div>

      {/* CORE CONTACT SCHEDULING DETAILS BOX */}
      <div className="card-modern p-4 bg-zinc-50/50 font-mono text-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <span className="text-zinc-400 block uppercase text-[10px] font-semibold">Email Address</span>
          <span className="font-sans font-semibold text-black text-sm">{clientRecord.email}</span>
        </div>
        <div>
          <span className="text-zinc-400 block uppercase text-[10px] font-semibold">Phone Number</span>
          <span className="font-semibold text-black text-sm">{clientRecord.phone || "Not set"}</span>
        </div>
        <div>
          <span className="text-zinc-400 block uppercase text-[10px] font-semibold">Client Since</span>
          <span className="text-zinc-600 text-sm font-semibold">
            {new Date(clientRecord.createdAt).toLocaleDateString("en-KE", { dateStyle: "long" })}
          </span>
        </div>
      </div>

      {/* STANDALONE HISTORICAL SUB-LEDGER GRID (INSTANT 0MS CLIENT-SIDE FILTERING) */}
      <div className="space-y-4">
        <h3 className="font-semibold uppercase tracking-tight text-sm font-sans text-black">Documents &amp; Transactions</h3>
        
        <ClientDocumentsSubLedger
          documents={clientRecord.documents.map((d) => ({
            id: d.id,
            docNumber: d.docNumber,
            type: d.type,
            issueDate: d.issueDate,
            grandTotal: d.grandTotal,
            status: d.status,
            notes: d.notes,
          }))}
          slug={slug}
          currency={shop.currency}
        />
      </div>

    </div>
  );
}