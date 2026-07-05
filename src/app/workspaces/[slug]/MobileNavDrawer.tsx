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
  };
  user: {
    name: string;
  };
}

export function MobileNavDrawer({ slug, shop, user }: MobileNavDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
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
            <span className="text-[9px] uppercase tracking-widest text-zinc-400 block mb-2 font-semibold">LEDGER DIRECTORIES</span>
            <nav className="flex flex-col gap-1.5 font-semibold uppercase text-xs tracking-wider">
              {navLinks.map((link) => {
                const active = isActive(link.href, link.exact);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`px-3 py-2.5 border rounded transition-all block text-left ${
                      active
                        ? "border-black bg-black text-white"
                        : "border-zinc-200 hover:border-black hover:bg-zinc-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* USER FOOTER & LOGOUT */}
          <div className="pt-4 border-t border-black flex justify-between items-center bg-zinc-50 p-4">
            <div>
              <span className="text-zinc-400 block text-[9px] uppercase">OPERATOR</span>
              <span className="font-bold text-black uppercase">{user.name}</span>
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
      )}
    </div>
  );
}
