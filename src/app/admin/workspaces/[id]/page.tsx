import { getAdminWorkspaceDetails } from "@/lib/actions/admin";
import { AdminWorkspaceDetailClient } from "./AdminWorkspaceDetailClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface AdminWorkspaceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminWorkspaceDetailPage({ params }: AdminWorkspaceDetailPageProps) {
  const { id } = await params;

  const res = await getAdminWorkspaceDetails(id);

  if (!res.success || !res.shop) {
    notFound();
  }

  return (
    <AdminWorkspaceDetailClient
      shop={res.shop}
      docStats={res.docStats || []}
      recentDocs={res.recentDocs || []}
    />
  );
}
