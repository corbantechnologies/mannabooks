// src/app/workspaces/[slug]/suppliers/[id]/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { SupplierDetailClient } from "./SupplierDetailClient";

interface SupplierDetailPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function SupplierDetailPage({ params }: SupplierDetailPageProps) {
  const { slug, id } = await params;

  // 1. Resolve multi-tenant shop criteria
  const { shop } = await getActiveWorkspaceContext(slug);

  if (!shop) {
    notFound();
  }

  return (
    <SupplierDetailClient
      shop={shop}
      shopSlug={slug}
      supplierId={id}
    />
  );
}
