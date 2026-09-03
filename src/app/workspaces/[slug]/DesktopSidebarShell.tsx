"use client";

import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { logoutAction } from "@/lib/actions/logout";
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";

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

  // Initials from name
  const shopInitial = (shop.shortName || shop.name || "W").charAt(0).toUpperCase();
  const userInitial = (user.name || "U").charAt(0).toUpperCase();
  const brandColor = shop.primaryColor || "#064e3b";

  const planBadgeStyle = isLifetime
    ? { bg: "#fef3c7", border: "#fcd34d", color: "#78350f" }
    : planName === "PRO"
    ? { bg: "#ecfdf5", border: "#a7f3d0", color: "#065f46" }
    : { bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.12)", color: "#6b7280" };

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
      {/* ───────────────────────────────────────────────────────
          DARK SIDEBAR (desktop 1024px+)
      ─────────────────────────────────────────────────────── */}
      <aside
        className={`hidden lg:flex flex-col h-screen sticky top-0 shrink-0 z-20 transition-all duration-300 ease-in-out ${
          isCollapsed
            ? "w-0 overflow-hidden opacity-0 pointer-events-none"
            : "w-[230px]"
        }`}
        style={{
          backgroundColor: "var(--sidebar-bg, #0f1117)",
          borderRight: "1px solid var(--sidebar-border, rgba(255,255,255,0.07))",
        }}
      >
        {/* ── 1. Workspace Identity Header ───────────────────── */}
        <div
          className="p-4 shrink-0 select-none"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          {/* Top row: label + Switch + collapse */}
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
              Workspace
            </span>
            <div className="flex items-center gap-1.5">
              <Link
                href="/workspaces"
                className="text-[10px] font-semibold text-zinc-500 hover:text-zinc-300 uppercase tracking-wide transition-colors no-underline"
              >
                Switch
              </Link>
              <button
                type="button"
                onClick={toggleSidebar}
                title="Collapse sidebar ([ or Ctrl+B)"
                className="p-1 text-zinc-600 hover:text-zinc-300 rounded-md hover:bg-white/10 transition-all cursor-pointer bg-transparent border-none"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Shop logo + name */}
          <div className="flex items-center gap-2.5">
            {shop.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shop.logoUrl}
                alt={shop.name}
                className="w-9 h-9 rounded-lg object-contain shrink-0"
                style={{ backgroundColor: "rgba(255,255,255,0.08)", padding: "3px" }}
              />
            ) : (
              <div
                className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: brandColor }}
              >
                {shopInitial}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-white font-semibold text-[13px] truncate leading-tight">
                {shop.shortName || shop.name}
              </h2>
              {shop.taxPin ? (
                <p className="text-zinc-600 text-[10px] font-mono truncate mt-0.5">
                  PIN: {shop.taxPin}
                </p>
              ) : shop.code ? (
                <p className="text-zinc-600 text-[10px] font-mono truncate mt-0.5">
                  CODE: {shop.code}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* ── 2. Scrollable Nav ──────────────────────────────── */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 min-w-0"
             style={{ scrollbarWidth: "none" }}>
          {sidebarChildren}
        </div>

        {/* ── 3. Operator Footer ────────────────────────────── */}
        <div
          className="p-3.5 shrink-0 select-none"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            backgroundColor: "rgba(0,0,0,0.25)",
          }}
        >
          {/* Super-admin shortcut */}
          {user.isSuperAdmin && (
            <Link
              href="/admin"
              className="flex items-center justify-between px-3 py-2 rounded-lg mb-3 no-underline transition-all"
              style={{
                backgroundColor: "rgba(245, 158, 11, 0.12)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                color: "#fcd34d",
              }}
            >
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide">
                <span>👑</span>
                <span>Super Admin</span>
              </span>
              <span className="text-[10px] opacity-60">→</span>
            </Link>
          )}

          {/* Operator row */}
          <div className="flex items-center gap-2.5">
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-[11px]"
              style={{ backgroundColor: brandColor }}
            >
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-[12px] font-semibold truncate leading-tight">
                {user.name}
              </p>
              <Link
                href={`/workspaces/${slug}/settings/billing`}
                className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border no-underline mt-0.5 transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: planBadgeStyle.bg,
                  borderColor: planBadgeStyle.border,
                  color: planBadgeStyle.color,
                }}
              >
                <span>{isLifetime ? "👑" : "⚡"}</span>
                <span>{planName}</span>
              </Link>
            </div>
          </div>

          {/* Version + logout */}
          <div
            className="flex items-center justify-between mt-3 pt-2.5"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="text-zinc-700 text-[10px] font-mono">v2026.4</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-rose-500 hover:text-rose-400 text-[10px] font-semibold uppercase tracking-wide transition-colors cursor-pointer bg-transparent border-none"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ───────────────────────────────────────────────────────
          MAIN CONTENT AREA
      ─────────────────────────────────────────────────────── */}
      <main
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{ backgroundColor: "var(--portal-canvas, #f4f5f7)" }}
      >
        {/* ── Desktop top header bar ─────────────────────────── */}
        <header
          className="hidden lg:flex items-center justify-between px-5 shrink-0 sticky top-0 z-30 select-none"
          style={{
            height: "52px",
            backgroundColor: "rgba(244, 245, 247, 0.92)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: "1px solid #e2e4e8",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          {/* Left: collapse toggle + breadcrumb */}
          <div className="flex items-center gap-2.5 text-sm font-sans">
            <button
              type="button"
              onClick={toggleSidebar}
              title={isCollapsed ? "Expand Sidebar ([ or Ctrl+B)" : "Collapse Sidebar ([ or Ctrl+B)"}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60 rounded-lg transition-all flex items-center justify-center cursor-pointer border-none bg-transparent"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>

            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 font-medium text-[13px]">Workspaces</span>
              <ChevronRight className="w-3 h-3 text-zinc-300" />
              <span className="text-zinc-900 font-semibold text-[13px]">{shop.name}</span>
              {shop.code && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 bg-white border border-zinc-200 text-zinc-500 rounded-md">
                  {shop.code}
                </span>
              )}
            </div>
          </div>

          {/* Right: actions injected from layout */}
          <div className="flex items-center gap-2.5">{headerChildren}</div>
        </header>

        {/* ── Page content ───────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">{contentChildren}</div>
      </main>
    </SidebarContext.Provider>
  );
}
