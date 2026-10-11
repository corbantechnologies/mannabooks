// src/app/workspaces/[slug]/inventory/reports/low-stock/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { LowStockClientView } from "./LowStockClientView";

interface Props { params: Promise<{ slug: string }> }

export default async function LowStockPage({ params }: Props) {
  const { slug } = await params;
  const { shop } = await getActiveWorkspaceContext(slug);
  if (!shop) notFound();

  return (
    <LowStockClientView
      shopId={shop.id}
      shopSlug={slug}
      shopCurrency={shop.currency}
    />
  );
}
