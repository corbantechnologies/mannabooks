import { apiClient } from "@/lib/api/client";
import { PLAN_SPECS } from "@/lib/paywall";
import { AdminUsersClient } from "./AdminUsersClient";

export const dynamic = "force-dynamic";

interface AdminUsersPageProps {
  searchParams: Promise<{
    search?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const params = await searchParams;
  const search = params.search || "";

  const usersRes = await apiClient.get<any>("/v1/admin/users", {
    params: search ? { search } : undefined,
  });
  const res = usersRes.data || { success: false, error: usersRes.error };

  if (!res.success || !res.users) {
    return (
      <div className="bg-rose-50 border border-rose-200 p-6 rounded-xl text-rose-900 shadow-sm font-mono text-xs">
        <h2 className="font-bold text-sm mb-2 flex items-center gap-2">
          <span>⚠️</span> Failed to Load User Directory
        </h2>
        <p>{res.error || "An error occurred while loading platform users."}</p>
      </div>
    );
  }

  return <AdminUsersClient initialUsers={res.users} availablePlans={Object.values(PLAN_SPECS)} />;
}
