// src/app/workspaces/[slug]/MobileNavDrawer.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/logout";
import { NotificationBell } from "@/components/NotificationBell";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";

interface MobileNavDrawerProps {
  slug: string;
  shop: {
    id: string;
    name: string;
    shortName?: string | null;
    primaryColor?: string | null;
    logoUrl?: string | null;
    taxPin?: string | null;
    code?: string | null;
  };
  user: {
    name: string;
    isSuperAdmin?: boolean;
  };
  planName?: string;
  isLifetime?: boolean;
}

export function MobileNavDrawer({ slug, shop, user, planName = "FREE", isLifetime = false }: MobileNavDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const brandColor = shop.primaryColor || "#064e3b";
  const shopInitial = (shop.shortName || shop.name || "W").charAt(0).toUpperCase();
  const userInitial = (user.name || "U").charAt(0).toUpperCase();

  type NavItem = {
    label: string;
    href?: string;
    exact?: boolean;
    children?: { href: string; label: string; exact?: boolean }[];
  };

  const navItems: NavItem[] = [
    { href: `/workspaces/${slug}`, label: "Overview", exact: true },
    {
      label: "Billing & Invoices",
      children: [
        { href: `/workspaces/${slug}/documents`, label: "All Documents", exact: true },
        { href: `/workspaces/${slug}/documents/recurring`, label: "Recurring Invoices" },
      ],
    },
    { href: `/workspaces/${slug}/inbox`, label: "Shared Inbox" },
    { href: `/workspaces/${slug}/pos`, label: "Point of Sale (POS)" },
    {
      label: "Contacts",
      children: [
        { href: `/workspaces/${slug}/clients`, label: "Clients" },
        { href: `/workspaces/${slug}/suppliers`, label: "Suppliers" },
      ],
    },
    { href: `/workspaces/${slug}/products`, label: "Product Catalog" },
    {
      label: "Inventory",
      children: [
        { href: `/workspaces/${slug}/inventory`, label: "Stock Overview", exact: true },
        { href: `/workspaces/${slug}/inventory/locations`, label: "Locations" },
        { href: `/workspaces/${slug}/inventory/adjustments`, label: "Adjustments" },
        { href: `/workspaces/${slug}/inventory/transfers`, label: "Transfers" },
        { href: `/workspaces/${slug}/inventory/reports/valuation`, label: "Stock Valuation" },
        { href: `/workspaces/${slug}/inventory/reports/movement`, label: "Movement History" },
        { href: `/workspaces/${slug}/inventory/reports/low-stock`, label: "Low Stock Alerts" },
        { href: `/workspaces/${slug}/inventory/reports/abc`, label: "ABC Analysis" },
      ],
    },
    {
      label: "Cash Book",
      children: [
        { href: `/workspaces/${slug}/incomes`, label: "Other Income" },
        { href: `/workspaces/${slug}/expenses`, label: "Operating Expenses" },
      ],
    },
    {
      label: "Payroll",
      children: [
        { href: `/workspaces/${slug}/payroll`, label: "Payroll Vouchers" },
        { href: `/workspaces/${slug}/employees`, label: "Employees" },
      ],
    },
    {
      label: "Accounting",
      children: [
        { href: `/workspaces/${slug}/finance/tax/settings`, label: "Tax Profile" },
        { href: `/workspaces/${slug}/finance/tax/computation`, label: "Tax Computation" },
        { href: `/workspaces/${slug}/finance/accounts`, label: "Chart of Accounts" },
        { href: `/workspaces/${slug}/finance/opening-balances`, label: "Opening Balances" },
        { href: `/workspaces/${slug}/finance/ledger`, label: "Journal Entries" },
        { href: `/workspaces/${slug}/finance/reconciliation`, label: "Bank Reconciliation" },
        { href: `/workspaces/${slug}/finance/periods`, label: "Accounting Periods" },
        { href: `/workspaces/${slug}/finance/budgets`, label: "Operating Budgets" },
        { href: `/workspaces/${slug}/finance/reports/pl`, label: "P&L Statement" },
        { href: `/workspaces/${slug}/finance/reports/balance-sheet`, label: "Balance Sheet" },
        { href: `/workspaces/${slug}/finance/reports/cashflow`, label: "Cash Flow" },
        { href: `/workspaces/${slug}/finance/reports/trial-balance`, label: "Trial Balance" },
        { href: `/workspaces/${slug}/finance/reports/payables-aging`, label: "Payables Aging (AP)" },
        { href: `/workspaces/${slug}/finance/tax/assets`, label: "Fixed Assets Register" },
        { href: `/workspaces/${slug}/finance/tax/instalments`, label: "Instalment Tax" },
        { href: `/workspaces/${slug}/finance/tax/tot`, label: "Turnover Tax (TOT)" },
      ],
    },
    { href: `/workspaces/${slug}/analytics`, label: "Analytics" },
    {
      label: "Settings",
      children: [
        { href: `/workspaces/${slug}/team`, label: "Team Management" },
        { href: `/workspaces/${slug}/settings/billing`, label: "Billing & Plans" },
        { href: `/workspaces/${slug}/settings`, label: "Workspace Details", exact: true },
        { href: `/workspaces/${slug}/settings/currencies`, label: "Multi-Currency Rates" },
        { href: `/workspaces/${slug}/settings/terms`, label: "Commercial Terms" },
        { href: `/workspaces/${slug}/settings/diagnostics`, label: "GL Diagnostics" },
        { href: `/workspaces/${slug}/guide`, label: "Operator Guide" },
      ],
    },
  ];

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  // Track which mobile sections are open
  const [openSections, setOpenSections] = useState<Set<number>>(new Set());

  function toggleSection(idx: number) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  const planBadgeStyle = isLifetime
    ? { bg: "#fef3c7", border: "#fcd34d", color: "#78350f" }
    : planName === "PRO"
    ? { bg: "#ecfdf5", border: "#a7f3d0", color: "#065f46" }
    : { bg: "#f4f4f5", border: "#e4e4e7", color: "#52525b" };

  return (
    <div className="lg:hidden sticky top-0 z-40">
      {/* ── Mobile Top Bar ─────────────────────────────────── */}
      <div
        className="flex justify-between items-center px-4 h-[52px]"
        style={{
          backgroundColor: "#0f1117",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Shop identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          {shop.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shop.logoUrl}
              alt={shop.name}
              className="w-7 h-7 rounded-lg object-contain shrink-0"
              style={{ backgroundColor: "rgba(255,255,255,0.1)", padding: "2px" }}
            />
          ) : (
            <div
              className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-white font-bold text-xs"
              style={{ backgroundColor: brandColor }}
            >
              {shopInitial}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-white font-semibold text-[13px] truncate leading-tight">
              {shop.shortName || shop.name}
            </h2>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <NotificationBell shopId={shop.id} shopSlug={slug} />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wide transition-all cursor-pointer border"
            style={{
              backgroundColor: isOpen ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)",
              borderColor: "rgba(255,255,255,0.1)",
              color: "#d1d5db",
            }}
            aria-label="Toggle Navigation Menu"
          >
            {isOpen ? (
              <X className="w-4 h-4" strokeWidth={2} />
            ) : (
              <Menu className="w-4 h-4" strokeWidth={2} />
            )}
            <span>{isOpen ? "Close" : "Menu"}</span>
          </button>
        </div>
      </div>

      {/* ── Slide-Down Drawer Panel ─────────────────────────── */}
      {isOpen && (
        <div
          className="overflow-y-auto max-h-[85dvh] animate-in slide-in-from-top duration-200"
          style={{
            backgroundColor: "#0f1117",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {/* Workspace info strip */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center gap-2">
              {shop.code && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded text-zinc-400"
                      style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  CODE: {shop.code}
                </span>
              )}
              {shop.taxPin && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded text-zinc-400"
                      style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  PIN: {shop.taxPin}
                </span>
              )}
              {!shop.taxPin && (
                <span className="text-[10px] text-amber-400 font-medium">⚠ Tax PIN missing</span>
              )}
            </div>
            <Link
              href="/workspaces"
              onClick={() => setIsOpen(false)}
              className="text-[10px] font-semibold text-zinc-500 hover:text-zinc-300 transition-colors no-underline uppercase tracking-wide"
            >
              Switch →
            </Link>
          </div>

          {/* Nav items */}
          <nav className="p-3 flex flex-col gap-0.5 font-sans text-[13px]">
            {navItems.map((item, idx) => {
              if (item.children) {
                const isChildActive = item.children.some((child) => isActive(child.href, child.exact));
                const isSectionOpen = openSections.has(idx);

                return (
                  <div key={idx} className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => toggleSection(idx)}
                      className="sidebar-item w-full text-left"
                      style={isChildActive ? { color: "#d1d5db" } : {}}
                    >
                      <span className="flex-1 truncate">{item.label}</span>
                      <ChevronDown
                        className="w-3.5 h-3.5 shrink-0 transition-transform duration-200"
                        style={{
                          transform: isSectionOpen ? "rotate(180deg)" : "rotate(0deg)",
                          color: "#4b5563",
                        }}
                      />
                    </button>

                    {/* Accordion */}
                    <div className={`grid transition-all duration-200 ease-out ${isSectionOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                      <div className="overflow-hidden">
                        <div
                          className="ml-3 pl-3 flex flex-col gap-0.5 pt-0.5 pb-1"
                          style={{ borderLeft: "1px solid rgba(255,255,255,0.07)" }}
                        >
                          {item.children.map((child) => {
                            const active = isActive(child.href, child.exact);
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setIsOpen(false)}
                                className="sidebar-item text-[12px]"
                                style={
                                  active
                                    ? {
                                        backgroundColor: `color-mix(in srgb, ${brandColor} 18%, transparent)`,
                                        color: brandColor,
                                        fontWeight: 600,
                                      }
                                    : {}
                                }
                              >
                                <ChevronRight className="w-3 h-3 shrink-0" style={{ color: active ? brandColor : "#374151" }} />
                                <span className="truncate">{child.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              const active = item.href ? isActive(item.href, item.exact) : false;
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  onClick={() => setIsOpen(false)}
                  className="sidebar-item"
                  style={
                    active
                      ? {
                          backgroundColor: `color-mix(in srgb, ${brandColor} 18%, transparent)`,
                          color: brandColor,
                          fontWeight: 600,
                        }
                      : {}
                  }
                >
                  <span className="truncate">{item.label}</span>
                  {active && (
                    <span
                      className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: brandColor }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Operator footer */}
          <div
            className="p-4 flex flex-col gap-3"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.07)",
              backgroundColor: "rgba(0,0,0,0.25)",
            }}
          >
            {user.isSuperAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-lg no-underline transition-all"
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.12)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  color: "#fcd34d",
                }}
              >
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide">
                  <span>👑</span>
                  <span>Super Admin Terminal</span>
                </span>
                <span className="text-[10px] opacity-60">→</span>
              </Link>
            )}

            {/* Operator row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                  style={{ backgroundColor: brandColor }}
                >
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-[12px] font-semibold leading-tight truncate">{user.name}</p>
                  <Link
                    href={`/workspaces/${slug}/settings/billing`}
                    onClick={() => setIsOpen(false)}
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

              <form action={logoutAction}>
                <button
                  type="submit"
                  className="text-rose-500 hover:text-rose-400 text-[11px] font-semibold uppercase tracking-wide transition-colors cursor-pointer bg-transparent border-none px-2"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
