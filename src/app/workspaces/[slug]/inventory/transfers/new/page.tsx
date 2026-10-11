// src/app/workspaces/[slug]/inventory/transfers/new/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { NewTransferForm } from "./NewTransferForm";

interface NewTransferPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewTransferPage({ params }: NewTransferPageProps) {
  const { slug } = await params;

  const { shop } = await getActiveWorkspaceContext(slug);
  if (!shop) notFound();

  return (
    <NewTransferForm
      shopId={shop.id}
      shopSlug={slug}
      shopCurrency={shop.currency}
    />
  );
}
