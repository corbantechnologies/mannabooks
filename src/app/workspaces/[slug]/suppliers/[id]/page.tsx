// src/app/workspaces/[slug]/suppliers/[id]/page.tsx
import { db } from "@/db";
import { suppliers, documents, shops } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { EditSupplierModal } from "../EditSupplierModal";

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

  // 2. Locate targeted supplier node
  const supplierRecord = await db.query.suppliers.findFirst({
    where: and(eq(suppliers.id, id), eq(suppliers.shopId, shop.id)),
  });

  if (!supplierRecord) {
    notFound();
  }

  // 3. Fetch all historical procurement documents linked to this supplier
  const supplierDocuments = await db.query.documents.findMany({
    where: and(eq(documents.supplierId, id), eq(documents.shopId, shop.id)),
    orderBy: [desc(documents.issueDate)],
  });

  // Calculate procurement financial metrics
  let totalProcurementSpend = 0;
  let accountsPayableDebt = 0;

  supplierDocuments.forEach((doc) => {
    const val = parseFloat(doc.grandTotal);
    if (doc.status === "PAID") {
      totalProcurementSpend += val;
    } else if (doc.status === "SENT" || doc.status === "OVERDUE") {
      accountsPayableDebt += val;
    }
  });

  return (
    <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white font-mono">
      {/* NAVIGATION & HEADER BLOCK */}
      <div className="border-b border-black pb-6 space-y-2">
        <Link
          href={`/workspaces/${slug}/suppliers`}
          className="text-xs font-bold text-zinc-400 hover:underline block"
        >
          {"<-"} BACK TO SUPPLIER NETWORK
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
          <div>
            <span className="text-xs text-zinc-400">SUPPLIER_NODE // PROCUREMENT_SUMMARY</span>
            <h1 className="text-3xl font-bold uppercase tracking-tighter mt-1">{supplierRecord.name}</h1>
            <p className="text-xs text-zinc-500 lowercase mt-0.5">&gt; id: {supplierRecord.id}</p>
          </div>

          <div className="flex items-center gap-2 text-[10px]">
            <span className="border border-black px-2 py-1 bg-zinc-50 font-bold uppercase">
              Class: {supplierRecord.supplierType}
            </span>
            {supplierRecord.taxPin && (
              <span className="bg-black text-white px-2 py-1 font-bold uppercase tracking-wide">
                PIN: {supplierRecord.taxPin}
              </span>
            )}
            {supplierRecord.requiresEtims && (
              <span className="border border-black bg-zinc-50 text-black px-2 py-1 font-bold uppercase tracking-wide">
                eTIMS Required
              </span>
            )}
            <Link
              href={`/workspaces/${slug}/documents/new?supplierId=${supplierRecord.id}`}
              className="bg-black text-white border border-black px-3 py-1 font-bold uppercase tracking-wider hover:bg-zinc-900 transition-colors"
            >
              + Generate Document
            </Link>
            <EditSupplierModal
              supplier={supplierRecord}
              shopId={shop.id}
              shopSlug={slug}
              redirectToDirectoryAfterDelete={true}
            />
          </div>
        </div>
      </div>

      {/* FINANCIAL SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 border border-black divide-y md:divide-y-0 md:divide-x divide-black bg-white">
        <div className="p-6 space-y-1">
          <p className="text-xs text-zinc-400 uppercase">Total Procurement Spend</p>
          <p className="text-2xl font-bold tracking-tight text-black">
            {formatCurrency(totalProcurementSpend, shop.currency)}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Total settled procurement orders to date.</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="text-xs text-zinc-400 uppercase">Accounts Payable Debt</p>
          <p className="text-2xl font-bold tracking-tight text-black">
            {formatCurrency(accountsPayableDebt, shop.currency)}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Outstanding pending payment vouchers &amp; bills.</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="text-xs text-zinc-400 uppercase">Payment Terms</p>
          <p className="text-xl font-bold uppercase tracking-tight text-black">
            {supplierRecord.paymentTerms || "NET_30"}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Agreed credit maturity timeframe.</p>
        </div>
      </div>

      {/* PROCUREMENT SUB-LEDGER TABLE */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold uppercase tracking-wider">&gt; Supplier Procurement Ledger</h2>
          <span className="text-[10px] text-zinc-400 uppercase">
            Total Documents: {supplierDocuments.length}
          </span>
        </div>

        <div className="border border-black bg-white overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-black uppercase tracking-wider font-bold">
                <th className="p-4 border-r border-black">Serial #</th>
                <th className="p-4 border-r border-black">Doc Type</th>
                <th className="p-4 border-r border-black">Status</th>
                <th className="p-4 border-r border-black">Issue Date</th>
                <th className="p-4 border-r border-black text-right">Grand Total</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              {supplierDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="p-4 border-r border-black font-bold">
                    <Link
                      href={`/workspaces/${slug}/documents/${doc.id}`}
                      className="hover:underline text-black"
                    >
                      {doc.docNumber}
                    </Link>
                  </td>
                  <td className="p-4 border-r border-black uppercase">{doc.type}</td>
                  <td className="p-4 border-r border-black">
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase border ${
                      doc.status === "PAID" ? "bg-black text-white border-black" :
                      doc.status === "SENT" ? "bg-white text-black border-black" :
                      doc.status === "OVERDUE" ? "bg-zinc-100 border-rose-600 border-dashed text-rose-700" :
                      "bg-zinc-50 text-zinc-400 border-zinc-200"
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="p-4 border-r border-black">
                    {new Date(doc.issueDate).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                  </td>
                  <td className="p-4 border-r border-black text-right font-bold">
                    {formatCurrency(doc.grandTotal, shop.currency)}
                  </td>
                  <td className="p-4 text-center">
                    <Link
                      href={`/workspaces/${slug}/documents/${doc.id}`}
                      className="border border-black bg-white px-2 py-1 text-[10px] font-bold uppercase hover:bg-black hover:text-white transition-colors"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}

              {supplierDocuments.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-zinc-400 italic">
                    &gt; NO PROCUREMENT DOCUMENTS LINKED TO THIS SUPPLIER RECORD.
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
