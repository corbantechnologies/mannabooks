"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface BottomTabBarProps {
  slug: string;
}

const TABS = (slug: string) => [
  { href: `/workspaces/${slug}`, label: "Overview", icon: "🏠", exact: true },
  { href: `/workspaces/${slug}/documents`, label: "Billing", icon: "📄", exact: false },
  { href: `/workspaces/${slug}/pos`, label: "POS", icon: "🧾", exact: false },
  { href: `/workspaces/${slug}/products`, label: "Products", icon: "📦", exact: false },
  { href: `/workspaces/${slug}/analytics`, label: "Analytics", icon: "📊", exact: false },
];

export function BottomTabBar({ slug }: BottomTabBarProps) {
  const pathname = usePathname();

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-200/80 shadow-[0_-1px_12px_rgba(0,0,0,0.06)] safe-area-inset-bottom">
      <div className="flex items-stretch h-14">
        {TABS(slug).map((tab) => {
          const active = isActive(tab.href, tab.exact);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors no-underline ${
                active
                  ? "text-black"
                  : "text-zinc-400 hover:text-zinc-700"
              }`}
            >
              <span className={`text-lg leading-none transition-transform ${active ? "scale-110" : ""}`}>
                {tab.icon}
              </span>
              <span className={`text-[9px] font-bold uppercase tracking-wider font-mono ${active ? "text-black" : "text-zinc-400"}`}>
                {tab.label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-black rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
