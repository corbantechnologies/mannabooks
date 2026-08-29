// src/app/workspaces/[slug]/inventory/locations/[id]/page.tsx
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getStockLocationDetail } from "@/lib/actions/inventory";
import { LocationDetailClientView } from "./LocationDetailClientView";

interface LocationDetailPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function LocationDetailPage({ params }: LocationDetailPageProps) {
  const { slug, id } = await params;

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (!shop) notFound();

  const detail = await getStockLocationDetail(shop.id, id);
  if (!detail) notFound();

  return (
    <LocationDetailClientView
      shopId={shop.id}
      shopSlug={slug}
      shopCurrency={shop.currency}
      location={detail.location}
      metrics={detail.metrics}
      items={detail.items}
      recentMovements={detail.recentMovements}
      transfers={detail.transfers}
    />
  );
}
