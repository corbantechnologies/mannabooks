import { db } from "@/db";
import { shopMembers, shops, users } from "@/db/schema";
import { verifyAndGetSession } from "@/lib/actions/auth";
import { logoutAction } from "@/lib/actions/logout";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function WorkspacesDirectoryPage() {
  const session = await verifyAndGetSession();
  if (!session) {
    redirect("/login");
  }

  // Auto-heal: Check if this user owns shops directly in the shops table
  const ownedShops = await db.query.shops.findMany({
    where: eq(shops.ownerId, session.userId),
  });

  for (const shop of ownedShops) {
    try {
      await db.insert(shopMembers).values({
        shopId: shop.id,
        userId: session.userId,
        role: "OWNER",
        isActive: true,
      }).onConflictDoNothing();
    } catch (e) {}
  }

  // Pull user profile and active memberships
  const [currentUser, memberships] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, session.userId),
    }),
    db.query.shopMembers.findMany({
      where: and(
        eq(shopMembers.userId, session.userId),
        eq(shopMembers.isActive, true)
      ),
      with: {
        shop: true,
      },
    }),
  ]);

  const isLifetime = Boolean(currentUser?.isLifetimePro || currentUser?.isSuperAdmin);
  const rawPlan = isLifetime ? "LIFETIME PRO" : (currentUser?.plan || "FREE").toUpperCase();

  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-between p-6 sm:p-12 md:p-16 selection:bg-black selection:text-white">
      
      {/* TOP META BAR */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-6">
        <div>
          <span className="font-sans text-xs text-zinc-400 font-semibold uppercase tracking-wider">Account Workspaces</span>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight font-sans text-black">
              Select Workspace
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
              <div className="flex items-center gap-1.5 font-mono text-[10px]">
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

        <div className="flex items-center gap-3">
          {currentUser?.isSuperAdmin && (
            <Link
              href="/admin"
              className="bg-black hover:bg-zinc-800 text-amber-300 border border-amber-500/40 px-3.5 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs no-underline transition-all"
            >
              <span>👑</span>
              <span>Admin Terminal</span>
            </Link>
          )}

          <Link 
            href="/onboarding/create-shop"
            className="btn-secondary-modern px-4 py-2 text-xs font-semibold uppercase tracking-wider"
          >
            + Provision New Shop
          </Link>
        </div>
      </header>

      {/* WORKSPACE DIRECTORY GRID */}
      <main className="my-12 max-w-4xl w-full mx-auto space-y-4">
        <div className="flex justify-between items-center px-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">
            Authorized Workspaces ({memberships.length})
          </span>
          <span className="font-mono text-[10px] text-zinc-400">
            Account: <strong className="text-black">{currentUser?.email}</strong>
          </span>
        </div>
        
        <div className="card-modern divide-y divide-zinc-200/80 bg-white">
          {memberships.map((member) => {
            if (!member.shop) return null;
            return (
              <Link 
                key={member.id} 
                href={`/workspaces/${member.shop.slug}`}
                className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-zinc-50/80 transition-colors group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 border border-black/30 rounded-sm shrink-0 inline-block"
                      style={{ backgroundColor: member.shop.primaryColor || "#000000" }}
                      title={`Theme: ${member.shop.primaryColor}`}
                    />
                    <h3 className="text-xl font-semibold uppercase tracking-tight font-sans text-black group-hover:underline decoration-2 underline-offset-4">
                      {member.shop.shortName || member.shop.name}
                    </h3>
                  </div>
                  <p className="font-mono text-xs text-zinc-500">
                    URL Reference: /workspaces/{member.shop.slug}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                  {/* WORKSPACE PLAN STATUS */}
                  {isLifetime ? (
                    <span className="bg-amber-50 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded shadow-2xs">
                      👑 LIFETIME PRO
                    </span>
                  ) : (
                    <span className="bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold px-2 py-0.5 rounded">
                      {rawPlan} TIER
                    </span>
                  )}

                  <span className="border border-zinc-300 px-2.5 py-0.5 font-semibold uppercase bg-white rounded">
                    {member.role}
                  </span>
                  <span className={`border px-2.5 py-0.5 font-semibold uppercase rounded ${
                    member.shop.isVatRegistered 
                      ? "bg-black text-white border-black" 
                      : "border-zinc-200 text-zinc-400"
                  }`}>
                    {member.shop.isVatRegistered ? "VAT_ACTIVE (16%)" : "NON_VAT"}
                  </span>
                  <span className="bg-zinc-100 border border-zinc-200 text-zinc-600 px-2.5 py-0.5 font-semibold rounded">
                    {member.shop.currency}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      {/* BOTTOM FOOTER TRACKER */}
      <footer className="border-t border-zinc-200 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 font-mono text-[10px] text-zinc-400">
        <div>
          <span>Operator: <strong className="text-black">{currentUser?.name}</strong> ({currentUser?.email})</span>
          <span className="mx-2">•</span>
          <span>Account Tier: <strong className="text-black">{rawPlan}</strong></span>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="text-black font-bold hover:underline uppercase cursor-pointer bg-transparent border-none p-0 font-mono text-[10px]">
            De-authenticate Console
          </button>
        </form>
      </footer>

    </div>
  );
}