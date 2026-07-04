// src/app/workspaces/page.tsx
import { db } from "@/db";
import { shopMembers } from "@/db/schema";
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

  // Pull all affiliated business profiles
  const memberships = await db.query.shopMembers.findMany({
    where: and(
      eq(shopMembers.userId, session.userId),
      eq(shopMembers.isActive, true)
    ),
    with: {
      shop: true,
    },
  });

  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-between p-8 md:p-16 selection:bg-black selection:text-white">
      
      {/* TOP META BAR */}
      <header className="flex justify-between items-center border-b border-zinc-200/80 pb-6">
        <div>
          <span className="font-mono text-xs text-zinc-400 font-semibold">CONSOLE // SUITE_MANAGEMENT</span>
          <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 font-sans text-black">Select Workspace</h1>
        </div>
        <Link 
          href="/onboarding/create-shop"
          className="btn-secondary-modern px-4 py-2 text-xs font-semibold uppercase tracking-wider"
        >
          + Provision New Shop
        </Link>
      </header>

      {/* WORKSPACE DIRECTORY GRID */}
      <main className="my-16 max-w-4xl w-full mx-auto space-y-4">
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 block px-1 font-semibold">
          Authorized Nodes Available ({memberships.length})
        </span>
        
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
      <footer className="border-t border-zinc-200 pt-6 flex justify-between items-center font-mono text-[10px] text-zinc-400">
        <span>Operator Token: {session.user.name.toUpperCase().replace(/\s+/g, "_")}</span>
        <form action={logoutAction}>
          <button type="submit" className="text-black font-bold hover:underline uppercase cursor-pointer bg-transparent border-none p-0 font-mono text-[10px]">
            De-authenticate Console
          </button>
        </form>
      </footer>

    </div>
  );
}