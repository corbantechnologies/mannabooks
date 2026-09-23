// src/app/workspaces/[slug]/crm/contracts/page.tsx
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getContractsByShopAction } from "@/lib/actions/contracts";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Plus, Briefcase, ArrowRight, AlertTriangle } from "lucide-react";

interface ContractsPageProps {
  params: Promise<{ slug: string }>;
}

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PAUSED: "bg-amber-100 text-amber-800",
  EXPIRED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-600",
};

export default async function ContractsListPage({ params }: ContractsPageProps) {
  const { slug } = await params;

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (!shop) notFound();

  const result = await getContractsByShopAction(shop.id);
  const allContracts = result.contracts || [];

  const activeContracts = allContracts.filter(c => c.status === "ACTIVE");
  const monthlyRecurringRevenue = activeContracts.reduce((s, c) => s + parseFloat(String(c.monthlyFee)), 0);
  const expiringIn30 = activeContracts.filter(c => {
    if (!c.endDate) return false;
    const days = Math.round((new Date(c.endDate).getTime() - Date.now()) / 86400000);
    return days <= 30 && days > 0;
  }).length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Contracts & SLAs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage retainers, SLAs, and recurring service agreements.</p>
        </div>
        <Link
          href={`/workspaces/${slug}/crm/contracts/new`}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-white shadow-sm"
          style={{ backgroundColor: shop.primaryColor || "#064e3b" }}
        >
          <Plus className="w-4 h-4" /> New Contract
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Active Contracts", value: activeContracts.length, color: "#10b981" },
          { label: "Monthly Recurring", value: formatCurrency(monthlyRecurringRevenue, shop.currency || "KES"), color: "#6366f1" },
          { label: "Expiring in 30 Days", value: expiringIn30, color: expiringIn30 > 0 ? "#ef4444" : "#94a3b8" },
          { label: "Total Contracts", value: allContracts.length, color: "#94a3b8" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className="text-xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Contracts list */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {allContracts.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No contracts yet. Create your first retainer or SLA.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {allContracts.map((c) => {
              const daysLeft = c.endDate
                ? Math.round((new Date(c.endDate).getTime() - Date.now()) / 86400000)
                : null;
              const isExpiring = daysLeft !== null && daysLeft <= 30 && daysLeft > 0;

              return (
                <Link
                  key={c.id}
                  href={`/workspaces/${slug}/crm/contracts/${c.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono text-gray-400">{c.contractNumber}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${STATUS_STYLE[c.status] || ""}`}>
                        {c.status}
                      </span>
                      {isExpiring && (
                        <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-semibold">
                          <AlertTriangle className="w-2.5 h-2.5" /> {daysLeft}d left
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{c.client?.name || "No client linked"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(parseFloat(String(c.monthlyFee)), c.currency)}<span className="text-[10px] text-gray-500 font-normal">/mo</span>
                    </p>
                    {c.isRetainerHours && (
                      <p className="text-[11px] text-gray-500 mt-0.5">{c.monthlyHoursAllocated}h/mo</p>
                    )}
                    {c.nextBillingDate && (
                      <p className="text-[11px] text-gray-400">
                        Next bill: {new Date(c.nextBillingDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
