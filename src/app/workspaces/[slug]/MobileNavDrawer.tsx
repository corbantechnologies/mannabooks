// src/app/workspaces/[slug]/MobileNavDrawer.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/lib/actions/logout";

interface MobileNavDrawerProps {
  slug: string;
  shop: {
    name: string;
    logoUrl?: string | null;
    taxPin?: string | null;
  };
  user: {
    name: string;
  };
}

export function MobileNavDrawer({ slug, shop, user }: MobileNavDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden border-b border-black bg-white sticky top-0 z-40">
      {/* MOBILE TOP NAVIGATION BAR */}
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center gap-3 min-w-0">
          {shop.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shop.logoUrl} alt={shop.name} className="w-7 h-7 object-contain border border-black p-0.5 bg-white shrink-0" />
          )}
          <div className="min-w-0">
            <h2 className="font-mono font-bold uppercase tracking-tighter text-sm truncate leading-none">
              {shop.name}
            </h2>
            <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 block mt-0.5">
              Workspace
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="border border-black px-3 py-1.5 font-mono text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors flex items-center gap-1.5"
          aria-label="Toggle Navigation Menu"
        >
          <span>{isOpen ? "✕" : "☰"}</span>
          <span>{isOpen ? "Close" : "Menu"}</span>
        </button>
      </div>

      {/* MOBILE OVERLAY DRAWER PANEL */}
      {isOpen && (
        <div className="border-t border-black bg-white p-6 space-y-8 font-mono text-xs shadow-lg animate-in slide-in-from-top duration-200">
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
            <span className="text-[9px] uppercase tracking-widest text-zinc-400 block mb-2">LEDGER DIRECTORIES</span>
            <nav className="flex flex-col gap-2 font-bold uppercase text-xs tracking-wider">
              <Link
                href={`/workspaces/${slug}`}
                onClick={() => setIsOpen(false)}
                className="px-3 py-2.5 border border-black hover:bg-black hover:text-white transition-all block text-left"
              >
                [00] Overview Log
              </Link>
              <Link
                href={`/workspaces/${slug}/documents`}
                onClick={() => setIsOpen(false)}
                className="px-3 py-2.5 border border-black hover:bg-black hover:text-white transition-all block text-left"
              >
                [01] Master Ledger
              </Link>
              <Link
                href={`/workspaces/${slug}/clients`}
                onClick={() => setIsOpen(false)}
                className="px-3 py-2.5 border border-black hover:bg-black hover:text-white transition-all block text-left"
              >
                [02] Client Flow
              </Link>
              <Link
                href={`/workspaces/${slug}/products`}
                onClick={() => setIsOpen(false)}
                className="px-3 py-2.5 border border-black hover:bg-black hover:text-white transition-all block text-left"
              >
                [03] Product Catalog
              </Link>
              <Link
                href={`/workspaces/${slug}/settings`}
                onClick={() => setIsOpen(false)}
                className="px-3 py-2.5 border border-black hover:bg-black hover:text-white transition-all block text-left"
              >
                [04] System Settings
              </Link>
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
