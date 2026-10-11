import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { LocationDetailClientView } from "./LocationDetailClientView";

interface LocationDetailPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function LocationDetailPage({ params }: LocationDetailPageProps) {
  const { slug, id } = await params;

  const { shop } = await getActiveWorkspaceContext(slug);
  if (!shop) notFound();

  const [detailRes, binsRes] = await Promise.all([
    apiClient.get<any>(`/v1/inventory/locations/${id}`, { params: { shop_id: shop.id } }),
    apiClient.get<any>(`/v1/inventory/bins`, { params: { shop_id: shop.id, location_id: id } }),
  ]);
  const detail = detailRes.data?.detail || detailRes.data;
  if (!detail || !detail.location) notFound();
  const bins = binsRes.data?.bins || (Array.isArray(binsRes.data) ? binsRes.data : []);

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
