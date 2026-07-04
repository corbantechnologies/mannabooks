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
        <div className="border border-black p-4 bg-zinc-50 font-bold uppercase">
          &gt; ERROR_FETCHING_ANALYTICS: {analyticsRes.error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white">
      <div>
        <span className="font-mono text-xs text-zinc-400 uppercase">INTELLIGENCE // BUSINESS_ANALYTICS_SUITE</span>
        <h1 className="text-3xl font-bold uppercase tracking-tighter mt-1">{shop.name} Financial Analytics</h1>
      </div>

      <AnalyticsClientView
        shopId={shop.id}
        shopSlug={slug}
        initialData={analyticsRes.data}
      />
    </div>
  );
}
