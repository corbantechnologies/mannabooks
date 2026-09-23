// src/app/workspaces/[slug]/crm/contracts/[id]/page.tsx
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getContractByIdAction, getContractBurndownAction } from "@/lib/actions/contracts";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft, Briefcase, AlertTriangle, Clock,
  TrendingDown, RotateCcw, Calendar, CheckCircle2,
} from "lucide-react";
import { ContractBurndownWidget } from "./ContractBurndownWidget";
import { LogHoursForm } from "./LogHoursForm";

interface ContractDetailPageProps {
  params: Promise<{ slug: string; id: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#10b981",
  PAUSED: "#f59e0b",
  EXPIRED: "#ef4444",
  CANCELLED: "#6b7280",
};

export default async function ContractDetailPage({ params }: ContractDetailPageProps) {
  const { slug, id } = await params;

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (!shop) notFound();

  const [contractRes, burndownRes] = await Promise.all([
    getContractByIdAction(id, shop.id),
    getContractBurndownAction(id, shop.id),
  ]);

  if (!contractRes.contract) notFound();
  const contract = contractRes.contract;
  const burndown = burndownRes.data;

  const statusColor = STATUS_COLORS[contract.status] || "#94a3b8";
  const isRetainer = contract.isRetainerHours;
  const monthlyFee = parseFloat(String(contract.monthlyFee));
  const daysLeft = contract.endDate
    ? Math.round((new Date(contract.endDate).getTime() - Date.now()) / 86400000)
    : null;

  const brandColor = shop.primaryColor || "#064e3b";

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Breadcrumb */}
      <Link
        href={`/workspaces/${slug}/crm/contracts`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Contracts
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-gray-400">{contract.contractNumber}</span>
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ color: statusColor, backgroundColor: `${statusColor}18` }}
            >
              {contract.status}
            </span>
            {daysLeft !== null && daysLeft <= 30 && daysLeft > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-amber-500 font-medium">
                <AlertTriangle className="w-3 h-3" /> Expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{contract.title}</h1>
          {contract.client && (
            <Link
              href={`/workspaces/${slug}/clients/${contract.client.id}`}
              className="text-sm text-gray-500 hover:underline mt-0.5 block"
            >
              {contract.client.name}
            </Link>
          )}
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {contract.deal && (
            <Link
              href={`/workspaces/${slug}/crm/deals/${contract.deal.id}`}
              className="flex items-center gap-1.5 px-3 py-2 text-xs border border-gray-200 dark:border-white/10 rounded-lg text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"
            >
              <Briefcase className="w-3 h-3" /> Linked Deal
            </Link>
          )}
          <Link
            href={`/workspaces/${slug}/projects/new?contractId=${contract.id}`}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-white"
            style={{ backgroundColor: brandColor }}
          >
            + New Project
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Left column — contract info */}
        <div className="md:col-span-1 space-y-4">
          {/* Billing snapshot */}
          <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 p-5 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Billing</h3>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Monthly Fee</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatCurrency(monthlyFee, contract.currency)}
                </span>
              </div>
              {isRetainer && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Hours / Month</span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {contract.monthlyHoursAllocated}h
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Rate / Hour</span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {formatCurrency(parseFloat(String(contract.hourlyRate)), contract.currency)}
                    </span>
                  </div>
                </>
              )}
              {contract.autoInvoiceEnabled && (
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/8">
                  <RotateCcw className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    Auto-invoices on day {contract.billingDayOfMonth} monthly
                  </span>
                </div>
              )}
              {contract.nextBillingDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    Next bill: <strong className="text-gray-700 dark:text-gray-300">
                      {new Date(contract.nextBillingDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Contract term */}
          <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 p-5 space-y-2.5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Term</h3>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Start</span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {contract.startDate ? new Date(contract.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">End</span>
                <span className={`text-xs font-medium ${daysLeft !== null && daysLeft <= 30 && daysLeft > 0 ? "text-amber-500" : "text-gray-700 dark:text-gray-300"}`}>
                  {contract.endDate ? new Date(contract.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Open-ended"}
                </span>
              </div>
            </div>
          </div>

          {/* Linked projects */}
          {contract.projects && contract.projects.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 p-5 space-y-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Projects</h3>
              {contract.projects.map((p: any) => (
                <Link
                  key={p.id}
                  href={`/workspaces/${slug}/projects/${p.id}`}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
                >
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{p.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-white/8 dark:text-gray-400 font-medium shrink-0 ml-2">
                    {p.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="md:col-span-2 space-y-5">
          {/* Hours burn-down (retainer only) */}
          {isRetainer && burndown && (
            <ContractBurndownWidget
              allocated={burndown.allocated}
              usedThisMonth={burndown.usedThisMonth}
              remaining={burndown.remaining}
              overrun={burndown.overrun}
              pctUsed={burndown.pctUsed}
              billingMonth={burndown.billingMonth}
              logs={burndown.logs as any[]}
              currency={contract.currency}
              hourlyRate={parseFloat(String(contract.hourlyRate))}
            />
          )}

          {/* Log hours form (retainer) */}
          {isRetainer && contract.status === "ACTIVE" && (
            <LogHoursForm
              contractId={contract.id}
              shopId={shop.id}
              shopSlug={slug}
              brandColor={brandColor}
            />
          )}

          {/* Hours log history */}
          {contract.hoursLog && contract.hoursLog.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-white/5">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Hours Log</h3>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-white/5 max-h-64 overflow-y-auto">
                {contract.hoursLog.map((log: any) => (
                  <div key={log.id} className="flex items-center gap-3 p-3.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 dark:text-white truncate">{log.description}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {log.logDate} · by {log.loggedBy?.name || "Staff"}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white shrink-0">
                      {log.hoursUsed}h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Terms & Conditions */}
          {contract.termsAndConditions && (
            <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Terms & Conditions</h3>
              <p className="text-xs text-gray-500 leading-6 whitespace-pre-line">{contract.termsAndConditions}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
