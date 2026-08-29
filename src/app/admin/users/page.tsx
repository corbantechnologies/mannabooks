import { getAdminUsersList } from "@/lib/actions/admin";
import { getAdminPlatformPlans } from "@/lib/actions/admin-pricing";
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

  const [res, plansRes] = await Promise.all([
    getAdminUsersList(search),
    getAdminPlatformPlans(),
  ]);

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

  return <AdminUsersClient initialUsers={res.users} availablePlans={plansRes.plans || []} />;
}
