"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Package,
  BarChart2,
} from "lucide-react";

interface BottomTabBarProps {
  slug: string;
}

const TABS = (slug: string) => [
  { href: `/workspaces/${slug}`, label: "Overview", icon: LayoutDashboard, exact: true },
  { href: `/workspaces/${slug}/documents`, label: "Billing", icon: FileText, exact: false },
  { href: `/workspaces/${slug}/pos`, label: "POS", icon: ShoppingCart, exact: false },
  { href: `/workspaces/${slug}/products`, label: "Products", icon: Package, exact: false },
  { href: `/workspaces/${slug}/analytics`, label: "Analytics", icon: BarChart2, exact: false },
];

export function BottomTabBar({ slug }: BottomTabBarProps) {
  const pathname = usePathname();

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-inset-bottom"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
      }}
    >
      <div className="flex items-stretch h-[58px]">
        {TABS(slug).map((tab) => {
          const active = isActive(tab.href, tab.exact);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 no-underline relative transition-all"
              style={{ color: active ? "var(--brand-primary, #064e3b)" : "#a1a1aa" }}
            >
              {/* Active indicator dot above icon */}
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                  style={{ backgroundColor: "var(--brand-primary, #064e3b)" }}
                />
              )}

              <Icon
                className={`transition-transform duration-200 ${active ? "scale-110" : "scale-100"}`}
                style={{
                  width: 20,
                  height: 20,
                  strokeWidth: active ? 2.25 : 1.75,
                }}
              />
              <span
                className="text-[9.5px] font-semibold tracking-wide uppercase"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
