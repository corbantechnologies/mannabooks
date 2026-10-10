// src/app/workspaces/[slug]/inventory/locations/[id]/page.tsx
import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { notFound } from "next/navigation";
import { getStockLocationDetail } from "@/lib/actions/inventory";
import { getStorageBins } from "@/lib/actions/wms";
import { LocationDetailClientView } from "./LocationDetailClientView";

interface LocationDetailPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function LocationDetailPage({ params }: LocationDetailPageProps) {
  const { slug, id } = await params;

  const { shop } = await getActiveWorkspaceContext(slug);
  if (!shop) notFound();

  const [detail, bins] = await Promise.all([
    getStockLocationDetail(shop.id, id),
    getStorageBins(shop.id, id),
  ]);
  if (!detail) notFound();

  return (
    <LocationDetailClientView
      shopId={shop.id}
      shopSlug={slug}
      shopCurrency={shop.currency}
      location={detail.location}
      metrics={detail.metrics}
      items={detail.items}
      bins={bins}
      recentMovements={detail.recentMovements}
      transfers={detail.transfers}
    />
  );
}
