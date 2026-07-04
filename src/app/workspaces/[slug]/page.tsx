// src/app/workspaces/[slug]/page.tsx
import { db } from "@/db";
import { shops, documents, clients, products } from "@/db/schema";
import { eq, count, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface WorkspaceOverviewPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceOverviewPage({ params }: WorkspaceOverviewPageProps) {
  const { slug } = await params;

  // 1. Resolve shop context
  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) {
    notFound();
  }

  // 2. Fetch documents, clients, and products metrics concurrently in parallel
  const [shopDocs, clientCountRes, productCountRes, allDocs] = await Promise.all([
    db.query.documents.findMany({
      where: eq(documents.shopId, shop.id),
      with: {
        client: true,
      },
      orderBy: (docs, { desc }) => [desc(docs.createdAt)],
      limit: 5,
    }),
    db.select({ value: count() }).from(clients).where(eq(clients.shopId, shop.id)),
    db.select({ value: count() }).from(products).where(eq(products.shopId, shop.id)),
    db.query.documents.findMany({
      where: eq(documents.shopId, shop.id),
    }),
  ]);

  // Compute metrics
  let totalRevenue = 0;
  let pendingAmount = 0;
  let draftCount = 0;

  allDocs.forEach((d) => {
    const val = parseFloat(d.grandTotal || "0");
    if (d.status === "PAID") {
      totalRevenue += val;
    } else if (d.status === "SENT" || d.status === "OVERDUE") {
      pendingAmount += val;
    } else if (d.status === "DRAFT") {
      draftCount += 1;
    }
  });

  return (
    <div className="p-4 sm:p-8 space-y-10 selection:bg-black selection:text-white">

      {/* HEADER TITLE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black pb-6">
        <div>
          <span className="font-mono text-xs text-zinc-400">WORKSPACE_NODE // FINANCIAL_OVERVIEW</span>
          <h1 className="text-3xl font-bold uppercase tracking-tighter mt-1">{shop.name} Overview</h1>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/workspaces/${slug}/documents/new`}
            className="bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-zinc-900 transition-colors border border-black"
          >
            + Generate Document
          </Link>
        </div>
      </div>

      {/* METRIC CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-black divide-y sm:divide-y-0 sm:divide-x divide-black bg-white">
        <div className="p-6 space-y-1">
          <p className="font-mono text-[10px] text-zinc-400 uppercase">Settled Revenue (Paid)</p>
          <p className="text-2xl font-bold font-mono tracking-tight text-black">
            {formatCurrency(totalRevenue, shop.currency)}
          </p>
          <p className="font-mono text-[10px] text-emerald-700">Remitted Cash Flow</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="font-mono text-[10px] text-zinc-400 uppercase">Pending Remittance</p>
          <p className="text-2xl font-bold font-mono tracking-tight text-black">
            {formatCurrency(pendingAmount, shop.currency)}
          </p>
          <p className="font-mono text-[10px] text-amber-700">Sent &amp; Overdue Invoices</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="font-mono text-[10px] text-zinc-400 uppercase">Active Client Directory</p>
          <p className="text-2xl font-bold font-mono tracking-tight text-black">
            {clientCountRes[0]?.value || 0}
          </p>
          <Link href={`/workspaces/${slug}/clients`} className="font-mono text-[10px] text-zinc-500 hover:underline block">
            View Client Flow →
          </Link>
        </div>

        <div className="p-6 space-y-1">
          <p className="font-mono text-[10px] text-zinc-400 uppercase">Catalog Items</p>
          <p className="text-2xl font-bold font-mono tracking-tight text-black">
            {productCountRes[0]?.value || 0}
          </p>
          <Link href={`/workspaces/${slug}/products`} className="font-mono text-[10px] text-zinc-500 hover:underline block">
            Manage Catalog →
          </Link>
        </div>
      </div>

      {/* RECENT TRANSACTIONS STREAM */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-mono font-bold uppercase tracking-tight text-sm">&gt; Recent Transactions</h2>
          <Link
            href={`/workspaces/${slug}/documents`}
            className="font-mono text-xs font-bold uppercase underline hover:no-underline"
          >
            View Fiscal Ledgers →
          </Link>
        </div>

        <div className="border border-black bg-white overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-black uppercase tracking-wider font-bold">
                <th className="p-4 border-r border-black">Document Serial</th>
                <th className="p-4 border-r border-black">Type</th>
                <th className="p-4 border-r border-black">Client</th>
                <th className="p-4 border-r border-black text-right">Grand Total</th>
                <th className="p-4 border-r border-black text-center">Status</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              {shopDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="p-4 border-r border-black font-bold uppercase">
                    <Link href={`/workspaces/${slug}/documents/${doc.id}`} className="hover:underline">
                      {doc.docNumber}
                    </Link>
                  </td>
                  <td className="p-4 border-r border-black uppercase text-zinc-600">{doc.type}</td>
                  <td className="p-4 border-r border-black uppercase font-sans font-bold">{doc.client.name}</td>
                  <td className="p-4 border-r border-black text-right font-bold">
                    {formatCurrency(doc.grandTotal, shop.currency)}
                  </td>
                  <td className="p-4 border-r border-black text-center">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase border ${
                      doc.status === "PAID" ? "bg-black text-white border-black" :
                      doc.status === "SENT" ? "bg-white text-black border-black" :
                      doc.status === "OVERDUE" ? "bg-zinc-100 border-rose-600 border-dashed text-rose-700" :
                      "bg-zinc-50 text-zinc-400 border-zinc-200"
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <Link
                      href={`/workspaces/${slug}/documents/${doc.id}`}
                      className="border border-black px-2 py-1 text-[10px] font-bold uppercase hover:bg-black hover:text-white transition-colors"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}

              {shopDocs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-zinc-400 italic">
                    &gt; NO RECENT TRANSACTIONS LOCATED IN WORKSPACE LEDGER.
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
