import { apiClient } from "@/lib/api/client";
import { AdminWorkspacesClient } from "./AdminWorkspacesClient";

export const dynamic = "force-dynamic";

interface AdminWorkspacesPageProps {
  searchParams: Promise<{
    search?: string;
    plan?: string;
    page?: string;
  }>;
}

export default async function AdminWorkspacesPage({ searchParams }: AdminWorkspacesPageProps) {
  const params = await searchParams;
  const search = params.search || "";
  const planFilter = params.plan || "ALL";
  const page = parseInt(params.page || "1", 10);

  const apiRes = await apiClient.get<any>("/v1/admin/workspaces", {
    params: {
      search,
      plan_filter: planFilter,
      page: String(page),
      limit: "100",
    },
  });
  const res = apiRes.data || { success: false, error: apiRes.error };

  if (!res.success || !res.workspaces) {
    return (
      <div className="bg-rose-50 border border-rose-200 p-6 rounded-xl text-rose-900 shadow-sm font-mono text-xs">
        <h2 className="font-bold text-sm mb-2 flex items-center gap-2">
          <span>⚠️</span> Failed to Load Workspaces
        </h2>
        <p>{res.error || "An error occurred while loading the tenant directory."}</p>
      </div>
    );
  }

  return (
    <AdminWorkspacesClient
      initialWorkspaces={res.workspaces}
      totalCount={res.totalCount || res.workspaces.length}
    />
  );
}
