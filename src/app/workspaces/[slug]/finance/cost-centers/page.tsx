import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { CostCentersClient } from "./CostCentersClient";

interface CostCentersPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CostCentersPage({ params }: CostCentersPageProps) {
  const { slug } = await params;
  const { shop } = await getActiveWorkspaceContext(slug);

  if (!shop) {
    notFound();
  }

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
      />
    </div>
  );
}
