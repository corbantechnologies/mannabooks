// src/app/workspaces/[slug]/analytics/page.tsx
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getWorkspaceAnalyticsData } from "@/lib/actions/analytics";
import { AnalyticsClientView } from "./AnalyticsClientView";

interface AnalyticsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceAnalyticsPage({ params }: AnalyticsPageProps) {
  const { slug } = await params;

  // 1. Resolve multi-tenant shop criteria
  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) {
    notFound();
  }

  // 2. Fetch initial analytics data for THIS_MONTH default timeframe
  const analyticsRes = await getWorkspaceAnalyticsData(shop.id, "THIS_MONTH");

  if (!analyticsRes.success) {
    return (
      <div className="p-8 text-black font-mono">
        <div className="border border-zinc-200 bg-zinc-50 p-4 font-medium rounded text-xs text-rose-700">
          Unable to load analytics: {analyticsRes.error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white">
      <div>
        <span className="font-sans text-xs text-zinc-400 font-semibold uppercase tracking-wider">Reports &amp; Performance</span>
        <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">{shop.name} Analytics</h1>
      </div>

      <AnalyticsClientView
        shopId={shop.id}
        shopSlug={slug}
        fiscalYearStartMonth={shop.fiscalYearStartMonth}
        initialData={analyticsRes.data}
      />
    </div>
  );
}
