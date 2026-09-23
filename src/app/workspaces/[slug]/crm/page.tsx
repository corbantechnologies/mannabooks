// src/app/workspaces/[slug]/crm/page.tsx
import { db } from "@/db";
import { deals, shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { getDealsByShopAction, getPipelineForecastAction } from "@/lib/actions/crm";
import { CRMKanbanBoard } from "./CRMKanbanBoard";
import { Plus, TrendingUp, Target, Trophy, BarChart3 } from "lucide-react";

interface CRMPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CRMPipelinePage({ params }: CRMPageProps) {
  const { slug } = await params;

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (!shop) notFound();

  const [dealsResult, forecastResult] = await Promise.all([
    getDealsByShopAction(shop.id),
    getPipelineForecastAction(shop.id),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allDeals = (dealsResult.deals || []) as any[];
  const forecast = forecastResult;

  const statCards = [
    {
      label: "Total Deals",
      value: forecast.totalDeals ?? 0,
      icon: BarChart3,
      color: "#6366f1",
      suffix: "",
    },
    {
      label: "Weighted Pipeline",
      value: formatCurrency(forecast.totalWeightedPipeline ?? 0, shop.currency || "KES"),
      icon: TrendingUp,
      color: "#0ea5e9",
      suffix: "",
    },
    {
      label: "Won Revenue",
      value: formatCurrency(forecast.totalWonRevenue ?? 0, shop.currency || "KES"),
      icon: Trophy,
      color: "#10b981",
      suffix: "",
    },
    {
      label: "Active Stages",
      value: Object.values(forecast.stageSummary ?? {}).filter((s: any) => s.count > 0 && !["WON","LOST"].includes(Object.keys(forecast.stageSummary ?? {})[Object.values(forecast.stageSummary ?? {}).indexOf(s)])).length,
      icon: Target,
      color: "#f59e0b",
      suffix: "",
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">CRM Pipeline</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track deals from lead to close. Drag to advance stages.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/workspaces/${slug}/crm/proposals`}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-white/10 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Proposals
          </Link>
          <Link
            href={`/workspaces/${slug}/crm/contracts`}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-white/10 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Contracts
          </Link>
          <Link
            href={`/workspaces/${slug}/crm/deals/new`}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg text-white"
            style={{ backgroundColor: shop.primaryColor || "#064e3b" }}
          >
            <Plus className="w-4 h-4" />
            New Deal
          </Link>
        </div>
      </div>

      {/* Forecast stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/3 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${card.color}18` }}>
                <Icon className="w-4 h-4" style={{ color: card.color }} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Kanban board (client component handles drag-and-drop) */}
      <CRMKanbanBoard
        initialDeals={allDeals}
        shopId={shop.id}
        shopSlug={slug}
        brandColor={shop.primaryColor || "#064e3b"}
        currency={shop.currency || "KES"}
      />
    </div>
  );
}
