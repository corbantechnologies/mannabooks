// src/app/workspaces/[slug]/employees/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { EmployeesListClient } from "./EmployeesListClient";

interface WorkspaceEmployeesPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceEmployeesPage({ params }: WorkspaceEmployeesPageProps) {
  const { slug } = await params;

  // 1. Resolve multi-tenant shop criteria
  const { shop } = await getActiveWorkspaceContext(slug);

  if (!shop) {
    notFound();
  }

  return (
    <EmployeesListClient
      shopId={shop.id}
      shopSlug={slug}
      shopName={shop.name}
      currency={shop.currency}
    />
  );
}
