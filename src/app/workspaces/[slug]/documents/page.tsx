// src/app/workspaces/[slug]/documents/page.tsx
import { db } from "@/db";
import { documents, shops } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatCurrency, isFiscalDocType } from "@/lib/utils";
import Link from "next/link";

import { clients } from "@/db/schema";
import { LedgerFilterBar } from "./LedgerFilterBar";
import { PipelineView } from "@/components/PipelineView";

interface LedgerPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    search?: string;
    type?: string;
    status?: string;
    clientId?: string;
    fromDate?: string;
    toDate?: string;
    view?: string;
  }>;
}

const DOC_TYPE_TABS = [
  { key: "ALL", label: "All" },
  { key: "INVOICE", label: "Invoices" },
  { key: "QUOTATION", label: "Quotes" },
  { key: "RECEIPT", label: "Receipts" },
  { key: "CREDIT_NOTE", label: "Credit Notes" },
  { key: "LPO", label: "LPO" },
  { key: "DELIVERY_NOTE", label: "Delivery" },
  { key: "PAYMENT_VOUCHER", label: "Vouchers" },
];

export default async function WorkspaceLedgerPage({ params, searchParams }: LedgerPageProps) {
  // 1. Await dynamic params and searchParams (required in Next.js 15+)
  const { slug } = await params;
  const { search, type, status, clientId, fromDate, toDate, view } = await searchParams;

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
  const isPipelineView = view === "pipeline";

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

  // 5. Compute dashboard stats from current filtered result
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const statsAll = await db.query.documents.findMany({
    where: eq(documents.shopId, shop.id),
    with: { client: true },
  });

  const outstanding = statsAll
    .filter((d) => (d.status === "ISSUED" || d.status === "PARTIALLY_PAID") && (d.type === "INVOICE" || d.type === "RECEIPT"))
    .reduce((acc, d) => acc + parseFloat(d.grandTotal || "0"), 0);

  const overdueCount = statsAll.filter(
    (d) => d.type === "INVOICE" && d.status === "ISSUED" && d.dueDate && new Date(d.dueDate) < now
  ).length;

  const paidThisMonth = statsAll
    .filter((d) => d.status === "PAID" && new Date(d.issueDate) >= startOfMonth)
    .reduce((acc, d) => acc + parseFloat(d.grandTotal || "0"), 0);

  const openQuotes = statsAll.filter(
    (d) => d.type === "QUOTATION" && d.status !== "CANCELLED"
  ).length;

  return (
    <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white">
      
      {/* HEADER SECTION AREA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/80 pb-6">
        <div>
          <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Transaction Stream</span>
          <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Billing &amp; Invoices</h1>
        </div>
        
        <Link
          href={`/workspaces/${slug}/documents/new`}
          className="btn-primary-modern px-4 py-2 text-xs font-semibold uppercase tracking-wider w-full sm:w-auto text-center"
        >
          + Generate Document
        </Link>
      </div>

      {/* STATS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-modern p-4 space-y-1 border-l-2 border-amber-400">
          <p className="font-mono text-[10px] text-zinc-400 uppercase font-bold">Outstanding</p>
          <p className="font-mono text-lg font-black text-black leading-tight">{formatCurrency(outstanding, shop.currency)}</p>
          <p className="text-[10px] text-zinc-500 font-sans">Issued &amp; partial invoices</p>
        </div>
        <div className="card-modern p-4 space-y-1 border-l-2 border-rose-400">
          <p className="font-mono text-[10px] text-zinc-400 uppercase font-bold">Overdue</p>
          <p className="font-mono text-lg font-black text-rose-600 leading-tight">{overdueCount}</p>
          <p className="text-[10px] text-zinc-500 font-sans">Past due date invoices</p>
        </div>
        <div className="card-modern p-4 space-y-1 border-l-2 border-emerald-400">
          <p className="font-mono text-[10px] text-zinc-400 uppercase font-bold">Paid This Month</p>
          <p className="font-mono text-lg font-black text-emerald-700 leading-tight">{formatCurrency(paidThisMonth, shop.currency)}</p>
          <p className="text-[10px] text-zinc-500 font-sans">Collected in {now.toLocaleString("en-KE", { month: "long" })}</p>
        </div>
        <div className="card-modern p-4 space-y-1 border-l-2 border-blue-400">
          <p className="font-mono text-[10px] text-zinc-400 uppercase font-bold">Open Quotes</p>
          <p className="font-mono text-lg font-black text-blue-700 leading-tight">{openQuotes}</p>
          <p className="text-[10px] text-zinc-500 font-sans">Awaiting conversion</p>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <LedgerFilterBar clients={shopClients} />

      {/* TOOLBAR: TYPE TABS + VIEW TOGGLE */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        {/* Scrollable type tabs */}
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="flex border border-zinc-200/80 divide-x divide-zinc-200/80 bg-white font-mono text-[10px] uppercase w-fit rounded shadow-xs">
            {DOC_TYPE_TABS.map((t) => {
              const isActive = activeType === t.key;
              return (
                <Link
                  key={t.key}
                  href={`/workspaces/${slug}/documents?type=${t.key}${view ? `&view=${view}` : ""}`}
                  className={`px-3 py-2 font-semibold transition-colors whitespace-nowrap ${
                    isActive ? "bg-black text-white font-semibold" : "bg-white text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* View Toggle: Table / Pipeline */}
        <div className="flex border border-zinc-200 rounded overflow-hidden font-mono text-[10px] font-bold uppercase shrink-0">
          <Link
            href={`/workspaces/${slug}/documents?type=${activeType}`}
            className={`px-3 py-2 flex items-center gap-1.5 transition-colors ${!isPipelineView ? "bg-black text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}
          >
            <span>☰</span>
            <span>Table</span>
          </Link>
          <Link
            href={`/workspaces/${slug}/documents?type=${activeType}&view=pipeline`}
            className={`px-3 py-2 flex items-center gap-1.5 transition-colors border-l border-zinc-200 ${isPipelineView ? "bg-black text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}
          >
            <span>⬛</span>
            <span>Pipeline</span>
          </Link>
        </div>
      </div>

      {/* PIPELINE VIEW */}
      {isPipelineView ? (
        <PipelineView
          docs={streamLedger.map((d) => ({
            id: d.id,
            docNumber: d.docNumber,
            type: d.type,
            status: d.status,
            grandTotal: d.grandTotal,
            issueDate: String(d.issueDate),
            clientName: d.client?.name || d.supplier?.name,
            slug,
          }))}
          currency={shop.currency}
        />
      ) : (
        /* TABLE VIEW */
        <div className="card-modern overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
                <th className="p-4 border-r border-zinc-200">Serial No</th>
                <th className="p-4 border-r border-zinc-200">Type</th>
                <th className="p-4 border-r border-zinc-200">Client / Party</th>
                <th className="p-4 border-r border-zinc-200">Date Issued</th>
                <th className="p-4 border-r border-zinc-200 text-right">Total</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 bg-white">
              {streamLedger.map((doc) => (
                <tr key={doc.id} className="hover:bg-zinc-50/80 transition-colors group cursor-pointer">
                  <td className="p-4 border-r border-zinc-200/80 font-semibold text-black tracking-wider">
                    <Link href={`/workspaces/${slug}/documents/${doc.id}`} className="hover:underline">
                      {doc.docNumber}
                    </Link>
                  </td>
                  <td className="p-4 border-r border-zinc-200/80">
                    <span className="border border-zinc-200 px-1.5 py-0.5 text-[9px] font-semibold tracking-widest bg-zinc-50 rounded">
                      {doc.type}
                    </span>
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 font-sans text-sm font-semibold uppercase tracking-tight text-zinc-900">
                    {doc.client ? (
                      <Link
                        href={`/workspaces/${slug}/clients/${doc.client.id}`}
                        className="hover:underline text-black font-semibold"
                      >
                        {doc.client.name} ➔
                      </Link>
                    ) : doc.supplier ? (
                      <Link
                        href={`/workspaces/${slug}/suppliers/${doc.supplier.id}`}
                        className="hover:underline text-zinc-700"
                      >
                        {doc.supplier.name} ➔
                      </Link>
                    ) : (
                      doc.type === "PAYROLL_VOUCHER" ? "Staff Payroll" : "Walk-in Customer"
                    )}
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 text-zinc-500">
                    {new Date(doc.issueDate).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 font-semibold text-sm text-black text-right">
                    {formatCurrency(doc.grandTotal, shop.currency)}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col gap-1 items-center">
                      <span className={`border px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded ${
                        doc.status === "PAID" ? "bg-black text-white border-black" :
                        doc.status === "ISSUED" ? "bg-white text-black border-zinc-300 font-semibold" :
                        doc.status === "OVERDUE" ? "bg-rose-50 border-rose-300 text-rose-700 font-semibold" :
                        "bg-zinc-50 text-zinc-400 border-zinc-200"
                      }`}>
                        {doc.status}
                      </span>
                      {isFiscalDocType(doc.type) && doc.requiresEtims && !doc.kraCuInvoiceNumber && (
                        <span className="border border-amber-300 bg-amber-50 text-amber-900 px-1.5 py-0.5 text-[9px] font-semibold tracking-tight uppercase whitespace-nowrap rounded">
                          ⚠️ eTIMS CU Pending
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {streamLedger.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-16 text-center">
                    <div className="space-y-3">
                      <div className="text-4xl">📋</div>
                      <p className="font-bold text-zinc-800 text-sm font-sans">
                        {activeType !== "ALL"
                          ? `No ${DOC_TYPE_TABS.find(t => t.key === activeType)?.label || activeType}s found`
                          : "No documents yet"}
                      </p>
                      <p className="text-zinc-400 text-xs font-sans max-w-xs mx-auto leading-relaxed">
                        {activeType === "QUOTATION"
                          ? "Create your first quote and convert it to an invoice in one click."
                          : activeType === "INVOICE"
                          ? "Generate your first invoice or convert an existing quotation."
                          : "Start by generating a document for your workspace."}
                      </p>
                      <Link
                        href={`/workspaces/${slug}/documents/new`}
                        className="btn-primary-modern px-4 py-2 text-xs font-semibold uppercase inline-block mt-2"
                      >
                        + Generate Document
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}