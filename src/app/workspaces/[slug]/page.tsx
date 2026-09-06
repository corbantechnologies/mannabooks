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
import {
  TrendingUp, Clock, Star, Activity, ChevronRight,
  FileText, Receipt, FileCheck, AlertCircle, Plus
} from "lucide-react";

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
      const isSales = d.type === "INVOICE" || d.type === "RECEIPT";
      if (!isSales) return;
      if (d.type === "RECEIPT" && d.parentDocumentId) return;

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
    const isSales = d.type === "INVOICE" || d.type === "RECEIPT";
    const isReceiptFromInvoice = d.type === "RECEIPT" && d.parentDocumentId;

    if (!isReceiptFromInvoice && (d.status === "PAID" || d.type === "RECEIPT")) {
      if (isSales) {
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
      }
    } else if (d.status === "ISSUED" || d.status === "PARTIALLY_PAID") {
      if (isSales) {
        pendingReceivables += val;
        if (d.dueDate && new Date(d.dueDate) < now) {
          overdueReceivables += val;
          overdueCount += 1;
        }
      }
    } else if (d.status === "OVERDUE") {
      if (isSales) {
        pendingReceivables += val;
        overdueReceivables += val;
        overdueCount += 1;
      }
    }

    if (d.type === "QUOTATION" && d.status !== "CANCELLED" && d.status !== "CONFIRMED") {
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
    <div className="p-5 sm:p-7 space-y-6">

      {/* ── PAGE HEADER ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs text-zinc-400 font-medium">
            {new Date().toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">
            {shop.name}
          </h1>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <QuickCreatePopover slug={slug} />
          <Link
            href={`/workspaces/${slug}/pos`}
            className="btn-secondary-modern flex items-center gap-1.5"
          >
            <ShoppingCartIcon />
            <span>POS Terminal</span>
          </Link>
        </div>
      </div>

      {/* ── ONBOARDING TRACKER ────────────────────────────────── */}
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

      {/* ── LOW STOCK ALERT ───────────────────────────────────── */}
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

      {/* ── KPI STAT CARDS ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Revenue MTD */}
        <div className="stat-card p-5">
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{ background: "radial-gradient(circle at 110% -10%, #10b981 0%, transparent 55%)" }}
          />
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-emerald-50">
                <TrendingUp className="w-4 h-4 text-emerald-600" strokeWidth={2} />
              </div>
              <span className="text-[10px] text-zinc-400 font-medium">This month</span>
            </div>
            <p className="text-[22px] font-bold font-mono tracking-tight text-zinc-900 leading-none">
              {formatCurrency(revenueMtd, shop.currency)}
            </p>
            <p className="text-[11px] font-medium text-zinc-500 mt-1.5">Revenue collected</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              All-time:{" "}
              <span className="font-semibold text-zinc-600">
                {formatCurrency(totalRevenueAllTime, shop.currency)}
              </span>
            </p>
          </div>
        </div>

        {/* Unpaid Invoices A/R */}
        <div className="stat-card p-5">
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{ background: "radial-gradient(circle at 110% -10%, #f59e0b 0%, transparent 55%)" }}
          />
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <Clock className="w-4 h-4 text-amber-600" strokeWidth={2} />
              </div>
              <span className="text-[10px] text-zinc-400 font-medium">Outstanding</span>
            </div>
            <p className="text-[22px] font-bold font-mono tracking-tight text-zinc-900 leading-none">
              {formatCurrency(pendingReceivables, shop.currency)}
            </p>
            <p className="text-[11px] font-medium text-zinc-500 mt-1.5">Pending collections</p>
            {overdueCount > 0 ? (
              <p className="text-[10px] text-rose-500 font-semibold mt-0.5">
                <AlertCircle className="w-3 h-3 inline mr-0.5" />
                {overdueCount} overdue — {formatCurrency(overdueReceivables, shop.currency)}
              </p>
            ) : (
              <p className="text-[10px] text-emerald-500 font-medium mt-0.5">✓ No overdue invoices</p>
            )}
          </div>
        </div>

        {/* Top Client */}
        <div className="stat-card p-5">
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{ background: "radial-gradient(circle at 110% -10%, #3b82f6 0%, transparent 55%)" }}
          />
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Star className="w-4 h-4 text-blue-500" strokeWidth={2} />
              </div>
              <span className="text-[10px] text-zinc-400 font-medium">All-time LTV</span>
            </div>
            {topClient ? (
              <>
                <p
                  className="text-[17px] font-bold text-zinc-900 leading-tight truncate"
                  title={topClient.name}
                >
                  {topClient.name}
                </p>
                <p className="text-[11px] font-medium text-zinc-500 mt-1.5">Top client</p>
                <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                  {formatCurrency(topClient.totalPaid, shop.currency)} lifetime
                </p>
              </>
            ) : (
              <>
                <p className="text-[15px] font-semibold text-zinc-300">No data yet</p>
                <p className="text-[11px] text-zinc-400 mt-1.5">Appears after first paid invoice</p>
              </>
            )}
          </div>
        </div>

        {/* Active Pipeline */}
        <div className="stat-card p-5">
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{ background: "radial-gradient(circle at 110% -10%, #8b5cf6 0%, transparent 55%)" }}
          />
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-violet-50">
                <Activity className="w-4 h-4 text-violet-500" strokeWidth={2} />
              </div>
              <Link
                href={`/workspaces/${slug}/documents?view=pipeline`}
                className="text-[10px] text-zinc-400 font-medium hover:text-zinc-700 no-underline transition-colors"
              >
                View →
              </Link>
            </div>
            <p className="text-[22px] font-bold font-mono tracking-tight text-zinc-900 leading-none">
              {openQuotesCount}
            </p>
            <p className="text-[11px] font-medium text-zinc-500 mt-1.5">Open quotations</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              {clientCountRes[0]?.value || 0} active clients
            </p>
          </div>
        </div>
      </div>

      {/* ── 30-DAY REVENUE CHART ──────────────────────────────── */}
      <DashboardRevenueChart weeks={weeks} currency={shop.currency} />

      {/* ── RECURRING INVOICES ────────────────────────────────── */}
      {recurringInvoices.length > 0 && (
        <RecurringInvoicesWidget slug={slug} currency={shop.currency} recurringInvoices={recurringInvoices} />
      )}

      {/* ── RECENT TRANSACTIONS ───────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-400 font-medium">Recent Activity</p>
            <h2 className="text-[15px] font-semibold text-zinc-900 mt-0.5">
              Latest Invoices &amp; Receipts
            </h2>
          </div>
          <Link
            href={`/workspaces/${slug}/documents`}
            className="text-[12px] font-semibold text-zinc-500 hover:text-zinc-900 transition-colors no-underline flex items-center gap-1"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Row card list */}
        <div className="space-y-2">
          {recentDocs.map((doc) => {
            const docTypeIcon =
              doc.type === "RECEIPT" ? Receipt :
              doc.type === "QUOTATION" ? FileCheck :
              FileText;
            const DocTypeIcon = docTypeIcon;

            const statusColor =
              doc.status === "PAID" ? "badge-emerald" :
              doc.status === "OVERDUE" ? "badge-rose" :
              doc.status === "PARTIALLY_PAID" ? "badge-amber" :
              "badge-zinc";

            return (
              <Link
                key={doc.id}
                href={`/workspaces/${slug}/documents/${doc.id}`}
                className="flex items-center gap-3 sm:gap-4 p-3.5 bg-white rounded-xl border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all group no-underline"
              >
                {/* Type icon */}
                <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 group-hover:border-zinc-200 transition-colors">
                  <DocTypeIcon className="w-3.5 h-3.5 text-zinc-400" strokeWidth={2} />
                </div>

                {/* Doc info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[12px] font-bold text-zinc-900">
                      {doc.docNumber}
                    </span>
                    <span className="badge-zinc">{doc.type}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-medium">
                    {doc.client
                      ? doc.client.name
                      : doc.supplier
                      ? doc.supplier.name
                      : "Walk-in Customer"}
                  </p>
                </div>

                {/* Amount + Status */}
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="font-mono text-[13px] font-bold text-zinc-900">
                    {formatCurrency(doc.grandTotal, shop.currency)}
                  </p>
                  <span className={`${statusColor} mt-1`}>{doc.status}</span>
                </div>

                {/* Date (hidden on mobile) */}
                <p className="text-[10px] text-zinc-400 font-mono shrink-0 hidden md:block w-20 text-right">
                  {new Date(doc.issueDate).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                </p>

                {/* Arrow */}
                <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0" />
              </Link>
            );
          })}

          {recentDocs.length === 0 && (
            <div className="bg-white rounded-xl border border-zinc-100 p-10 text-center">
              <FileText className="w-8 h-8 text-zinc-200 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-sm font-medium text-zinc-400">No recent transactions yet</p>
              <Link
                href={`/workspaces/${slug}/documents/new`}
                className="btn-primary-modern mt-4 inline-flex"
              >
                Create your first document
              </Link>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

// Inline POS icon to avoid adding it to the top import list
function ShoppingCartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
    </svg>
  );
}

