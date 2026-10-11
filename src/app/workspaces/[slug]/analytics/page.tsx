import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { AnalyticsClientView } from "./AnalyticsClientView";

interface AnalyticsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceAnalyticsPage({ params }: AnalyticsPageProps) {
  const { slug } = await params;

  // 1. Resolve multi-tenant shop criteria
  const { shop } = await getActiveWorkspaceContext(slug);

  if (!shop) {
    notFound();
  }

  return (
    <div className="p-5 sm:p-7 space-y-6">
      <div>
        <span className="text-xs text-zinc-400 font-medium">Reports &amp; Performance</span>
        <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">{shop.name} Analytics</h1>
      </div>

      <AnalyticsClientView
        shopId={shop.id}
        shopSlug={slug}
        fiscalYearStartMonth={shop.fiscalYearStartMonth}
      />
    </div>
  );
}
