// src/app/workspaces/[slug]/layout.tsx
import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { logoutAction } from "@/lib/actions/logout";
import Link from "next/link";

import { MobileNavDrawer } from "./MobileNavDrawer";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function RefinedWorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  // 1. Await params (required in Next.js 15+)
  const { slug } = await params;

  // 2. Authenticate session and fetch multi-tenant profile fields entirely on the server
  const { shop, user } = await getActiveWorkspaceContext(slug);

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
      <aside className="hidden lg:flex w-64 border-r border-black flex-col justify-between bg-white h-screen sticky top-0 shrink-0">
        <div className="flex flex-col flex-1 overflow-y-auto p-6 space-y-12">
          
          {/* BUSINESS LOGO PROFILE INDICATOR */}
          <div className="space-y-3 border-b border-zinc-200 pb-6">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 block">Current Workspace</span>
              <Link href="/workspaces" className="font-mono text-[9px] uppercase font-bold text-black underline hover:no-underline">
                Switch / Add
              </Link>
            </div>

            <div className="flex items-center gap-3">
              {shop.logoUrl && (
                <img src={shop.logoUrl} alt={shop.name} className="w-8 h-8 object-contain border border-black p-0.5 bg-white shrink-0" />
              )}
              <div className="min-w-0">
                <h2 className="font-bold uppercase tracking-tighter text-base truncate block leading-none">
                  {shop.shortName || shop.name}
                </h2>
                {shop.phone && (
                  <p className="font-mono text-[9px] text-zinc-500 truncate mt-0.5">{shop.phone}</p>
                )}
                {shop.taxPin ? (
                  <div className="inline-block border border-black font-mono text-[9px] px-1 py-0.5 uppercase tracking-tight text-zinc-600 bg-zinc-50 mt-1">
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
            <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 block mb-3">Ledger Directories</span>
            <nav className="flex flex-col gap-2 font-mono text-xs uppercase font-bold tracking-wider">
              <Link 
                href={`/workspaces/${slug}`} 
                className="px-3 py-2 border border-transparent hover:border-black hover:bg-zinc-50 transition-all block"
              >
                [00] Overview Log
              </Link>
              <Link 
                href={`/workspaces/${slug}/documents`} 
                className="px-3 py-2 border border-transparent hover:border-black hover:bg-zinc-50 transition-all block"
              >
                [01] Fiscal Ledgers
              </Link>
              <Link 
                href={`/workspaces/${slug}/clients`} 
                className="px-3 py-2 border border-transparent hover:border-black hover:bg-zinc-50 transition-all block"
              >
                [02] Client Flow
              </Link>
              <Link 
                href={`/workspaces/${slug}/products`} 
                className="px-3 py-2 border border-transparent hover:border-black hover:bg-zinc-50 transition-all block"
              >
                [03] Product Catalog
              </Link>
              <Link 
                href={`/workspaces/${slug}/suppliers`} 
                className="px-3 py-2 border border-transparent hover:border-black hover:bg-zinc-50 transition-all block"
              >
                [04] Supplier Network
              </Link>
              <Link 
                href={`/workspaces/${slug}/settings`} 
                className="px-3 py-2 border border-transparent hover:border-black hover:bg-zinc-50 transition-all block"
              >
                [05] System Settings
              </Link>
            </nav>
          </div>

        </div>

        {/* FOOTER USER MANAGEMENT COMPONENT */}
        <div className="p-6 border-t border-black bg-zinc-50 flex flex-col gap-2 font-mono text-[11px]">
          <div className="truncate">
            <span className="text-zinc-400 block text-[9px] uppercase">OPERATOR</span>
            <span className="font-bold text-black uppercase">{user.name}</span>
          </div>
          <div className="text-[9px] text-zinc-400 border-t border-zinc-200 pt-2 flex justify-between items-center">
            <span>MANNA v2026.4</span>
            <form action={logoutAction}>
              <button type="submit" className="text-black font-bold underline hover:no-underline uppercase cursor-pointer bg-transparent border-none p-0 font-mono text-[9px]">
                Logout
              </button>
            </form>
          </div>
        </div>

      </aside>

      {/* CORE WORKSPACE DASHBOARD VIEWPORT STREAM */}
      <main className="flex-1 overflow-y-auto min-w-0 bg-white">
        {children}
      </main>

    </div>
  );
}