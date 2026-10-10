// src/app/workspaces/[slug]/inventory/adjustments/page.tsx
import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { notFound } from "next/navigation";
import { getStockLocations, getStockLedger } from "@/lib/actions/inventory";
import { apiClient } from "@/lib/api/client";
import { AdjustmentsClientView } from "./AdjustmentsClientView";

interface AdjustmentsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AdjustmentsPage({ params }: AdjustmentsPageProps) {
  const { slug } = await params;

  const { shop } = await getActiveWorkspaceContext(slug);
  if (!shop) notFound();

  const [locations, itemsRes, recentAdjustments] = await Promise.all([
    getStockLocations(shop.id),
    apiClient.get<any[]>(`/v1/items?shop_id=${shop.id}`),
    getStockLedger(shop.id, { limit: 50 }),
  ]);

  const trackedProducts = (itemsRes.data || []).filter((p: any) => Boolean(p.track_stock ?? p.trackStock));

  // Filter to adjustment-type movements only for history
  const adjustmentHistory = recentAdjustments.filter(e =>
    ["ADJUSTMENT_IN", "ADJUSTMENT_OUT", "OPENING_BALANCE"].includes(e.movementType)
  );

  return (
    <AdjustmentsClientView
      shopId={shop.id}
      shopSlug={slug}
      shopCurrency={shop.currency}
      locations={locations}
      trackedProducts={trackedProducts}
      adjustmentHistory={adjustmentHistory}
    />
  );
}
