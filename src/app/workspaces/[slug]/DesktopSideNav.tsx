// src/app/workspaces/[slug]/DesktopSideNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface DesktopSideNavProps {
  slug: string;
}

export function DesktopSideNav({ slug }: DesktopSideNavProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: `/workspaces/${slug}`, label: "[00] Overview Log", exact: true },
    { href: `/workspaces/${slug}/documents`, label: "[01] Fiscal Ledgers" },
    { href: `/workspaces/${slug}/pos`, label: "[02] Walk-in Sales" },
    { href: `/workspaces/${slug}/clients`, label: "[03] Client Flow" },
    { href: `/workspaces/${slug}/products`, label: "[04] Product Catalog" },
    { href: `/workspaces/${slug}/suppliers`, label: "[05] Supplier Network" },
    { href: `/workspaces/${slug}/employees`, label: "[06] Employee Directory" },
    { href: `/workspaces/${slug}/payroll`, label: "[07] Payroll Vouchers" },
    { href: `/workspaces/${slug}/analytics`, label: "[08] Analytics" },
    { href: `/workspaces/${slug}/settings`, label: "[09] System Settings" },
    { href: `/workspaces/${slug}/guide`, label: "[10] Operator Guide" },
  ];

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="flex flex-col gap-1 font-mono text-xs uppercase font-semibold tracking-wider">
      {navLinks.map((link) => {
        const active = isActive(link.href, link.exact);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-2 border rounded transition-all block ${
              active
                ? "border-black bg-black text-white"
                : "border-transparent hover:border-zinc-300 hover:bg-zinc-50"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
