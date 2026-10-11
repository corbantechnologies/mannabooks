// src/app/workspaces/[slug]/inventory/locations/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { LocationsClientView } from "./LocationsClientView";

interface LocationsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function StockLocationsPage({ params }: LocationsPageProps) {
  const { slug } = await params;
  const { shop } = await getActiveWorkspaceContext(slug);
  if (!shop) notFound();

  return (
    <LocationsClientView
      shopId={shop.id}
      shopSlug={slug}
      shopCurrency={shop.currency}
    />
  );
}
