// src/app/workspaces/[slug]/layout.tsx
import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { logoutAction } from "@/lib/actions/logout";
import { getShopPlanDetails } from "@/lib/paywall";
import Link from "next/link";
import { db } from "@/db";
import { fiscalYears } from "@/db/schema";
import { eq } from "drizzle-orm";

import { GracePeriodBanner } from "@/components/GracePeriodBanner";
import { FiscalYearNoticeBanner } from "@/components/FiscalYearNoticeBanner";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { DesktopSideNav } from "./DesktopSideNav";
import { DesktopSidebarShell } from "./DesktopSidebarShell";
import { BottomTabBar } from "./BottomTabBar";
import { KeyboardShortcutsProvider } from "@/components/KeyboardShortcutsProvider";
import { NotificationBell } from "@/components/NotificationBell";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function RefinedWorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  // 1. Await params (required in Next.js 15+)
  const { slug } = await params;

  // 2. Authenticate session and fetch multi-tenant profile fields entirely on the server
  const { shop, user } = await getActiveWorkspaceContext(slug);
  const planDetails = await getShopPlanDetails(shop.id);

  // 3. Check if GL is enabled and at least one fiscal year is declared
  const hasFiscalYear = !shop.isGlEnabled || (await db.query.fiscalYears.findFirst({
      where: eq(fiscalYears.shopId, shop.id),
  })) !== undefined;

  const brandColor = shop.primaryColor || "#064e3b";
  const isLifetime = Boolean(planDetails?.isLifetimePro || user.isSuperAdmin);
  const planName = isLifetime ? "LIFETIME PRO" : (planDetails?.planSpec.name || planDetails?.plan || "FREE").toUpperCase();

  return (
    <>
    <div
      style={{ "--brand-primary": brandColor } as React.CSSProperties}
      className="flex flex-col lg:flex-row min-h-screen portal-canvas"
    >
      <style>{`
        :root {
          --brand-primary: ${brandColor};
        }
        ::selection {
          background-color: ${brandColor} !important;
          color: #ffffff !important;
        }
        .btn-primary-modern, .btn-primary-emerald {
          background-color: ${brandColor} !important;
        }
        .btn-secondary-modern:hover, .btn-secondary-emerald:hover {
          border-color: ${brandColor} !important;
          color: ${brandColor} !important;
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
      <MobileNavDrawer slug={slug} shop={shop} user={user} planName={planName} isLifetime={isLifetime} />

      {/* DESKTOP RESPONSIVE SIDEBAR & MAIN VIEWPORT SHELL (1024px+) */}
      <DesktopSidebarShell
        slug={slug}
        shop={shop}
        user={user}
        planName={planName}
        isLifetime={isLifetime}
        sidebarChildren={<DesktopSideNav slug={slug} brandColor={brandColor} businessMode={((shop as any).businessMode || "HYBRID") as "SERVICES" | "RETAIL" | "HYBRID"} />}
        headerChildren={
          <>
            {user.isSuperAdmin && (
              <Link
                href="/admin"
                className="bg-black hover:bg-zinc-800 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 no-underline transition-all shadow-xs"
              >
                <span>👑</span>
                <span>Platform Admin</span>
              </Link>
            )}

            {/* HEADER PLAN BADGE */}
            <Link
              href={`/workspaces/${slug}/settings/billing`}
              className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2.5 py-1 rounded-md border transition-all no-underline shadow-2xs hover:opacity-80"
              style={{
                backgroundColor: isLifetime ? "#fef3c7" : planName === "PRO" ? "#ecfdf5" : "#f4f4f5",
                borderColor: isLifetime ? "#fcd34d" : planName === "PRO" ? "#a7f3d0" : "#e4e4e7",
                color: isLifetime ? "#78350f" : planName === "PRO" ? "#065f46" : "#3f3f46",
              }}
            >
              <span>{isLifetime ? "👑" : "⚡"}</span>
              <span>{planName}</span>
            </Link>

            <div className="flex items-center gap-1.5 font-sans text-xs text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Operator:</span>
              <span className="font-semibold text-black">{user.name}</span>
            </div>
            <NotificationBell shopId={shop.id} shopSlug={slug} />
            <Link
              href={`/workspaces/${slug}/documents/new`}
              className="bg-black hover:bg-zinc-800 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors"
            >
              + Create Document
            </Link>
          </>
        }
        contentChildren={
          <>
            {planDetails && <GracePeriodBanner slug={slug} planDetails={planDetails} />}
            {!hasFiscalYear && <FiscalYearNoticeBanner slug={slug} shopId={shop.id} />}
            {children}
            {/* Bottom tab bar safe-area spacer on mobile */}
            <div className="h-14 lg:hidden" />
          </>
        }
      />

    </div>

    {/* MOBILE STICKY BOTTOM NAV TAB BAR */}
    <BottomTabBar slug={slug} />
    <KeyboardShortcutsProvider slug={slug}>
      <></>
    </KeyboardShortcutsProvider>
  </>);
}