import { redirect } from "next/navigation";
import { apiClient } from "@/lib/api/client";

export default async function DashboardProxyPage() {
  const meRes = await apiClient<{ success: boolean; user: any }>("/v1/auth/me");
  if (!meRes.data?.success || !meRes.data.user) {
    // Stale or revoked session: clear the cookie (avoids a /login <-> /dashboard loop).
    redirect("/logout");
  }

  const user = meRes.data.user;
  if (user.isSuperAdmin) {
    redirect("/admin");
  }

  const res = await apiClient<{
    success: boolean;
    workspaces: Array<{ id: string; name: string; slug: string; role: string }>;
  }>("/v1/workspaces/my-workspaces");

  if (res.data?.success && Array.isArray(res.data.workspaces)) {
    const list = res.data.workspaces;
    if (list.length === 0) {
      redirect("/onboarding/create-shop");
    }
    if (list.length === 1 && list[0].slug) {
      redirect(`/workspaces/${list[0].slug}`);
    }
  }

  redirect("/workspaces");
}