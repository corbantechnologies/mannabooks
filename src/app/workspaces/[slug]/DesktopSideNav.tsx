// src/app/workspaces/[slug]/DesktopSideNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface DesktopSideNavProps {
  slug: string;
}

type NavItem = {
  label: string;
  href?: string;
  exact?: boolean;
  children?: { href: string; label: string; exact?: boolean }[];
};

export function DesktopSideNav({ slug }: DesktopSideNavProps) {
  const pathname = usePathname();

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
        { href: `/workspaces/${slug}/finance/periods`, label: "Accounting Periods" },
        { href: `/workspaces/${slug}/finance/budgets`, label: "Operating Budgets" },
        { href: `/workspaces/${slug}/finance/reports/pl`, label: "P&L Statement" },
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
    <nav className="flex flex-col gap-0.5 font-sans text-[13px] font-medium tracking-normal text-zinc-600">
      {navItems.map((item, idx) => {
        if (item.children) {
          const isChildActive = item.children.some(child => isActive(child.href, child.exact));
          return (
            <details key={idx} className="group" open={isChildActive}>
              <summary className="px-3 py-2 border border-transparent rounded cursor-pointer transition-all hover:bg-zinc-50 hover:text-black list-none flex justify-between items-center select-none">
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
                      className={`px-3 py-1.5 border rounded transition-all block ${
                        active
                          ? "border-black bg-black text-white"
                          : "border-transparent text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-800"
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
            className={`px-3 py-2 border rounded transition-all block ${
              active
                ? "border-black bg-black text-white"
                : "border-transparent hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-800"
            }`}
          >
            {item.label}
          </Link>
        );
      })}

      <div className="mt-6 pt-5 border-t border-zinc-200/80">
        <Link
          href="/workspaces"
          className="px-3 py-2 border border-zinc-200 text-zinc-500 rounded transition-all flex items-center gap-2 hover:border-black hover:bg-zinc-50 hover:text-black"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16"/></svg>
          Switch Workspace
        </Link>
      </div>
    </nav>
  );
}
