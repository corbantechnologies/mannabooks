// src/app/workspaces/[slug]/page.tsx
import { notFound } from "next/navigation";
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { WorkspaceDashboardClient } from "./WorkspaceDashboardClient";

interface WorkspaceOverviewPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceOverviewPage({ params }: WorkspaceOverviewPageProps) {
  const { slug } = await params;

  // 1. Resolve authenticated shop context
  const { shop } = await getActiveWorkspaceContext(slug);

  if (!shop) {
    notFound();
  }

  return (
    <WorkspaceDashboardClient
      shop={shop}
      shopSlug={slug}
    />
  );
}
