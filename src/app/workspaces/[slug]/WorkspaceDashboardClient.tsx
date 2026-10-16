"use client";

import { useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { OnboardingTracker } from "./OnboardingTracker";
import { DashboardRevenueChart, type WeekRevenueBucket } from "./DashboardRevenueChart";
import { LowStockAlertBanner } from "@/components/LowStockAlertBanner";
import { RecurringInvoicesWidget } from "./RecurringInvoicesWidget";
import { QuickCreatePopover } from "./QuickCreatePopover";
import { useDashboardSummary } from "@/hooks/useWorkspaces";
import { Spinner } from "@/components/Spinner";
import { DocumentsTableClient, type StreamDocument } from "./documents/DocumentsTableClient";
import {
  TrendingUp,
  Clock,
  Star,
  Activity,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

interface WorkspaceDashboardClientProps {
  shop: any;
  shopSlug: string;
}

export function WorkspaceDashboardClient({ shop, shopSlug }: WorkspaceDashboardClientProps) {
  const { data: dashboard, isLoading } = useDashboardSummary(shop.id);

  const {
    recentDocs,
    allDocs,
    streamDocs,
    allProducts,
    recurringInvoices,
    weeks,
    revenueMtd,
    totalRevenueAllTime,
    pendingReceivables,
    overdueReceivables,
    overdueCount,
    topClient,
    openQuotesCount,
    clientCount,
    paymentCount,
    productCount,
    lowStockItems,
  } = useMemo(() => {
    const rawDashboard = dashboard || {};
    const recent = rawDashboard.recentDocs || [];
    const docs = rawDashboard.allDocs || [];
    const products = rawDashboard.allProducts || [];
    const recInv = (rawDashboard.recurringInvoices || []).map((r: any) => ({
      ...r,
      nextRecurringDate: r.nextRecurringDate ? new Date(r.nextRecurringDate) : null,
      createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
    }));

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 30-day weekly buckets
    const w: WeekRevenueBucket[] = [];
    for (let i = 3; i >= 0; i--) {
      const end = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      const label = i === 0 ? "This Week" : i === 1 ? "1 Wk Ago" : `${i} Wks Ago`;

      let paidAmount = 0;
      let issuedAmount = 0;

      docs.forEach((d: any) => {
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

      w.push({
        label,
        startDate: start.toLocaleDateString("en-KE", { month: "short", day: "numeric" }),
        endDate: end.toLocaleDateString("en-KE", { month: "short", day: "numeric" }),
        paidAmount,
        issuedAmount,
      });
    }

    let totRev = 0;
    let revMtd = 0;
    let pendRec = 0;
    let overRec = 0;
    let overCount = 0;
    let quotesCount = 0;
    const clientMap: Record<string, { name: string; totalPaid: number }> = {};

    docs.forEach((d: any) => {
      const val = parseFloat(d.grandTotal || "0");
      const docDate = new Date(d.issueDate);
      const isSales = d.type === "INVOICE" || d.type === "RECEIPT";
      const isReceiptFromInvoice = d.type === "RECEIPT" && d.parentDocumentId;

      if (!isReceiptFromInvoice && (d.status === "PAID" || d.type === "RECEIPT")) {
        if (isSales) {
          totRev += val;
          if (docDate >= startOfMonth) {
            revMtd += val;
          }
          if (d.client) {
            if (!clientMap[d.client.id]) {
              clientMap[d.client.id] = { name: d.client.name, totalPaid: 0 };
            }
            clientMap[d.client.id].totalPaid += val;
          }
        }
      } else if (d.status === "ISSUED" || d.status === "PARTIALLY_PAID") {
        if (isSales) {
          pendRec += val;
          if (d.dueDate && new Date(d.dueDate) < now) {
            overRec += val;
            overCount += 1;
          }
        }
      } else if (d.status === "OVERDUE") {
        if (isSales) {
          pendRec += val;
          overRec += val;
          overCount += 1;
        }
      }

      if (d.type === "QUOTATION" && d.status !== "CANCELLED" && d.status !== "CONFIRMED") {
        quotesCount += 1;
      }
    });

    const topList = Object.values(clientMap).sort((a, b) => b.totalPaid - a.totalPaid);
    const top = topList[0] || null;

    const lowStock = products.filter(
      (p: any) => p.trackStock && parseFloat(p.stockQuantity || "0") <= parseFloat(p.reorderThreshold || "5")
    );

    const streamDocs: StreamDocument[] = (docs.length > 0 ? docs : recent).map((d: any) => ({
      id: d.id,
      docNumber: d.doc_number || d.docNumber,
      type: d.type,
      status: d.status,
      grandTotal: String(d.grand_total || d.grandTotal || "0"),
      issueDate: d.issue_date || d.issueDate,
      parentDocumentId: d.parent_document_id || d.parentDocumentId || null,
      parentDocument: d.parentDocument || null,
      requiresEtims: d.requires_etims ?? d.requiresEtims,
      kraCuInvoiceNumber: d.kra_cu_invoice_number || d.kraCuInvoiceNumber,
      client: d.client
        ? {
            id: d.client.id,
            name: d.client.name,
            email: d.client.email,
            phone: d.client.phone,
            taxPin: d.client.tax_pin || d.client.taxPin,
          }
        : null,
      supplier: d.supplier
        ? {
            id: d.supplier.id,
            name: d.supplier.name,
            email: d.supplier.email,
            phone: d.supplier.phone,
            taxPin: d.supplier.tax_pin || d.supplier.taxPin,
          }
        : null,
    }));

    return {
      recentDocs: recent,
      allDocs: docs,
      streamDocs,
      allProducts: products,
      recurringInvoices: recInv,
      weeks: w,
      revenueMtd: revMtd,
      totalRevenueAllTime: totRev,
      pendingReceivables: pendRec,
      overdueReceivables: overRec,
      overdueCount: overCount,
      topClient: top,
      openQuotesCount: quotesCount,
      clientCount: rawDashboard.clientCount ?? 0,
      paymentCount: rawDashboard.paymentCount ?? 1,
      productCount: rawDashboard.productCount ?? 0,
      lowStockItems: lowStock,
    };
  }, [dashboard]);

  if (isLoading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3">
        <Spinner size={24} />
        <p className="text-xs text-zinc-500 font-mono tracking-wider uppercase">Loading workspace dashboard...</p>
      </div>
    );

  }

  return (
    <div className="p-5 sm:p-7 space-y-6">
      {/* PAGE HEADER */}
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
          <QuickCreatePopover slug={shopSlug} />
          <Link
            href={`/workspaces/${shopSlug}/pos`}
            className="btn-secondary-modern flex items-center gap-1.5"
          >
            <ShoppingCartIcon />
            <span>POS Terminal</span>
          </Link>
        </div>
      </div>

      {/* ONBOARDING TRACKER */}
      <OnboardingTracker
        shopSlug={shopSlug}
        shopId={shop.id}
        hideOnboarding={shop.hideOnboarding}
        hasSettings={!!shop.taxPin}
        hasPayment={paymentCount > 0}
        hasProducts={productCount > 0}
        hasClients={clientCount > 0}
        hasDocuments={allDocs.length > 0}
      />

      {/* LOW STOCK ALERT */}
      <LowStockAlertBanner
        items={lowStockItems.map((p: any) => ({
          name: p.name,
          stockQuantity: p.stockQuantity,
          reorderThreshold: p.reorderThreshold,
        }))}
        shopSlug={shopSlug}
        actionHref={`/workspaces/${shopSlug}/products`}
        actionLabel="Restock Inventory →"
      />

      {/* KPI STAT CARDS */}
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
                href={`/workspaces/${shopSlug}/documents?view=pipeline`}
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
              {clientCount} active clients
            </p>
          </div>
        </div>
      </div>

      {/* 30-DAY REVENUE CHART */}
      <DashboardRevenueChart weeks={weeks} currency={shop.currency} />

      {/* RECURRING INVOICES */}
      {recurringInvoices.length > 0 && (
        <RecurringInvoicesWidget slug={shopSlug} currency={shop.currency} recurringInvoices={recurringInvoices} />
      )}

      {/* UNIFIED DOCUMENTS LEDGER STREAM */}
      <div className="space-y-3">
        <DocumentsTableClient
          slug={shopSlug}
          shopId={shop.id}
          currency={shop.currency}
          documents={streamDocs}
          embedded={true}
          title="Recent Activity & Ledger"
          maxRows={15}
        />
      </div>
    </div>
  );
}

function ShoppingCartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
    </svg>
  );
}
