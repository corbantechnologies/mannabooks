import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getCostCenters } from "@/lib/actions/cost-centers";
import { CostCentersClient } from "./CostCentersClient";

interface CostCentersPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CostCentersPage({ params }: CostCentersPageProps) {
  const { slug } = await params;

  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) {
    notFound();
  }

  const centers = await getCostCenters(slug);

  return (
    <div className="p-5 sm:p-7 space-y-6">
      <div className="space-y-1">
        <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider">Financial Governance</span>
        <h1 className="text-[22px] font-semibold text-zinc-900 leading-tight">Cost Centers & Projects</h1>
        <p className="text-sm text-zinc-500">
          Segment operating expenses, project budgets, and multi-line compound journals by department, division, or client engagement.
        </p>
      </div>

      <CostCentersClient
        shopSlug={slug}
        currency={shop.currency}
        initialCenters={centers.map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          department: c.department,
          isActive: c.isActive,
          createdAt: c.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
