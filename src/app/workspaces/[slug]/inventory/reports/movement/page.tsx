// src/app/workspaces/[slug]/inventory/reports/movement/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { MovementHistoryClientView } from "./MovementHistoryClientView";

interface Props { params: Promise<{ slug: string }> }

export default async function MovementHistoryPage({ params }: Props) {
  const { slug } = await params;
  const { shop } = await getActiveWorkspaceContext(slug);
  if (!shop) notFound();

  return (
    <MovementHistoryClientView
      shopId={shop.id}
      shopSlug={slug}
    />
  );
}
