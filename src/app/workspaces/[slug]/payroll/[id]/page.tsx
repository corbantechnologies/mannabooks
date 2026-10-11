// src/app/workspaces/[slug]/payroll/[id]/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { PayrollRunDetailClient } from "./PayrollRunDetailClient";

interface PayrollRunDetailPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function PayrollRunDetailPage({ params }: PayrollRunDetailPageProps) {
  const { slug, id } = await params;
  const { shop } = await getActiveWorkspaceContext(slug);

  if (!shop) {
    notFound();
  }

  return (
    <PayrollRunDetailClient
      shop={shop}
      shopSlug={slug}
      voucherId={id}
    />
  );
}
