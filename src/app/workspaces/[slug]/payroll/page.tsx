// src/app/workspaces/[slug]/payroll/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { PayrollDashboardClient } from "./PayrollDashboardClient";

interface WorkspacePayrollPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspacePayrollPage({ params }: WorkspacePayrollPageProps) {
  const { slug } = await params;

  // 1. Resolve shop multi-tenant boundary
  const { shop } = await getActiveWorkspaceContext(slug);

  if (!shop) {
    notFound();
  }

  return (
    <PayrollDashboardClient
      shopId={shop.id}
      shopSlug={slug}
      shopName={shop.name}
      currency={shop.currency}
    />
  );
}

