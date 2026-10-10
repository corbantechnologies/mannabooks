import { apiClient } from "@/lib/api/client";
import { AdminWorkspaceDetailClient } from "./AdminWorkspaceDetailClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface AdminWorkspaceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminWorkspaceDetailPage({ params }: AdminWorkspaceDetailPageProps) {
  const { id } = await params;

  const apiRes = await apiClient.get<any>(`/v1/admin/workspaces/${id}`);
  const res = apiRes.data;

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
