// src/app/workspaces/[slug]/payroll/statutory/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { StatutoryClient } from "./StatutoryClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PayrollStatutoryPage({ params }: PageProps) {
  const { slug } = await params;
  const { shop } = await getActiveWorkspaceContext(slug);
  if (!shop) {
    notFound();
  }
  return <StatutoryClient shopId={shop.id} shopSlug={slug} currency={shop.currency} />;
}
