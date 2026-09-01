// src/app/workspaces/[slug]/page.tsx
import { db } from "@/db";
import { shops, documents, clients, products, paymentMethods, expenses } from "@/db/schema";
import { eq, count, and, desc, gte } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { OnboardingTracker } from "./OnboardingTracker";
import { DashboardRevenueChart, type WeekRevenueBucket } from "./DashboardRevenueChart";
import { LowStockAlertBanner } from "@/components/LowStockAlertBanner";
import { getRecurringInvoices } from "@/lib/actions/recurring";
import { RecurringInvoicesWidget } from "./RecurringInvoicesWidget";
import { QuickCreatePopover } from "./QuickCreatePopover";

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

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 2. Parallel data fetching
  const [
    recentDocs,
    clientCountRes,
    productCountRes,
    allDocs,
    paymentCountRes,
    allProducts,
    allClients,
    recentExpenses,
    recurringInvoices,
  ] = await Promise.all([
    db.query.documents.findMany({
      where: eq(documents.shopId, shop.id),
      with: {
        client: true,
        supplier: true,
      },
      orderBy: [desc(documents.issueDate)],
      limit: 6,
    }),
    db.select({ value: count() }).from(clients).where(eq(clients.shopId, shop.id)),
    db.select({ value: count() }).from(products).where(eq(products.shopId, shop.id)),
    db.query.documents.findMany({
      where: eq(documents.shopId, shop.id),
      with: { client: true },
    }),
    db.select({ value: count() }).from(paymentMethods).where(eq(paymentMethods.shopId, shop.id)),
    db.query.products.findMany({
      where: eq(products.shopId, shop.id),
    }),
    db.query.clients.findMany({
      where: eq(clients.shopId, shop.id),
    }),
    db.query.expenses.findMany({
      where: eq(expenses.shopId, shop.id),
      orderBy: [desc(expenses.expenseDate)],
      limit: 4,
    }),
    getRecurringInvoices(shop.id),
  ]);

  // 3. Compute 30-day weekly buckets
  const weeks: WeekRevenueBucket[] = [];
  for (let i = 3; i >= 0; i--) {
    const end = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    const label = i === 0 ? "This Week" : i === 1 ? "1 Wk Ago" : `${i} Wks Ago`;

    let paidAmount = 0;
    let issuedAmount = 0;

    allDocs.forEach((d) => {
      const issueTime = new Date(d.issueDate).getTime();
      const val = parseFloat(d.grandTotal || "0");
      if (issueTime >= start.getTime() && issueTime <= end.getTime()) {
        if (d.status === "PAID" || d.type === "RECEIPT") {
          paidAmount += val;
        } else if (d.status === "ISSUED" || d.status === "OVERDUE" || d.status === "PARTIALLY_PAID") {
          issuedAmount += val;
        }
      }
    });

    weeks.push({
      label,
      startDate: start.toLocaleDateString("en-KE", { month: "short", day: "numeric" }),
      endDate: end.toLocaleDateString("en-KE", { month: "short", day: "numeric" }),
      paidAmount,
      issuedAmount,
    });
  }

  // 4. Compute Metrics
  let totalRevenueAllTime = 0;
  let revenueMtd = 0;
  let pendingReceivables = 0;
  let overdueReceivables = 0;
  let overdueCount = 0;
  let openQuotesCount = 0;

  // Track client revenue for Top Client KPI
  const clientRevenueMap: Record<string, { name: string; totalPaid: number }> = {};

  allDocs.forEach((d) => {
    const val = parseFloat(d.grandTotal || "0");
    const docDate = new Date(d.issueDate);

    if (d.status === "PAID" || d.type === "RECEIPT") {
      totalRevenueAllTime += val;
      if (docDate >= startOfMonth) {
        revenueMtd += val;
      }
      if (d.client) {
        if (!clientRevenueMap[d.client.id]) {
          clientRevenueMap[d.client.id] = { name: d.client.name, totalPaid: 0 };
        }
        clientRevenueMap[d.client.id].totalPaid += val;
      }
    } else if (d.status === "ISSUED" || d.status === "PARTIALLY_PAID") {
      pendingReceivables += val;
      if (d.dueDate && new Date(d.dueDate) < now) {
        overdueReceivables += val;
        overdueCount += 1;
      }
    } else if (d.status === "OVERDUE") {
      pendingReceivables += val;
      overdueReceivables += val;
      overdueCount += 1;
    }

    if (d.type === "QUOTATION" && d.status !== "CANCELLED") {
      openQuotesCount += 1;
    }
  });

  // Top client
  const topClients = Object.values(clientRevenueMap).sort((a, b) => b.totalPaid - a.totalPaid);
  const topClient = topClients[0] || null;

  // Low stock check
  const lowStockItems = allProducts.filter(
    (p) => p.trackStock && parseFloat(p.stockQuantity || "0") <= parseFloat(p.reorderThreshold || "5")
  );

  return (
    <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white">

      {/* HEADER WITH QUICK ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/80 pb-6">
        <div>
          <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Executive Cockpit</span>
          <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">
            {shop.name} Overview
          </h1>
        </div>

        {/* QUICK ACTION POPOVER & SHORTCUTS */}
        <div className="flex items-center gap-2">
          <QuickCreatePopover slug={slug} />
          <Link
            href={`/workspaces/${slug}/pos`}
            className="btn-secondary-modern px-3 py-1.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
          >
            <span>🧾</span>
            <span>POS Terminal</span>
          </Link>
        </div>
      </div>

      {/* ONBOARDING TRACKER */}
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

      {/* LOW STOCK ALERT BANNER (DISMISSIBLE) */}
      <LowStockAlertBanner
        items={lowStockItems.map((p) => ({
          name: p.name,
          stockQuantity: p.stockQuantity,
          reorderThreshold: p.reorderThreshold,
        }))}
        shopSlug={slug}
        actionHref={`/workspaces/${slug}/products`}
        actionLabel="Restock Inventory →"
      />

      {/* PRIMARY KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MTD Revenue */}
        <div className="card-modern p-5 space-y-2 border-l-4 border-emerald-500 bg-white">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-zinc-400 uppercase font-bold">Revenue MTD</span>
            <span className="text-xs">💰</span>
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-emerald-700">
            {formatCurrency(revenueMtd, shop.currency)}
          </p>
          <p className="font-sans text-[11px] text-zinc-500">
            All-time: <span className="font-semibold text-black">{formatCurrency(totalRevenueAllTime, shop.currency)}</span>
          </p>
        </div>

        {/* Accounts Receivable & Overdue */}
        <div className="card-modern p-5 space-y-2 border-l-4 border-amber-500 bg-white">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[10px] text-zinc-400 uppercase font-bold">Unpaid Invoices (A/R)</span>
            <span className="text-xs">⏳</span>
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-black">
            {formatCurrency(pendingReceivables, shop.currency)}
          </p>
          <div className="flex items-center justify-between text-[11px] font-sans">
            <span className="text-rose-600 font-semibold">
              {overdueCount > 0 ? `⚠️ ${overdueCount} overdue (${formatCurrency(overdueReceivables, shop.currency)})` : "✓ 0 overdue"}
            </span>
          </div>
        </div>

        {/* Top Client */}
        <div className="card-modern p-5 space-y-2 border-l-4 border-blue-500 bg-white">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[10px] text-zinc-400 uppercase font-bold">Top Client</span>
            <span className="text-xs">👑</span>
          </div>
          {topClient ? (
            <>
              <p className="text-lg font-bold font-sans tracking-tight text-black truncate" title={topClient.name}>
                {topClient.name}
              </p>
              <p className="font-mono text-[11px] text-zinc-500">
                LTV: <span className="font-semibold text-black">{formatCurrency(topClient.totalPaid, shop.currency)}</span>
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-zinc-400 font-sans">No client revenue yet</p>
              <p className="font-sans text-[11px] text-zinc-400">Recorded after first paid invoice</p>
            </>
          )}
        </div>

        {/* Pipeline Summary */}
        <div className="card-modern p-5 space-y-2 border-l-4 border-black bg-white">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[10px] text-zinc-400 uppercase font-bold">Active Pipeline</span>
            <span className="text-xs">📋</span>
          </div>
          <p className="text-2xl font-bold font-mono tracking-tight text-black">
            {openQuotesCount} <span className="text-xs font-normal text-zinc-500 font-sans">Open Quotes</span>
          </p>
          <div className="flex items-center justify-between text-[11px] font-sans">
            <span className="text-zinc-500">{clientCountRes[0]?.value || 0} active clients</span>
            <Link href={`/workspaces/${slug}/documents?view=pipeline`} className="text-black font-semibold hover:underline">
              Pipeline →
            </Link>
          </div>
        </div>
      </div>

      {/* 30-DAY REVENUE TRAJECTORY CHART */}
      <DashboardRevenueChart weeks={weeks} currency={shop.currency} />

      {/* RECURRING INVOICES WIDGET */}
      {recurringInvoices.length > 0 && (
        <RecurringInvoicesWidget slug={slug} currency={shop.currency} recurringInvoices={recurringInvoices} />
      )}

      {/* RECENT TRANSACTIONS STREAM */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Recent Activity</span>
            <h2 className="font-sans font-semibold uppercase tracking-tight text-sm text-black mt-0.5">
              Recent Invoices &amp; Receipts
            </h2>
          </div>
          <Link
            href={`/workspaces/${slug}/documents`}
            className="font-mono text-xs font-semibold uppercase underline hover:no-underline text-black"
          >
            View All Documents →
          </Link>
        </div>

        <div className="card-modern overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
                <th className="p-4 border-r border-zinc-200">Document #</th>
                <th className="p-4 border-r border-zinc-200">Type</th>
                <th className="p-4 border-r border-zinc-200">Client / Recipient</th>
                <th className="p-4 border-r border-zinc-200 text-right">Grand Total</th>
                <th className="p-4 border-r border-zinc-200 text-center">Status</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 bg-white">
              {recentDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="p-4 border-r border-zinc-200/80 font-semibold uppercase text-black">
                    <Link href={`/workspaces/${slug}/documents/${doc.id}`} className="hover:underline">
                      {doc.docNumber}
                    </Link>
                  </td>
                  <td className="p-4 border-r border-zinc-200/80">
                    <span className="badge-zinc">
                      {doc.type}
                    </span>
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 uppercase font-sans font-semibold text-zinc-900">
                    {doc.client ? (
                      <Link href={`/workspaces/${slug}/clients/${doc.client.id}`} className="hover:underline text-black">
                        {doc.client.name} ➔
                      </Link>
                    ) : doc.supplier ? (
                      <Link href={`/workspaces/${slug}/suppliers/${doc.supplier.id}`} className="hover:underline text-zinc-700">
                        {doc.supplier.name} ➔
                      </Link>
                    ) : (
                      "Walk-in Customer"
                    )}
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 text-right font-semibold text-black font-mono">
                    {formatCurrency(doc.grandTotal, shop.currency)}
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 text-center">
                    <span className={
                      doc.status === "PAID" ? "badge-emerald" :
                      doc.status === "ISSUED" ? "badge-zinc" :
                      doc.status === "OVERDUE" ? "badge-rose" :
                      doc.status === "PARTIALLY_PAID" ? "badge-amber" :
                      "badge-zinc text-zinc-400"
                    }>
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

              {recentDocs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-zinc-400 italic font-sans text-xs">
                    No recent transactions recorded yet.
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
