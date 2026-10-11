// src/app/workspaces/[slug]/inventory/reports/abc/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { AbcAnalysisClientView } from "./AbcAnalysisClientView";

interface Props { params: Promise<{ slug: string }> }

export default async function AbcAnalysisPage({ params }: Props) {
  const { slug } = await params;
  const { shop } = await getActiveWorkspaceContext(slug);
  if (!shop) notFound();

  return (
    <AbcAnalysisClientView
      shopId={shop.id}
      shopSlug={slug}
      shopCurrency={shop.currency}
    />
  );
}
