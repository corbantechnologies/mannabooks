import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { TransferDetailClient } from "./TransferDetailClient";

interface TransferDetailPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function TransferDetailPage({ params }: TransferDetailPageProps) {
  const { slug, id } = await params;

  const { shop } = await getActiveWorkspaceContext(slug);
  if (!shop) notFound();

  const res = await apiClient.get<any>(`/v1/inventory/transfers/${id}`, { params: { shop_id: shop.id } });
  const transfer = res.data?.transfer || (res.data?.id ? res.data : null);
  if (!transfer) notFound();

  return (
    <TransferDetailClient
      transfer={transfer}
      shopSlug={slug}
      shopCurrency={shop.currency}
    />
  );
}
