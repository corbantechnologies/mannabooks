// src/app/workspaces/[slug]/documents/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { DocumentsPageClient } from "./DocumentsPageClient";

interface LedgerPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceLedgerPage({ params }: LedgerPageProps) {
  const { slug } = await params;

  // 1. Fetch active multi-tenant shop criteria
  const { shop } = await getActiveWorkspaceContext(slug);

  if (!shop) {
    notFound();
  }

  return (
    <DocumentsPageClient
      shopId={shop.id}
      shopSlug={slug}
      currency={shop.currency}
    />
  );
}