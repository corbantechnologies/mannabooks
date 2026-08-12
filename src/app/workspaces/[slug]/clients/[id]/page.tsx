// src/app/workspaces/[slug]/clients/[id]/page.tsx
import { db } from "@/db";
import { clients, documents, shops, suppliers } from "@/db/schema";
import { eq, and, desc, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { EditClientModal } from "../EditClientModal";
import { SyncClientToSupplierButton } from "./SyncClientToSupplierButton";
import { ClientDocumentsFilterBar } from "./ClientDocumentsFilterBar";
import Link from "next/link";

interface ClientProfilePageProps {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{
    type?: string;
    status?: string;
    search?: string;
  }>;
}

export default async function ClientProfileLedgerPage({ params, searchParams }: ClientProfilePageProps) {
  // 1. Await params and searchParams (required in Next.js 15+)
  const { slug, id } = await params;
  const { type, status: docStatus, search } = await searchParams;

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

  // 4. In-memory filter on client's documents based on search parameters
  let filteredDocs = clientRecord.documents;

  if (type && type !== "ALL") {
    filteredDocs = filteredDocs.filter((d) => d.type === type);
  }

  if (docStatus && docStatus !== "ALL") {
    filteredDocs = filteredDocs.filter((d) => d.status === docStatus);
  }

  if (search && search.trim() !== "") {
    const q = search.toLowerCase().trim();
    filteredDocs = filteredDocs.filter(
      (d) =>
        d.docNumber.toLowerCase().includes(q) ||
        (d.notes && d.notes.toLowerCase().includes(q))
    );
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
      <div className="border-b border-zinc-200/80 pb-6 space-y-2">
        <Link 
          href={`/workspaces/${slug}/clients`} 
          className="font-sans text-xs font-bold text-zinc-400 hover:underline block"
        >
          ← Back to Client Directory
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Customer Statement</span>
            <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">{clientRecord.name}</h1>
            <p className="font-sans text-xs text-zinc-500 mt-0.5">ID: {clientRecord.id}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
            <span className="border border-zinc-300 px-2.5 py-1 bg-zinc-50 font-semibold uppercase rounded text-zinc-700">
              Class: {clientRecord.clientType}
            </span>
            {clientRecord.taxPin && (
              <span className="bg-black text-white px-2.5 py-1 font-semibold uppercase tracking-wide rounded">
                PIN: {clientRecord.taxPin}
              </span>
            )}
            {clientRecord.requiresEtims && (
              <span className="border border-amber-300 bg-amber-50 text-amber-900 px-2.5 py-1 font-semibold uppercase tracking-wide rounded">
                eTIMS Required
              </span>
            )}
            <Link
              href={`/workspaces/${slug}/documents/new?clientId=${clientRecord.id}`}
              className="btn-primary-modern px-3 py-1 font-semibold uppercase tracking-wider text-[11px]"
            >
              + Generate Document
            </Link>
            <EditClientModal
              client={clientRecord}
              shopId={shop.id}
              shopSlug={slug}
              redirectToDirectoryAfterDelete={true}
            />

            {matchedSupplier ? (
              <Link
                href={`/workspaces/${slug}/suppliers/${matchedSupplier.id}`}
                className="border border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 px-2.5 py-1 font-semibold uppercase rounded tracking-wide text-[10px]"
              >
                Linked Supplier Profile ➔
              </Link>
            ) : (
              <SyncClientToSupplierButton
                clientId={clientRecord.id}
                shopId={shop.id}
                shopSlug={slug}
              />
            )}
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
          <span className="text-zinc-400 block uppercase text-[10px] font-semibold">Email Destination</span>
          <span className="font-sans font-semibold text-black text-sm">{clientRecord.email}</span>
        </div>
        <div>
          <span className="text-zinc-400 block uppercase text-[10px] font-semibold">Phone Line Reference</span>
          <span className="font-semibold text-black text-sm">{clientRecord.phone || "UNASSIGNED"}</span>
        </div>
        <div>
          <span className="text-zinc-400 block uppercase text-[10px] font-semibold">Onboarding Timestamp</span>
          <span className="text-zinc-600 text-sm font-semibold">
            {new Date(clientRecord.createdAt).toLocaleDateString("en-KE", { dateStyle: "long" })}
          </span>
        </div>
      </div>

      {/* STANDALONE HISTORICAL SUB-LEDGER GRID */}
      <div className="space-y-4">
        <h3 className="font-semibold uppercase tracking-tight text-sm font-sans text-black">&gt; Transaction Sub-Ledger</h3>
        
        <ClientDocumentsFilterBar />
        
        <div className="card-modern overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
                <th className="p-4 border-r border-zinc-200">Serial Reference</th>
                <th className="p-4 border-r border-zinc-200">Document Type</th>
                <th className="p-4 border-r border-zinc-200">Issue Tracking Date</th>
                <th className="p-4 border-r border-zinc-200 text-right">Total Aggregate Valuation</th>
                <th className="p-4 border-r border-zinc-200 text-center">Execution Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 bg-white">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="p-4 border-r border-zinc-200/80 font-semibold text-black tracking-wider">
                    <Link 
                      href={`/workspaces/${slug}/documents/${doc.id}`}
                      className="hover:underline underline-offset-2"
                    >
                      {doc.docNumber}
                    </Link>
                  </td>
                  <td className="p-4 border-r border-zinc-200/80">
                    <span className="border border-zinc-300 px-2 py-0.5 text-[9px] font-semibold tracking-widest bg-white rounded">
                      {doc.type}
                    </span>
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 text-zinc-500">
                    {new Date(doc.issueDate).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 font-semibold text-sm text-black text-right">
                    {formatCurrency(doc.grandTotal, shop.currency)}
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 text-center">
                    <span className={`border px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded ${
                      doc.status === "PAID" ? "bg-black text-white border-black" :
                      doc.status === "ISSUED" ? "bg-white text-black border-zinc-300" :
                      doc.status === "OVERDUE" ? "bg-rose-50 border-rose-300 text-rose-700" :
                      "bg-zinc-50 text-zinc-400 border-zinc-200"
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <Link
                      href={`/workspaces/${slug}/documents/${doc.id}`}
                      className="btn-secondary-modern px-2.5 py-1 text-[10px] font-semibold uppercase inline-block"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}

              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-zinc-400 italic">
                    &gt; NO REVENUE RECORDS ASSIGNED TO THIS INDIVIDUAL CLIENT TRACKING NODE.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}