// src/app/workspaces/[slug]/products/CatalogActionsPopover.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ShareCatalogModal } from "./ShareCatalogModal";

interface CatalogActionsPopoverProps {
  shopSlug: string;
  shopName: string;
  search?: string;
}

export function CatalogActionsPopover({ shopSlug, shopName, search }: CatalogActionsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const pdfUrl = `/api/catalog/${shopSlug}/pdf${search ? `?search=${encodeURIComponent(search)}` : ""}`;

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className={`border px-3.5 py-2 font-mono text-xs font-semibold uppercase rounded-md shadow-2xs transition-all flex items-center gap-2 cursor-pointer ${
          isOpen
            ? "border-black bg-black text-white"
            : "border-zinc-300 bg-white hover:bg-zinc-50 text-black"
        }`}
      >
        <span>Catalog Options</span>
        <span className="text-[10px] text-zinc-400">{isOpen ? "▲" : "▼"}</span>
      </button>

      {/* POPOVER DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 border border-zinc-200/80 bg-white rounded-xl shadow-xl z-50 font-mono text-xs divide-y divide-zinc-100 animate-in fade-in zoom-in-95 duration-100 origin-top-right overflow-hidden">
          
          <div className="py-1">
            <div className="px-3.5 py-1 text-[9px] font-bold uppercase tracking-widest text-zinc-400">
              Sharing &amp; Exports
            </div>

            <ShareCatalogModal
              shopSlug={shopSlug}
              shopName={shopName}
              customTrigger={(openModal) => (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    openModal();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 font-medium text-xs text-zinc-800 hover:text-black transition-colors flex items-center gap-2.5 cursor-pointer"
                >
                  <span>🔗</span>
                  <span>Share Digital Catalog</span>
                </button>
              )}
            />

            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 font-medium text-xs text-zinc-800 hover:text-black transition-colors flex items-center gap-2.5"
            >
              <span>📄</span>
              <span>Download Price Card (PDF)</span>
            </a>
          </div>

          <div className="py-1">
            <div className="px-3.5 py-1 text-[9px] font-bold uppercase tracking-widest text-zinc-400">
              Inventory Tools
            </div>

            <Link
              href={`/workspaces/${shopSlug}/products/bulk`}
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 font-medium text-xs text-zinc-800 hover:text-black transition-colors flex items-center gap-2.5"
            >
              <span>📥</span>
              <span>Bulk CSV Import</span>
            </Link>

            <Link
              href={`/workspaces/${shopSlug}/inventory`}
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 font-medium text-xs text-zinc-800 hover:text-black transition-colors flex items-center gap-2.5"
            >
              <span>📦</span>
              <span>Stock Overview &amp; Reconciler</span>
            </Link>

            <Link
              href={`/workspaces/${shopSlug}/inventory/locations`}
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 font-medium text-xs text-zinc-800 hover:text-black transition-colors flex items-center gap-2.5"
            >
              <span>🏢</span>
              <span>Warehouse Locations</span>
            </Link>
          </div>

        </div>
      )}
    </div>
  );
}
