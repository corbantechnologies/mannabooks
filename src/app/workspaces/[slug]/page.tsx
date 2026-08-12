// src/app/workspaces/[slug]/page.tsx
import { db } from "@/db";
import { shops, documents, clients, products, paymentMethods } from "@/db/schema";
import { eq, count, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { OnboardingTracker } from "./OnboardingTracker";

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
  const [shopDocs, clientCountRes, productCountRes, allDocs, paymentCountRes] = await Promise.all([
    db.query.documents.findMany({
      where: eq(documents.shopId, shop.id),
      with: {
        client: true,
        supplier: true,
      },
      orderBy: (docs, { desc }) => [desc(docs.createdAt)],
      limit: 5,
    }),
    db.select({ value: count() }).from(clients).where(eq(clients.shopId, shop.id)),
    db.select({ value: count() }).from(products).where(eq(products.shopId, shop.id)),
    db.query.documents.findMany({
      where: eq(documents.shopId, shop.id),
    }),
    db.select({ value: count() }).from(paymentMethods).where(eq(paymentMethods.shopId, shop.id)),
  ]);

  // Compute metrics
  let totalRevenue = 0;
  let pendingAmount = 0;
  let draftCount = 0;

  allDocs.forEach((d) => {
    const val = parseFloat(d.grandTotal || "0");
    if (d.status === "PAID") {
      totalRevenue += val;
    } else if (d.status === "ISSUED" || d.status === "OVERDUE") {
      pendingAmount += val;
    } else if (d.status === "DRAFT") {
      draftCount += 1;
    }
  });

  return (
    <div className="p-4 sm:p-8 space-y-10 selection:bg-black selection:text-white">

      {/* HEADER TITLE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/80 pb-6">
        <div>
          <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Financial Summary</span>
          <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">{shop.name} Overview</h1>
        </div>
      </div>

      <OnboardingTracker 
        shopSlug={slug}
        shopId={shop.id}
        hideOnboarding={shop.hideOnboarding}
        hasSettings={!!shop.taxPin}
        hasPayment={(paymentCountRes[0]?.value || 0) > 0}
        hasProducts={(productCountRes[0]?.value || 0) > 0}
        hasClients={(clientCountRes[0]?.value || 0) > 0}
        hasDocuments={allDocs.length > 0}
      />

      {/* METRIC CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 card-modern divide-y sm:divide-y-0 sm:divide-x divide-zinc-200/80 bg-white">
        <div className="p-6 space-y-1">
          <p className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">Settled Revenue (Paid)</p>
          <p className="text-xl font-semibold tracking-tight text-black font-sans">
            {formatCurrency(totalRevenue, shop.currency)}
          </p>
          <p className="font-mono text-[10px] text-emerald-700">Remitted Cash Flow</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">Pending Remittance</p>
          <p className="text-xl font-semibold tracking-tight text-black font-sans">
            {formatCurrency(pendingAmount, shop.currency)}
          </p>
          <p className="font-mono text-[10px] text-amber-700">Sent &amp; Overdue Invoices</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">Active Client Directory</p>
          <p className="text-xl font-semibold tracking-tight text-black font-sans">
            {clientCountRes[0]?.value || 0}
          </p>
          <Link href={`/workspaces/${slug}/clients`} className="font-mono text-[10px] text-zinc-500 hover:underline block">
            View Client Flow →
          </Link>
        </div>

        <div className="p-6 space-y-1">
          <p className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">Catalog Items</p>
          <p className="text-xl font-semibold tracking-tight text-black font-sans">
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
          <h2 className="font-sans font-semibold uppercase tracking-tight text-sm text-black">&gt; Recent Transactions</h2>
          <Link
            href={`/workspaces/${slug}/documents`}
            className="font-mono text-xs font-semibold uppercase underline hover:no-underline text-black"
          >
            View Fiscal Ledgers →
          </Link>
        </div>

        <div className="card-modern overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
                <th className="p-4 border-r border-zinc-200">Document Serial</th>
                <th className="p-4 border-r border-zinc-200">Type</th>
                <th className="p-4 border-r border-zinc-200">Client</th>
                <th className="p-4 border-r border-zinc-200 text-right">Grand Total</th>
                <th className="p-4 border-r border-zinc-200 text-center">Status</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 bg-white">
              {shopDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="p-4 border-r border-zinc-200/80 font-semibold uppercase text-black">
                    <Link href={`/workspaces/${slug}/documents/${doc.id}`} className="hover:underline">
                      {doc.docNumber}
                    </Link>
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 uppercase text-zinc-600">{doc.type}</td>
                  <td className="p-4 border-r border-zinc-200/80 uppercase font-sans font-semibold text-zinc-900">
                    {doc.client?.name || doc.supplier?.name || "General Contact"}
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 text-right font-semibold text-black">
                    {formatCurrency(doc.grandTotal, shop.currency)}
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 text-center">
                    <span className={`px-2.5 py-0.5 text-[10px] font-semibold uppercase border rounded ${
                      doc.status === "PAID" ? "bg-black text-white border-black" :
                      doc.status === "ISSUED" ? "bg-white text-black border-zinc-300 font-semibold" :
                      doc.status === "OVERDUE" ? "bg-rose-50 border-rose-300 text-rose-700 font-semibold" :
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
