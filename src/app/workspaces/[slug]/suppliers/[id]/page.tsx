// src/app/workspaces/[slug]/suppliers/[id]/page.tsx
import { db } from "@/db";
import { suppliers, documents, shops, clients } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { SupplierActionsPopover } from "./SupplierActionsPopover";

interface SupplierDetailPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function SupplierDetailPage({ params }: SupplierDetailPageProps) {
  const { slug, id } = await params;

  // 1. Resolve multi-tenant shop criteria
  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) {
    notFound();
  }

  // 2. Fetch the target supplier details
  const supplierRecord = await db.query.suppliers.findFirst({
    where: and(eq(suppliers.id, id), eq(suppliers.shopId, shop.id)),
  });

  if (!supplierRecord) {
    notFound();
  }

  // 3. Query all procurement docs associated with this specific vendor
  const supplierDocuments = await db.query.documents.findMany({
    where: and(
      eq(documents.supplierId, supplierRecord.id),
      eq(documents.shopId, shop.id)
    ),
    orderBy: [desc(documents.issueDate)],
  });

  // Calculate gross procurement turnover
  const totalProcurementSpend = supplierDocuments
    .filter((d) => d.status === "PAID")
    .reduce((acc, curr) => acc + Number(curr.grandTotal), 0);

  // Calculate accounts payable debt
  const accountsPayableDebt = supplierDocuments
    .filter((d) => d.status === "ISSUED" || d.status === "OVERDUE")
    .reduce((acc, curr) => acc + Number(curr.grandTotal), 0);

  // Check if a client exists with the exact same taxPin (to provide cross-link)
  let matchedClient = null;
  if (supplierRecord.taxPin) {
    matchedClient = await db.query.clients.findFirst({
      where: and(
        eq(clients.shopId, shop.id),
        eq(clients.taxPin, supplierRecord.taxPin)
      ),
    });
  }

  return (
    <div className="p-4 sm:p-8 space-y-12 selection:bg-black selection:text-white">
      
      {/* INTERFACE NAVIGATION HEADER */}
      <div className="border-b border-zinc-200/80 pb-6 space-y-3">
        <Link
          href={`/workspaces/${slug}/suppliers`}
          className="text-xs font-sans font-bold text-zinc-400 hover:underline inline-flex items-center gap-1"
        >
          ← Back to Supplier Registry
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Procurement Summary</span>
              {supplierRecord.requiresEtims && (
                <span className="border border-amber-300 bg-amber-50 text-amber-900 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide rounded">
                  eTIMS Required
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold uppercase tracking-tight text-black font-sans">
              {supplierRecord.name}
            </h1>

            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-zinc-600">
              <span className="border border-zinc-300 px-2 py-0.5 bg-zinc-50 font-semibold uppercase rounded text-zinc-700">
                Class: {supplierRecord.supplierType}
              </span>
              {supplierRecord.taxPin && (
                <span className="bg-black text-white px-2 py-0.5 font-semibold uppercase tracking-wide rounded">
                  PIN: {supplierRecord.taxPin}
                </span>
              )}
              <span className="text-zinc-400 font-mono text-[10px]">ID: {supplierRecord.id}</span>
            </div>
          </div>

          {/* STREAMLINED ACTION CONTROLS */}
          <div className="flex items-center gap-2.5">
            <Link
              href={`/workspaces/${slug}/documents/new?supplierId=${supplierRecord.id}&type=LPO`}
              className="btn-primary-modern px-4 py-2 font-semibold uppercase tracking-wider text-xs shadow-sm flex items-center gap-1.5"
            >
              <span>+</span>
              <span>Issue LPO</span>
            </Link>

            <SupplierActionsPopover
              supplier={supplierRecord}
              shop={shop}
              shopSlug={slug}
              matchedClient={matchedClient}
            />
          </div>
        </div>
      </div>

      {/* FINANCIAL SUMMARY CARDS */}
      <div className="card-modern divide-y md:divide-y-0 md:divide-x divide-zinc-200/80 bg-white grid grid-cols-1 md:grid-cols-3">
        <div className="p-6 space-y-1">
          <p className="text-xs text-zinc-400 uppercase font-semibold">Total Procurement Spend</p>
          <p className="text-xl font-semibold tracking-tight text-black font-mono">
            {formatCurrency(totalProcurementSpend, shop.currency)}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Total settled procurement orders to date.</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="text-xs text-zinc-400 uppercase font-semibold">Accounts Payable Debt</p>
          <p className="text-xl font-semibold tracking-tight text-black font-mono">
            {formatCurrency(accountsPayableDebt, shop.currency)}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Outstanding pending payment vouchers &amp; bills.</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="text-xs text-zinc-400 uppercase font-semibold">Payment Terms</p>
          <p className="text-xl font-semibold uppercase tracking-tight text-black font-mono">
            {supplierRecord.paymentTerms || "NET_30"}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Agreed credit maturity timeframe.</p>
        </div>
      </div>

      {/* PROCUREMENT SUB-LEDGER TABLE */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider font-sans text-black">Purchase Orders &amp; Invoices</h2>
          <span className="text-[10px] text-zinc-400 uppercase font-semibold">
            Total Documents: {supplierDocuments.length}
          </span>
        </div>

        <div className="card-modern overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
                <th className="p-4 border-r border-zinc-200">Document #</th>
                <th className="p-4 border-r border-zinc-200">Document Type</th>
                <th className="p-4 border-r border-zinc-200">Issue Date</th>
                <th className="p-4 border-r border-zinc-200 text-right">Total Amount</th>
                <th className="p-4 border-r border-zinc-200 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 bg-white">
              {supplierDocuments.map((doc) => (
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
              {supplierDocuments.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-zinc-400 italic font-sans text-xs">
                    No purchase records found for this supplier.
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
