// src/app/workspaces/[slug]/clients/[id]/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { ClientProfileClient } from "./ClientProfileClient";

interface ClientProfilePageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function ClientProfileLedgerPage({ params }: ClientProfilePageProps) {
  const { slug, id } = await params;

  // 1. Resolve multi-tenant shop criteria context
  const { shop } = await getActiveWorkspaceContext(slug);

  if (!shop) {
    notFound();
  }

  return (
    <ClientProfileClient
      shop={shop}
      shopSlug={slug}
      clientId={id}
    />
  );
}