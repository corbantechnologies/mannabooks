// src/app/workspaces/[slug]/inventory/adjustments/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { AdjustmentsClientView } from "./AdjustmentsClientView";

interface AdjustmentsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AdjustmentsPage({ params }: AdjustmentsPageProps) {
  const { slug } = await params;

  const { shop } = await getActiveWorkspaceContext(slug);
  if (!shop) notFound();

  return (
    <AdjustmentsClientView
      shopId={shop.id}
      shopSlug={slug}
      shopCurrency={shop.currency}
    />
  );
}
