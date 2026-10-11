import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { apiClient } from "@/lib/api/client";
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

  const res = await apiClient.get<any>(`/v1/inventory/stocktakes/${id}`, { params: { shop_id: shop.id } });
  const stocktake = res.data?.stocktake || (res.data?.id ? res.data : null);

  if (!stocktake) {
    notFound();
  }

  return (
    <div className="p-5 sm:p-7 space-y-6">
      <StocktakeAuditClient
        shopId={shop.id}
        shopSlug={shop.slug}
        stocktake={stocktake}
      />
    </div>
  );
}
