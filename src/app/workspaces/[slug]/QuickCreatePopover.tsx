// src/app/workspaces/[slug]/QuickCreatePopover.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface QuickCreatePopoverProps {
  slug: string;
}

export function QuickCreatePopover({ slug }: QuickCreatePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn-primary-modern px-3 py-1.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
      >
        <span>+ Create New</span>
        <span className="text-[9px] opacity-80">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 bg-white border border-zinc-200/80 rounded-xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Sales &amp; Commercial
          </div>
          <Link
            href={`/workspaces/${slug}/documents/new?type=INVOICE`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-emerald-50 hover:text-emerald-950 rounded-lg transition-colors no-underline"
          >
            <span className="text-sm">📄</span>
            <div>
              <span className="font-semibold block leading-tight">Tax Invoice</span>
              <span className="text-[10px] text-zinc-500 block leading-tight font-sans">Bill client for sales or services</span>
            </div>
          </Link>
          <Link
            href={`/workspaces/${slug}/documents/new?type=QUOTATION`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-emerald-50 hover:text-emerald-950 rounded-lg transition-colors no-underline"
          >
            <span className="text-sm">💬</span>
            <div>
              <span className="font-semibold block leading-tight">Price Quotation</span>
              <span className="text-[10px] text-zinc-500 block leading-tight font-sans">Issue pro-forma or estimate</span>
            </div>
          </Link>
          <Link
            href={`/workspaces/${slug}/documents/new?type=DELIVERY_NOTE`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-emerald-50 hover:text-emerald-950 rounded-lg transition-colors no-underline"
          >
            <span className="text-sm">🚚</span>
            <div>
              <span className="font-semibold block leading-tight">Delivery Note</span>
              <span className="text-[10px] text-zinc-500 block leading-tight font-sans">Dispatch goods to client</span>
            </div>
          </Link>

          <div className="border-t border-zinc-100 my-1 pt-1">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Purchases &amp; Expenses
            </div>
            <Link
              href={`/workspaces/${slug}/documents/new?type=LPO`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-emerald-50 hover:text-emerald-950 rounded-lg transition-colors no-underline"
            >
              <span className="text-sm">🛍️</span>
              <div>
                <span className="font-semibold block leading-tight">Purchase Order (LPO)</span>
                <span className="text-[10px] text-zinc-500 block leading-tight font-sans">Order goods from supplier</span>
              </div>
            </Link>
            <Link
              href={`/workspaces/${slug}/expenses`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-emerald-50 hover:text-emerald-950 rounded-lg transition-colors no-underline"
            >
              <span className="text-sm">💸</span>
              <div>
                <span className="font-semibold block leading-tight">Log Expense</span>
                <span className="text-[10px] text-zinc-500 block leading-tight font-sans">Record operating spending</span>
              </div>
            </Link>
          </div>

          <div className="border-t border-zinc-100 my-1 pt-1">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Directory Contacts
            </div>
            <div className="grid grid-cols-2 gap-1 px-1">
              <Link
                href={`/workspaces/${slug}/clients`}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
              >
                <span>👤</span> Client
              </Link>
              <Link
                href={`/workspaces/${slug}/suppliers`}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
              >
                <span>🏢</span> Supplier
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
