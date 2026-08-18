// src/app/workspaces/[slug]/inventory/locations/page.tsx
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getStockLocations } from "@/lib/actions/inventory";
import { LocationsClientView } from "./LocationsClientView";

interface LocationsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function StockLocationsPage({ params }: LocationsPageProps) {
  const { slug } = await params;

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (!shop) notFound();

  const locations = await getStockLocations(shop.id);

  return (
    <LocationsClientView
      shopId={shop.id}
      shopSlug={slug}
      shopCurrency={shop.currency}
      initialLocations={locations}
    />
  );
}
