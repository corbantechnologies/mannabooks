// src/app/workspaces/[slug]/inventory/transfers/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { TransfersListClient } from "./TransfersListClient";

interface TransfersPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TransfersListPage({ params }: TransfersPageProps) {
  const { slug } = await params;

  const { shop } = await getActiveWorkspaceContext(slug);
  if (!shop) notFound();

  return (
    <TransfersListClient
      shopId={shop.id}
      shopSlug={slug}
    />
  );
}
