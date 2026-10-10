import { verifyAndGetSession } from "@/lib/actions/auth";
import { logoutAction } from "@/lib/actions/logout";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getOrganizationStaffRoster } from "@/lib/actions/team-directory";
import { WorkspaceDirectoryClient } from "./WorkspaceDirectoryClient";
import { apiClient } from "@/lib/api/client";

export default async function WorkspacesDirectoryPage() {
  const session = await verifyAndGetSession();
  if (!session) {
    redirect("/logout");
  }

  // Fetch workspaces and user via decoupled FastAPI endpoints
  const [workspacesRes, rosterRes] = await Promise.all([
    apiClient<{ success: boolean; workspaces: Array<{ id: string; name: string; slug: string; role: string }> }>("/v1/workspaces/my-workspaces"),
    getOrganizationStaffRoster().catch(() => ({ roster: [], ownedShops: [] })),
  ]);

  const currentUser = session.user;
  const workspacesList = workspacesRes.data?.workspaces || [];

  const memberships = workspacesList.map((w) => ({
    id: w.id,
    shopId: w.id,
    userId: session.userId,
    role: w.role,
    isActive: true,
    shop: {
      id: w.id,
      name: w.name,
      slug: w.slug,
      primaryColor: "#064e3b",
      plan: "FREE",
    },
  }));

  const ownedShops = workspacesList
    .filter((w) => w.role === "OWNER")
    .map((w) => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      primaryColor: "#064e3b",
      memberCount: 1,
    }));

  const fiscalYearsByShop: Record<string, { id: string; label: string; startDate: string; endDate: string; isClosed: boolean; isCurrent: boolean }[]> = {};


  const isLifetime = Boolean(currentUser?.isLifetimePro || currentUser?.isSuperAdmin);
  const rawPlan = isLifetime ? "LIFETIME PRO" : (currentUser?.plan || "FREE").toUpperCase();

  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-between p-4 sm:p-12 md:p-16 selection:bg-black selection:text-white">
      
      {/* TOP META BAR */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-6">
        <div>
          <span className="text-xs text-zinc-400 font-medium">Account Workspaces &amp; Staff Directory</span>
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mt-1">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight font-sans text-black">
              Workspace Central
            </h1>

            {/* USER SUBSCRIPTION PLAN BADGE */}
            {currentUser?.isSuperAdmin ? (
              <span className="inline-flex items-center gap-1 bg-black text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-md shadow-2xs">
                <span>👑</span>
                <span>SUPER ADMIN</span>
              </span>
            ) : currentUser?.isLifetimePro ? (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-950 border border-amber-300 text-[10px] font-mono font-bold px-2.5 py-1 rounded-md shadow-2xs">
                <span>⭐</span>
                <span>LIFETIME PRO</span>
              </span>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                <span className={`font-bold px-2 py-0.5 rounded-md border uppercase ${
                  rawPlan === "ENTERPRISE"
                    ? "bg-purple-50 text-purple-900 border-purple-300"
                    : rawPlan === "PRO"
                    ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                    : rawPlan === "BASIC"
                    ? "bg-blue-50 text-blue-900 border-blue-200"
                    : "bg-zinc-100 text-zinc-700 border-zinc-200"
                }`}>
                  {rawPlan} TIER
                </span>
                {currentUser?.subscriptionExpiresAt && (
                  <span className="text-zinc-400">
                    (Expires: {new Date(currentUser.subscriptionExpiresAt).toLocaleDateString("en-KE")})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {currentUser?.isSuperAdmin && (
            <Link
              href="/admin"
              className="bg-black hover:bg-zinc-800 text-amber-300 border border-amber-500/40 px-3.5 py-2.5 sm:py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-2xs no-underline transition-all"
            >
              <span>👑</span>
              <span>Admin Terminal</span>
            </Link>
          )}

          <Link 
            href="/onboarding/create-shop"
            className="btn-secondary-modern px-4 py-2.5 sm:py-2 text-xs font-semibold uppercase tracking-wider text-center justify-center flex items-center"
          >
            + Provision New Shop
          </Link>
        </div>
      </header>

      {/* WORKSPACE DIRECTORY & STAFF ROSTER */}
      <main className="my-8 sm:my-10 max-w-4xl w-full mx-auto space-y-4">
        <WorkspaceDirectoryClient
          currentUser={currentUser}
          rawPlan={rawPlan}
          isLifetime={isLifetime}
          memberships={memberships}
          initialRoster={rosterRes.roster}
          ownedShops={rosterRes.ownedShops}
          fiscalYearsByShop={fiscalYearsByShop}
        />
      </main>

      {/* BOTTOM FOOTER TRACKER */}
      <footer className="border-t border-zinc-200 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 font-mono text-[10px] text-zinc-400 text-center sm:text-left">
        <div>
          <span>Operator: <strong className="text-black">{currentUser?.name}</strong> ({currentUser?.email})</span>
          <span className="mx-2 hidden sm:inline">•</span>
          <span className="block sm:inline mt-1 sm:mt-0">Account Tier: <strong className="text-black">{rawPlan}</strong></span>
        </div>
        <form action={logoutAction} className="w-full sm:w-auto">
          <button type="submit" className="text-black font-bold hover:underline uppercase cursor-pointer bg-transparent border-none p-0 font-mono text-[10px]">
            De-authenticate Console
          </button>
        </form>
      </footer>

    </div>
  );
}