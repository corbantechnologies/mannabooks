// src/app/workspaces/[slug]/inventory/adjustments/page.tsx
import { db } from "@/db";
import { shops, products } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getStockLocations, getStockLedger } from "@/lib/actions/inventory";
import { AdjustmentsClientView } from "./AdjustmentsClientView";

interface AdjustmentsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AdjustmentsPage({ params }: AdjustmentsPageProps) {
  const { slug } = await params;

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (!shop) notFound();

  const [locations, trackedProducts, recentAdjustments] = await Promise.all([
    getStockLocations(shop.id),
    db.query.products.findMany({
      where: and(eq(products.shopId, shop.id), eq(products.trackStock, true)),
      orderBy: (p, { asc }) => [asc(p.name)],
    }),
    getStockLedger(shop.id, { limit: 50 }),
  ]);

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
