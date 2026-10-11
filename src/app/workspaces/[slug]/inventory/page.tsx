// src/app/workspaces/[slug]/inventory/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { InventoryOverviewClient } from "./InventoryOverviewClient";

interface InventoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function InventoryOverviewPage({ params }: InventoryPageProps) {
  const { slug } = await params;
  const { shop } = await getActiveWorkspaceContext(slug);
  if (!shop) notFound();

  return (
    <InventoryOverviewClient
      shop={shop}
      slug={slug}
    />
  );
}
