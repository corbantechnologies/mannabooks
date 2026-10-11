// src/app/workspaces/[slug]/inventory/reports/valuation/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { StockValuationClientView } from "./StockValuationClientView";

interface Props { params: Promise<{ slug: string }> }

export default async function StockValuationPage({ params }: Props) {
  const { slug } = await params;
  const { shop } = await getActiveWorkspaceContext(slug);
  if (!shop) notFound();

  return (
    <StockValuationClientView
      shopId={shop.id}
      shopSlug={slug}
      shopCurrency={shop.currency}
    />
  );
}
