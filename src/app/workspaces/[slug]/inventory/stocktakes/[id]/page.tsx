import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { getStocktakeDetail } from "@/lib/actions/stocktake";
import { StocktakeAuditClient } from "./StocktakeAuditClient";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stocktake Audit Count Sheet & Reconciliation | Manna Books",
  description: "Live physical inventory counting, variance analysis, and ledger reconciliation",
};

interface StocktakeAuditPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function StocktakeAuditPage({ params }: StocktakeAuditPageProps) {
  const { slug, id } = await params;
  const { shop } = await getActiveWorkspaceContext(slug);

  const stocktake = await getStocktakeDetail(id);

  if (!stocktake || stocktake.shopId !== shop.id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <StocktakeAuditClient
        shopId={shop.id}
        shopSlug={shop.slug}
        stocktake={stocktake}
      />
    </div>
  );
}
