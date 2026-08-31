// src/app/workspaces/[slug]/MobileNavDrawer.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/logout";

interface MobileNavDrawerProps {
  slug: string;
  shop: {
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

  type NavItem = {
    label: string;
    href?: string;
    exact?: boolean;
    children?: { href: string; label: string; exact?: boolean }[];
  };

  const navItems: NavItem[] = [
    { href: `/workspaces/${slug}`, label: "Overview", exact: true },
    { href: `/workspaces/${slug}/documents`, label: "Billing & Invoices" },
    { href: `/workspaces/${slug}/inbox`, label: "Shared Inbox" },
    { href: `/workspaces/${slug}/pos`, label: "Point of Sale (POS)" },
    { 
      label: "Contacts", 
      children: [
        { href: `/workspaces/${slug}/clients`, label: "Clients" },
        { href: `/workspaces/${slug}/suppliers`, label: "Suppliers" },
      ]
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
      ]
    },
    {
      label: "Cash Book",
      children: [
        { href: `/workspaces/${slug}/incomes`, label: "Other Income" },
        { href: `/workspaces/${slug}/expenses`, label: "Operating Expenses" },
      ]
    },
    {
      label: "Payroll",
      children: [
        { href: `/workspaces/${slug}/payroll`, label: "Payroll Vouchers" },
        { href: `/workspaces/${slug}/employees`, label: "Employees" },
      ]
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
        { href: `/workspaces/${slug}/finance/tax/assets`, label: "Fixed Assets Register" },
        { href: `/workspaces/${slug}/finance/tax/instalments`, label: "Instalment Tax" },
        { href: `/workspaces/${slug}/finance/tax/tot`, label: "Turnover Tax (TOT)" },
      ]
    },
    { href: `/workspaces/${slug}/analytics`, label: "Analytics" },
    {
      label: "Settings",
      children: [
        { href: `/workspaces/${slug}/team`, label: "Team Management" },
        { href: `/workspaces/${slug}/settings/billing`, label: "Billing & Plans" },
        { href: `/workspaces/${slug}/settings`, label: "Workspace Details", exact: true },
        { href: `/workspaces/${slug}/settings/terms`, label: "Commercial Terms" },
        { href: `/workspaces/${slug}/settings/diagnostics`, label: "GL Diagnostics" },
        { href: `/workspaces/${slug}/guide`, label: "Operator Guide" },
      ]
    }
  ];

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="lg:hidden border-b border-zinc-200/80 glass-panel sticky top-0 z-40">
      {/* MOBILE TOP NAVIGATION BAR */}
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center gap-3 min-w-0">
          {shop.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shop.logoUrl} alt={shop.name} className="w-7 h-7 object-contain border border-zinc-200 p-0.5 bg-white rounded shrink-0" />
          ) : (
            <span
              className="w-3.5 h-3.5 border border-black/30 rounded-sm shrink-0 inline-block"
              style={{ backgroundColor: shop.primaryColor || "#000000" }}
            />
          )}
          <div className="min-w-0">
            <h2 className="font-sans font-semibold uppercase tracking-tight text-sm truncate leading-none">
              {shop.shortName || shop.name}
            </h2>
            <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 block mt-0.5 font-semibold">
              Workspace
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="border border-zinc-300 rounded px-3 py-1.5 font-mono text-xs font-semibold uppercase hover:bg-black hover:text-white transition-colors flex items-center gap-1.5 bg-white"
          aria-label="Toggle Navigation Menu"
        >
          <span>{isOpen ? "✕" : "☰"}</span>
          <span>{isOpen ? "Close" : "Menu"}</span>
        </button>
      </div>

      {/* MOBILE OVERLAY DRAWER PANEL */}
      {isOpen && (
        <div className="border-t border-zinc-200/80 bg-white/95 backdrop-blur-md p-6 space-y-6 font-mono text-xs shadow-lg animate-in slide-in-from-top duration-200">
          {/* WORKSPACE PROFILE BRIEF */}
          <div className="space-y-2 border-b border-zinc-200 pb-4">
            <div className="flex justify-between items-center">
              <span className="text-[9px] uppercase tracking-widest text-zinc-400">ACTIVE WORKSPACE</span>
              <Link
                href="/workspaces"
                onClick={() => setIsOpen(false)}
                className="text-[10px] uppercase font-bold text-black underline hover:no-underline"
              >
                Switch / Add →
              </Link>
            </div>
            {shop.code && (
              <span className="inline-block border border-zinc-200 text-[9px] px-1.5 py-0.5 uppercase tracking-tight text-zinc-600 bg-zinc-50 font-bold mr-1">
                CODE: {shop.code}
              </span>
            )}
            {shop.taxPin ? (
              <span className="inline-block border border-black text-[9px] px-1.5 py-0.5 uppercase tracking-tight text-zinc-600 bg-zinc-50 font-bold">
                PIN: {shop.taxPin}
              </span>
            ) : (
              <span className="text-[9px] italic text-rose-600 block">&gt; CONFIGURATION REQUIRED</span>
            )}
          </div>

          {/* NAVIGATION LINKS */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 block mb-2 font-bold font-sans">Directories</span>
            <nav className="flex flex-col gap-1 font-medium font-sans text-xs tracking-normal text-zinc-600">
              {navItems.map((item, idx) => {
                if (item.children) {
                  const isChildActive = item.children.some(child => isActive(child.href, child.exact));
                  return (
                    <details key={idx} className="group" open={isChildActive}>
                      <summary className="px-3 py-2 border border-transparent rounded cursor-pointer transition-all hover:bg-zinc-50 hover:border-zinc-300 list-none flex justify-between items-center select-none text-left">
                        <span>{item.label}</span>
                        <svg className="w-3 h-3 text-zinc-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </summary>
                      <div className="pl-6 pr-2 py-1 flex flex-col gap-1 mt-1 border-l border-zinc-200 ml-4">
                        {item.children.map(child => {
                          const active = isActive(child.href, child.exact);
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setIsOpen(false)}
                              className={`px-3 py-2 border rounded transition-all block text-left ${
                                active
                                  ? "border-black bg-black text-white"
                                  : "border-zinc-200 text-zinc-500 hover:border-black hover:bg-zinc-50 hover:text-black"
                              }`}
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    </details>
                  );
                }

                const active = item.href ? isActive(item.href, item.exact) : false;
                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    onClick={() => setIsOpen(false)}
                    className={`px-3 py-2.5 border rounded transition-all block text-left ${
                      active
                        ? "border-black bg-black text-white"
                        : "border-zinc-200 hover:border-black hover:bg-zinc-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* USER FOOTER & LOGOUT */}
          <div className="pt-4 border-t border-black space-y-3 bg-zinc-50 p-4">
            {user.isSuperAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="bg-black text-amber-300 border border-amber-500/40 px-3 py-2 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-between no-underline"
              >
                <span>👑 Super Admin Terminal</span>
                <span>&rarr;</span>
              </Link>
            )}

            <div className="flex justify-between items-center">
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase">OPERATOR</span>
                <span className="font-bold text-black uppercase block">{user.name}</span>
                <Link
                  href={`/workspaces/${slug}/settings/billing`}
                  onClick={() => setIsOpen(false)}
                  className="inline-flex items-center gap-1 font-mono text-[9px] font-bold px-2 py-0.5 rounded border mt-1 no-underline"
                  style={{
                    backgroundColor: isLifetime ? "#fef3c7" : planName === "PRO" ? "#ecfdf5" : "#f4f4f5",
                    borderColor: isLifetime ? "#fcd34d" : planName === "PRO" ? "#a7f3d0" : "#e4e4e7",
                    color: isLifetime ? "#78350f" : planName === "PRO" ? "#065f46" : "#3f3f46",
                  }}
                >
                  <span>{isLifetime ? "👑" : "⚡"}</span>
                  <span>{planName}</span>
                </Link>
              </div>

              <form action={logoutAction}>
                <button
                  type="submit"
                  className="border border-black bg-black text-white px-3 py-1.5 font-bold uppercase text-[10px] hover:bg-zinc-800 transition-colors"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
