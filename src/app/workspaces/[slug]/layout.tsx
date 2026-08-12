// src/app/workspaces/[slug]/layout.tsx
import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { logoutAction } from "@/lib/actions/logout";
import Link from "next/link";
import { db } from "@/db";
import { fiscalYears } from "@/db/schema";
import { eq } from "drizzle-orm";

import { MobileNavDrawer } from "./MobileNavDrawer";
import { DesktopSideNav } from "./DesktopSideNav";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function RefinedWorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  // 1. Await params (required in Next.js 15+)
  const { slug } = await params;

  // 2. Authenticate session and fetch multi-tenant profile fields entirely on the server
  const { shop, user } = await getActiveWorkspaceContext(slug);

  // 3. Check if GL is enabled and at least one fiscal year is declared
  const hasFiscalYear = !shop.isGlEnabled || (await db.query.fiscalYears.findFirst({
      where: eq(fiscalYears.shopId, shop.id),
  })) !== undefined;

  const brandColor = shop.primaryColor || "#000000";

  return (
    <div
      style={{ "--brand-primary": brandColor } as React.CSSProperties}
      className="flex flex-col lg:flex-row min-h-screen bg-white"
    >
      <style>{`
        :root {
          --brand-primary: ${brandColor};
        }
        ::selection {
          background-color: ${brandColor} !important;
          color: #ffffff !important;
        }
        .bg-black {
          background-color: ${brandColor} !important;
        }
        .border-black {
          border-color: ${brandColor} !important;
        }
        .divide-black > :not([hidden]) ~ :not([hidden]) {
          border-color: ${brandColor} !important;
        }
        .accent-black {
          accent-color: ${brandColor} !important;
        }
        .focus\\:ring-black:focus {
          --tw-ring-color: ${brandColor} !important;
        }
        .hover\\:bg-black:hover {
          background-color: ${brandColor} !important;
        }
        .hover\\:border-black:hover {
          border-color: ${brandColor} !important;
        }
      `}</style>

      {/* MOBILE TOP NAVIGATION BAR WITH SLIDE DRAWER (< 1024px) */}
      <MobileNavDrawer slug={slug} shop={shop} user={user} />

      {/* GLOBAL MINIMAL EDITORIAL SIDEBAR (1024px+) */}
      <aside className="hidden lg:flex w-64 border-r border-zinc-200/80 flex-col justify-between bg-white h-screen sticky top-0 shrink-0">
        <div className="flex flex-col flex-1 overflow-y-auto p-6 space-y-10">
          
          {/* BUSINESS LOGO PROFILE INDICATOR */}
          <div className="space-y-3 border-b border-zinc-200/80 pb-6">
            <div className="flex justify-between items-center">
              <span className="font-sans text-[10px] uppercase tracking-wider text-zinc-400 block font-bold">Workspace</span>
              <Link href="/workspaces" className="font-sans text-[10px] uppercase font-bold text-black underline hover:no-underline">
                Switch
              </Link>
            </div>

            <div className="flex items-center gap-3">
              {shop.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shop.logoUrl} alt={shop.name} className="w-8 h-8 object-contain border border-zinc-200 p-0.5 bg-white rounded shrink-0" />
              ) : (
                <span
                  className="w-3.5 h-3.5 border border-black/30 rounded-sm shrink-0 inline-block"
                  style={{ backgroundColor: shop.primaryColor || "#000000" }}
                />
              )}
              <div className="min-w-0">
                <h2 className="font-sans font-semibold uppercase tracking-tight text-sm truncate block leading-none">
                  {shop.shortName || shop.name}
                </h2>
                {shop.phone && (
                  <p className="font-mono text-[9px] text-zinc-500 truncate mt-0.5">{shop.phone}</p>
                )}
                {shop.code && (
                  <div className="inline-block border border-zinc-200 font-mono text-[9px] px-1.5 py-0.5 uppercase tracking-tight text-zinc-600 bg-zinc-50 rounded-sm mt-1 mr-1 font-semibold">
                    CODE: {shop.code}
                  </div>
                )}
                {shop.taxPin ? (
                  <div className="inline-block border border-zinc-200 font-mono text-[9px] px-1.5 py-0.5 uppercase tracking-tight text-zinc-600 bg-zinc-50 rounded-sm mt-1 font-semibold">
                    PIN: {shop.taxPin}
                  </div>
                ) : (
                  <span className="font-mono text-[9px] italic text-rose-600 block mt-1">&gt; CONFIGURATION REQUIRED</span>
                )}
              </div>
            </div>
          </div>

          {/* APPLICATION DIRECTORY LINKS */}
          <div className="space-y-2 flex-1">
            <span className="font-sans text-[10px] uppercase tracking-wider text-zinc-400 block mb-3 font-bold">Directories</span>
            <DesktopSideNav slug={slug} />
          </div>

        </div>

        {/* FOOTER USER MANAGEMENT COMPONENT */}
        <div className="p-6 border-t border-zinc-200/80 bg-zinc-50/50 flex flex-col gap-2 font-sans text-xs">
          <div className="truncate">
            <span className="text-zinc-400 block text-[10px] uppercase font-bold">Active Operator</span>
            <span className="font-semibold text-black">{user.name}</span>
          </div>
          <div className="text-[10px] text-zinc-400 border-t border-zinc-200/80 pt-2 flex justify-between items-center">
            <span>Manna v2026.4</span>
            <form action={logoutAction}>
              <button type="submit" className="text-rose-600 font-bold hover:underline cursor-pointer bg-transparent border-none p-0 uppercase text-[9px] tracking-wide">
                Logout
              </button>
            </form>
          </div>
        </div>

      </aside>

      {/* CORE WORKSPACE DASHBOARD VIEWPORT STREAM */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        {/* DESKTOP HEADER NAVBAR */}
        <header className="hidden lg:flex border-b border-zinc-200/80 bg-white h-14 shrink-0 items-center justify-between px-8 sticky top-0 z-30 select-none">
          <div className="flex items-center gap-2 text-xs font-sans font-medium text-zinc-500">
            <span className="text-zinc-400">Workspace</span>
            <span className="text-zinc-300">/</span>
            <span className="text-black font-semibold">{shop.name}</span>
            {shop.code && (
              <span className="ml-2 font-mono text-[10px] px-1.5 py-0.5 border border-zinc-200 bg-zinc-50 text-zinc-600 rounded-sm font-semibold">
                {shop.code}
              </span>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 font-sans text-xs text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Operator:</span>
              <span className="font-semibold text-black">{user.name}</span>
            </div>
            <Link
              href={`/workspaces/${slug}/documents/new`}
              className="bg-black hover:bg-zinc-800 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors"
            >
              + Create Document
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {!hasFiscalYear && (
            <div className="bg-amber-50 border-b border-amber-200/80 p-4 font-sans text-sm text-amber-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
               <div>
                  <p className="font-bold flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide">⚠️ Action Required: Declare Fiscal Year</p>
                  <p className="text-xs text-amber-700 mt-1">General Ledger is active, but you have not declared a descriptive Fiscal Year. Financial entries and document locks will remain unassigned or locked until a Fiscal Year is declared.</p>
               </div>
               <Link href={`/workspaces/${slug}/finance/tax/settings`} className="bg-amber-800 hover:bg-amber-900 text-white font-mono text-[10px] uppercase font-bold px-3 py-1.5 rounded transition-colors shrink-0">
                  Setup Now
               </Link>
            </div>
          )}
          {children}
        </div>
      </main>

    </div>
  );
}