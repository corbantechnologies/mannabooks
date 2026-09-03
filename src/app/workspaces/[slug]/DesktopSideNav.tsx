// src/app/workspaces/[slug]/DesktopSideNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  RefreshCw,
  Inbox,
  ShoppingCart,
  Users,
  User,
  Truck,
  Package,
  Warehouse,
  BarChart2,
  MapPin,
  SlidersHorizontal,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  History,
  AlertTriangle,
  PieChart,
  BookOpen,
  Briefcase,
  FileCheck,
  Calculator,
  BarChart,
  Settings,
  CreditCard,
  Globe,
  BookMarked,
  Wrench,
  ShieldCheck,
  ChevronDown,
  DollarSign,
  FileBarChart,
  Scale,
  Landmark,
  Building2,
  Layers,
} from "lucide-react";

interface DesktopSideNavProps {
  slug: string;
  brandColor?: string;
}

type ChildItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
};

type NavItem = {
  label: string;
  href?: string;
  exact?: boolean;
  icon: React.ElementType;
  children?: ChildItem[];
};

export function DesktopSideNav({ slug, brandColor = "#064e3b" }: DesktopSideNavProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: `/workspaces/${slug}`, label: "Overview", icon: LayoutDashboard, exact: true },
    {
      label: "Billing & Invoices",
      icon: FileText,
      children: [
        { href: `/workspaces/${slug}/documents`, label: "All Documents", icon: FileText, exact: true },
        { href: `/workspaces/${slug}/documents/recurring`, label: "Recurring", icon: RefreshCw },
      ],
    },
    { href: `/workspaces/${slug}/inbox`, label: "Shared Inbox", icon: Inbox },
    { href: `/workspaces/${slug}/pos`, label: "Point of Sale", icon: ShoppingCart },
    {
      label: "Contacts",
      icon: Users,
      children: [
        { href: `/workspaces/${slug}/clients`, label: "Clients", icon: User },
        { href: `/workspaces/${slug}/suppliers`, label: "Suppliers", icon: Truck },
      ],
    },
    { href: `/workspaces/${slug}/products`, label: "Product Catalog", icon: Package },
    {
      label: "Inventory",
      icon: Warehouse,
      children: [
        { href: `/workspaces/${slug}/inventory`, label: "Stock Overview", icon: BarChart2, exact: true },
        { href: `/workspaces/${slug}/inventory/locations`, label: "Locations", icon: MapPin },
        { href: `/workspaces/${slug}/inventory/adjustments`, label: "Adjustments", icon: SlidersHorizontal },
        { href: `/workspaces/${slug}/inventory/transfers`, label: "Transfers", icon: ArrowLeftRight },
        { href: `/workspaces/${slug}/inventory/reports/valuation`, label: "Valuation", icon: DollarSign },
        { href: `/workspaces/${slug}/inventory/reports/movement`, label: "Movement History", icon: History },
        { href: `/workspaces/${slug}/inventory/reports/low-stock`, label: "Low Stock", icon: AlertTriangle },
        { href: `/workspaces/${slug}/inventory/reports/abc`, label: "ABC Analysis", icon: PieChart },
      ],
    },
    {
      label: "Cash Book",
      icon: BookOpen,
      children: [
        { href: `/workspaces/${slug}/incomes`, label: "Other Income", icon: TrendingUp },
        { href: `/workspaces/${slug}/expenses`, label: "Expenses", icon: TrendingDown },
      ],
    },
    {
      label: "Payroll",
      icon: Briefcase,
      children: [
        { href: `/workspaces/${slug}/payroll`, label: "Payroll Vouchers", icon: FileCheck },
        { href: `/workspaces/${slug}/employees`, label: "Employees", icon: Users },
      ],
    },
    {
      label: "Accounting",
      icon: Calculator,
      children: [
        { href: `/workspaces/${slug}/finance/tax/settings`, label: "Tax Profile", icon: ShieldCheck },
        { href: `/workspaces/${slug}/finance/tax/computation`, label: "Tax Computation", icon: FileBarChart },
        { href: `/workspaces/${slug}/finance/accounts`, label: "Chart of Accounts", icon: Layers },
        { href: `/workspaces/${slug}/finance/opening-balances`, label: "Opening Balances", icon: Scale },
        { href: `/workspaces/${slug}/finance/ledger`, label: "Journal Entries", icon: BookMarked },
        { href: `/workspaces/${slug}/finance/reconciliation`, label: "Bank Reconciliation", icon: Landmark },
        { href: `/workspaces/${slug}/finance/periods`, label: "Accounting Periods", icon: RefreshCw },
        { href: `/workspaces/${slug}/finance/budgets`, label: "Operating Budgets", icon: BarChart2 },
        { href: `/workspaces/${slug}/finance/reports/pl`, label: "P&L Statement", icon: TrendingUp },
        { href: `/workspaces/${slug}/finance/reports/balance-sheet`, label: "Balance Sheet", icon: Scale },
        { href: `/workspaces/${slug}/finance/reports/cashflow`, label: "Cash Flow", icon: BarChart },
        { href: `/workspaces/${slug}/finance/reports/trial-balance`, label: "Trial Balance", icon: FileBarChart },
        { href: `/workspaces/${slug}/finance/reports/payables-aging`, label: "Payables Aging (AP)", icon: AlertTriangle },
        { href: `/workspaces/${slug}/finance/tax/assets`, label: "Fixed Assets", icon: Building2 },
        { href: `/workspaces/${slug}/finance/tax/instalments`, label: "Instalment Tax", icon: DollarSign },
        { href: `/workspaces/${slug}/finance/tax/tot`, label: "Turnover Tax (TOT)", icon: Globe },
      ],
    },
    { href: `/workspaces/${slug}/analytics`, label: "Analytics", icon: BarChart },
    {
      label: "Settings",
      icon: Settings,
      children: [
        { href: `/workspaces/${slug}/team`, label: "Team Management", icon: Users },
        { href: `/workspaces/${slug}/settings/billing`, label: "Billing & Plans", icon: CreditCard },
        { href: `/workspaces/${slug}/settings`, label: "Workspace Details", icon: Settings, exact: true },
        { href: `/workspaces/${slug}/settings/currencies`, label: "Multi-Currency", icon: Globe },
        { href: `/workspaces/${slug}/settings/terms`, label: "Commercial Terms", icon: FileText },
        { href: `/workspaces/${slug}/settings/diagnostics`, label: "GL Diagnostics", icon: Wrench },
        { href: `/workspaces/${slug}/guide`, label: "Operator Guide", icon: BookMarked },
      ],
    },
  ];

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  // Compute which sections should start open
  const getInitialOpen = () => {
    const open = new Set<number>();
    navItems.forEach((item, idx) => {
      if (item.children) {
        const hasActive = item.children.some((c) => isActive(c.href, c.exact));
        if (hasActive) open.add(idx);
      }
    });
    return open;
  };

  const [openSections, setOpenSections] = useState<Set<number>>(getInitialOpen);

  // Re-compute on navigation
  useEffect(() => {
    setOpenSections(getInitialOpen());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function toggleSection(idx: number) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  return (
    <nav className="flex flex-col gap-0 font-sans text-[13px]">
      {navItems.map((item, idx) => {
        /* ── Section with children ── */
        if (item.children) {
          const isOpen = openSections.has(idx);
          const isChildActive = item.children.some((c) => isActive(c.href, c.exact));
          const Icon = item.icon;

          return (
            <div key={idx} className="flex flex-col">
              {/* Group header button */}
              <button
                type="button"
                onClick={() => toggleSection(idx)}
                className="sidebar-item w-full text-left"
                style={isChildActive ? { color: "#d1d5db" } : {}}
              >
                <Icon
                  className="w-[15px] h-[15px] shrink-0"
                  strokeWidth={1.75}
                  style={{ color: isChildActive ? brandColor : undefined }}
                />
                <span className="flex-1 truncate">{item.label}</span>
                <ChevronDown
                  className="w-3 h-3 shrink-0 transition-transform duration-200"
                  style={{
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    color: "#4b5563",
                  }}
                />
              </button>

              {/* Children accordion — CSS grid trick for smooth animation */}
              <div
                className={`grid transition-all duration-200 ease-out ${
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <div
                    className="ml-[13px] pl-3 flex flex-col gap-0.5 pt-0.5 pb-1"
                    style={{ borderLeft: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    {item.children.map((child) => {
                      const active = isActive(child.href, child.exact);
                      const ChildIcon = child.icon;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
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
                          <ChildIcon
                            className="w-[13px] h-[13px] shrink-0"
                            strokeWidth={2}
                            style={{ color: active ? brandColor : "#4b5563" }}
                          />
                          <span className="truncate text-[12px]">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        }

        /* ── Standalone link ── */
        const active = item.href ? isActive(item.href, item.exact) : false;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href!}
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
            <Icon
              className="w-[15px] h-[15px] shrink-0"
              strokeWidth={1.75}
              style={{ color: active ? brandColor : undefined }}
            />
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
  );
}
