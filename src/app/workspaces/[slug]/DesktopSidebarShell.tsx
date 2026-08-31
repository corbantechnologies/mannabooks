"use client";

import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { logoutAction } from "@/lib/actions/logout";

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  expandSidebar: () => void;
  collapseSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  toggleSidebar: () => {},
  expandSidebar: () => {},
  collapseSidebar: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

interface DesktopSidebarShellProps {
  slug: string;
  shop: any;
  user: any;
  planName: string;
  isLifetime: boolean;
  sidebarChildren: React.ReactNode;
  headerChildren: React.ReactNode;
  contentChildren: React.ReactNode;
}

export function DesktopSidebarShell({
  slug,
  shop,
  user,
  planName,
  isLifetime,
  sidebarChildren,
  headerChildren,
  contentChildren,
}: DesktopSidebarShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("mannabooks_desktop_sidebar_collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }

    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((e.ctrlKey && e.key.toLowerCase() === "b") || e.key === "[") {
        e.preventDefault();
        setIsCollapsed((prev) => {
          const next = !prev;
          localStorage.setItem("mannabooks_desktop_sidebar_collapsed", String(next));
          return next;
        });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function toggleSidebar() {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("mannabooks_desktop_sidebar_collapsed", String(next));
      return next;
    });
  }

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        toggleSidebar,
        expandSidebar: () => {
          setIsCollapsed(false);
          localStorage.setItem("mannabooks_desktop_sidebar_collapsed", "false");
        },
        collapseSidebar: () => {
          setIsCollapsed(true);
          localStorage.setItem("mannabooks_desktop_sidebar_collapsed", "true");
        },
      }}
    >
      {/* GLOBAL EDITORIAL SIDEBAR (1024px+) */}
      <aside
        className={`hidden lg:flex flex-col justify-between bg-white h-screen sticky top-0 shrink-0 border-r border-zinc-200/80 transition-all duration-300 ease-in-out z-20 ${
          isCollapsed
            ? "w-0 -translate-x-full overflow-hidden border-none opacity-0 pointer-events-none"
            : "w-64 translate-x-0 opacity-100"
        }`}
      >
        {/* 1. STICKY TOP WORKSPACE HEADER (SHRINK-0) */}
        <div className="p-5 border-b border-zinc-200/80 bg-white shrink-0 space-y-3 w-64 select-none">
          <div className="flex justify-between items-center">
            <span className="font-sans text-[10px] uppercase tracking-wider text-zinc-400 block font-bold">
              Workspace
            </span>
            <div className="flex items-center gap-2">
              <Link
                href="/workspaces"
                className="font-sans text-[10px] uppercase font-bold text-black underline hover:no-underline"
              >
                Switch
              </Link>
              <button
                type="button"
                onClick={toggleSidebar}
                title="Close sidebar ([ or Ctrl+B)"
                className="p-1 text-zinc-400 hover:text-black rounded hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {shop.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shop.logoUrl}
                alt={shop.name}
                className="w-8 h-8 object-contain border border-zinc-200 p-0.5 bg-white rounded shrink-0"
              />
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
                <span className="font-mono text-[9px] italic text-rose-600 block mt-1">
                  &gt; CONFIGURATION REQUIRED
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. SCROLLABLE APPLICATION DIRECTORY LINKS */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2 w-64">
          <span className="font-sans text-[10px] uppercase tracking-wider text-zinc-400 block mb-3 font-bold">
            Directories
          </span>
          {sidebarChildren}
        </div>

        {/* 3. STICKY BOTTOM FOOTER OPERATOR & PLAN */}
        <div className="p-5 border-t border-zinc-200/80 bg-zinc-50/50 shrink-0 flex flex-col gap-2 font-sans text-xs w-64 select-none">
          {user.isSuperAdmin && (
            <Link
              href="/admin"
              className="bg-black hover:bg-zinc-800 text-amber-300 border border-amber-500/40 px-3 py-2 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-between no-underline transition-all shadow-xs mb-1"
            >
              <span className="flex items-center gap-1.5">
                <span>👑</span>
                <span>Super Admin</span>
              </span>
              <span>Terminal &rarr;</span>
            </Link>
          )}

          <div className="space-y-1">
            <span className="text-zinc-400 block text-[10px] uppercase font-bold">Active Operator</span>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-black truncate">{user.name}</span>
            </div>
            {/* PLAN SUBSCRIPTION BADGE */}
            <div className="pt-1">
              <Link
                href={`/workspaces/${slug}/settings/billing`}
                className="inline-flex items-center gap-1 font-mono text-[9px] font-bold px-2 py-0.5 rounded border transition-all no-underline"
                style={{
                  backgroundColor: isLifetime ? "#fef3c7" : planName === "PRO" ? "#ecfdf5" : "#f4f4f5",
                  borderColor: isLifetime ? "#fcd34d" : planName === "PRO" ? "#a7f3d0" : "#e4e4e7",
                  color: isLifetime ? "#78350f" : planName === "PRO" ? "#065f46" : "#3f3f46",
                }}
              >
                <span>{isLifetime ? "👑" : "⚡"}</span>
                <span>{planName}</span>
                <span className="text-[8px] opacity-70">→</span>
              </Link>
            </div>
          </div>
          <div className="text-[10px] text-zinc-400 border-t border-zinc-200/80 pt-2 flex justify-between items-center">
            <span>Manna v2026.4</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-rose-600 font-bold hover:underline cursor-pointer bg-transparent border-none p-0 uppercase text-[9px] tracking-wide"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* CORE WORKSPACE DASHBOARD VIEWPORT STREAM */}
      <main className="flex-1 flex flex-col min-w-0 bg-white transition-all duration-300">
        {/* DESKTOP HEADER NAVBAR */}
        <header className="hidden lg:flex border-b border-zinc-200/80 bg-white h-14 shrink-0 items-center justify-between px-6 sticky top-0 z-30 select-none">
          <div className="flex items-center gap-3 text-xs font-sans font-medium text-zinc-500">
            {/* COLLAPSE / EXPAND TOGGLE BUTTON */}
            <button
              type="button"
              onClick={toggleSidebar}
              title={isCollapsed ? "Expand Sidebar ([ or Ctrl+B)" : "Collapse Sidebar ([ or Ctrl+B)"}
              className="p-1.5 -ml-1 text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-md transition-colors flex items-center gap-1 font-mono text-[10px] font-bold uppercase border border-zinc-200 cursor-pointer"
            >
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              {isCollapsed && <span className="hidden sm:inline">Sidebar</span>}
            </button>

            <span className="text-zinc-400">Workspace</span>
            <span className="text-zinc-300">/</span>
            <span className="text-black font-semibold">{shop.name}</span>
            {shop.code && (
              <span className="ml-1 font-mono text-[10px] px-1.5 py-0.5 border border-zinc-200 bg-zinc-50 text-zinc-600 rounded-sm font-semibold">
                {shop.code}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">{headerChildren}</div>
        </header>

        <div className="flex-1 overflow-y-auto">{contentChildren}</div>
      </main>
    </SidebarContext.Provider>
  );
}
