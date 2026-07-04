// src/app/workspaces/[slug]/documents/page.tsx
import { db } from "@/db";
import { documents, shops } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

import { clients } from "@/db/schema";
import { LedgerFilterBar } from "./LedgerFilterBar";

interface LedgerPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    search?: string;
    type?: string;
    status?: string;
    clientId?: string;
    fromDate?: string;
    toDate?: string;
  }>;
}

export default async function WorkspaceLedgerPage({ params, searchParams }: LedgerPageProps) {
  // 1. Await dynamic params and searchParams (required in Next.js 15+)
  const { slug } = await params;
  const { search, type, status, clientId, fromDate, toDate } = await searchParams;

  // 2. Fetch active multi-tenant shop criteria and clients list for dropdown
  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) {
    notFound();
  }

  const shopClients = await db.query.clients.findMany({
    where: eq(clients.shopId, shop.id),
    orderBy: [desc(clients.name)],
  });

  // 3. Compute runtime filters based on query params
  const activeType = type || "ALL";
  const activeStatus = status || "ALL";
  const activeClientId = clientId || "ALL";

  const conditions = [eq(documents.shopId, shop.id)];

  if (activeType !== "ALL") {
    conditions.push(eq(documents.type, activeType as any));
  }

  if (activeStatus !== "ALL") {
    conditions.push(eq(documents.status, activeStatus as any));
  }

  if (activeClientId !== "ALL") {
    conditions.push(eq(documents.clientId, activeClientId));
  }

  // 4. Extract stream records
  let streamLedger = await db.query.documents.findMany({
    where: and(...conditions),
    orderBy: [desc(documents.issueDate)],
    with: {
      client: true,
      supplier: true,
    },
  });

  // Client/Supplier-side text search filtering (Serial Number or Party Name)
  if (search && search.trim() !== "") {
    const q = search.toLowerCase().trim();
    streamLedger = streamLedger.filter(
      (doc) =>
        doc.docNumber.toLowerCase().includes(q) ||
        (doc.client?.name || doc.supplier?.name || "").toLowerCase().includes(q)
    );
  }

  // Date range filtering
  if (fromDate) {
    const fromTime = new Date(fromDate).getTime();
    streamLedger = streamLedger.filter(
      (doc) => new Date(doc.issueDate).getTime() >= fromTime
    );
  }

  if (toDate) {
    const toTime = new Date(toDate).getTime() + 86400000; // End of selected day
    streamLedger = streamLedger.filter(
      (doc) => new Date(doc.issueDate).getTime() <= toTime
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-12 selection:bg-black selection:text-white">
      
      {/* HEADER SECTION AREA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black pb-6">
        <div>
          <span className="font-mono text-xs text-zinc-400">FINANCIAL_LEDGER // CORE_STREAM</span>
          <h1 className="text-3xl font-bold uppercase tracking-tighter mt-1">Fiscal Ledgers</h1>
        </div>
        
        <Link
          href={`/workspaces/${slug}/documents/new`}
          className="bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-zinc-900 transition-colors border border-black rounded-none w-full sm:w-auto text-center"
        >
          + Generate Document
        </Link>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <LedgerFilterBar clients={shopClients} />

      {/* STARK SORTING TABS STRIP */}
      <div className="flex border border-black divide-x divide-black bg-white font-mono text-[10px] uppercase w-full sm:w-fit overflow-x-auto">
        {["ALL", "INVOICE", "QUOTATION", "RECEIPT"].map((t) => {
          const isActive = activeType === t;
          return (
            <Link
              key={t}
              href={`/workspaces/${slug}/documents?type=${t}`}
              className={`px-4 py-2 font-bold transition-colors ${
                isActive ? "bg-black text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {t === "ALL" ? "All Streams" : `${t}s`}
            </Link>
          );
        })}
      </div>

      {/* CORE DATA LEDGER STREAM GRID */}
      <div className="border border-black bg-white overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-black uppercase tracking-wider font-bold">
              <th className="p-4 border-r border-black">Serial No</th>
              <th className="p-4 border-r border-black">Classification</th>
              <th className="p-4 border-r border-black">Client Recipient</th>
              <th className="p-4 border-r border-black">Date Issued</th>
              <th className="p-4 border-r border-black text-right">Grand Valuation</th>
              <th className="p-4 text-center">Status Flag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black bg-white">
            {streamLedger.map((doc) => (
              <tr key={doc.id} className="hover:bg-zinc-50 transition-colors group cursor-pointer">
                <td className="p-4 border-r border-black font-bold text-black tracking-wider">
                  <Link href={`/workspaces/${slug}/documents/${doc.id}`} className="hover:underline">
                    {doc.docNumber}
                  </Link>
                </td>
                <td className="p-4 border-r border-black">
                  <span className="border border-black px-1.5 py-0.5 text-[9px] font-bold tracking-widest bg-zinc-50">
                    {doc.type}
                  </span>
                </td>
                <td className="p-4 border-r border-black font-sans text-sm font-bold uppercase tracking-tight">
                  {doc.client?.name || doc.supplier?.name || "General Contact"}
                </td>
                <td className="p-4 border-r border-black text-zinc-500">
                  {new Date(doc.issueDate).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                </td>
                <td className="p-4 border-r border-black font-bold text-sm text-black text-right">
                  {formatCurrency(doc.grandTotal, shop.currency)}
                </td>
                <td className="p-4 text-center">
                  <div className="flex flex-col gap-1 items-center">
                    <span className={`border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                      doc.status === "PAID" ? "bg-black text-white border-black" :
                      doc.status === "SENT" ? "bg-white text-black border-black font-bold" :
                      doc.status === "OVERDUE" ? "bg-zinc-100 border-rose-600 border-dashed text-rose-700" :
                      "bg-zinc-50 text-zinc-400 border-zinc-200"
                    }`}>
                      {doc.status}
                    </span>
                    {doc.requiresEtims && !doc.kraCuInvoiceNumber && (
                      <span className="border border-amber-400 bg-amber-50 text-amber-900 px-1.5 py-0.5 text-[9px] font-bold tracking-tight uppercase whitespace-nowrap">
                        ⚠️ eTIMS CU Pending
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {streamLedger.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-zinc-400 italic">
                  &gt; NO ACTIVE LEDGER NODES FOUND MATCHING THESE METRIC MODES.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}