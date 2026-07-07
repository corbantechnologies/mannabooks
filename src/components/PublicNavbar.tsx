// src/components/PublicNavbar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface PublicNavbarProps {
  activePage?: "features" | "guide" | "login" | "home";
}

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/guide", label: "Guide" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Login" },
];

export function PublicNavbar({ activePage }: PublicNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header className="border-b border-zinc-200/80 glass-panel sticky top-0 z-50">
      {/* PRIMARY NAVIGATION ROW */}
      <div className="px-5 sm:px-6 py-4 flex justify-between items-center max-w-7xl mx-auto w-full">
        {/* BRAND LOGO */}
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Manna Books"
            className="w-7 h-7 object-contain border border-zinc-200 p-0.5 bg-white rounded"
          />
          <Link
            href="/"
            className="font-mono text-lg sm:text-xl font-semibold tracking-tight uppercase text-black"
          >
            Manna Books.
          </Link>
        </div>

        {/* DESKTOP NAV (≥ 768px) */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-7 font-mono text-xs font-semibold uppercase">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`hover:underline underline-offset-4 transition-colors ${
                isActive(link.href)
                  ? "text-black font-bold underline underline-offset-4"
                  : "text-zinc-500 hover:text-black"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/signup"
            className="btn-primary-modern px-4 py-2 text-xs ml-2"
          >
            Get Started
          </Link>
        </nav>

        {/* MOBILE HAMBURGER BUTTON (< 768px) */}
        <div className="flex items-center gap-3 md:hidden">
          <Link
            href="/signup"
            className="btn-primary-modern px-3 py-1.5 text-[11px] font-bold uppercase"
          >
            Sign Up
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="border border-zinc-300 bg-white hover:bg-zinc-50 rounded-md px-2.5 py-2 font-mono text-xs font-bold uppercase transition-colors flex items-center gap-1.5 text-black"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M2 4H14M2 8H14M2 12H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* MOBILE SLIDE-DOWN DRAWER */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-200/80 bg-white/95 backdrop-blur-md animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col p-5 gap-1 font-mono text-xs font-semibold uppercase max-w-7xl mx-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-3 border rounded-lg transition-all block text-left ${
                  isActive(link.href)
                    ? "border-black bg-black text-white"
                    : "border-zinc-200 text-zinc-700 hover:border-black hover:bg-zinc-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-zinc-200 mt-2">
              <Link
                href="/signup"
                onClick={() => setMobileOpen(false)}
                className="btn-primary-modern w-full py-3 text-xs font-bold uppercase tracking-wider text-center block"
              >
                Get Started — Initialize Workspace
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
