// src/app/workspaces/[slug]/clients/[id]/ClientActionsPopover.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { EditClientModal } from "@/app/workspaces/[slug]/clients/EditClientModal";
import { SyncClientToSupplierButton } from "./SyncClientToSupplierButton";
import { toast } from "react-hot-toast";

interface ClientActionsPopoverProps {
  client: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    clientType: "WALK_IN" | "INDIVIDUAL" | "CORPORATE";
    taxPin: string | null;
    requiresEtims?: boolean;
  };
  shop: {
    id: string;
    slug: string;
    currency: string;
  };
  shopSlug: string;
  matchedSupplier?: { id: string; name: string } | null;
}

export function ClientActionsPopover({
  client,
  shop,
  shopSlug,
  matchedSupplier,
}: ClientActionsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Click outside to dismiss
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

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
    setIsOpen(false);
  }

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
        <span>Actions</span>
        <span className="text-[10px] text-zinc-400">{isOpen ? "▲" : "▼"}</span>
      </button>

      {/* POPOVER DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 border border-zinc-200/80 bg-white rounded-xl shadow-xl z-50 font-mono text-xs divide-y divide-zinc-100 animate-in fade-in zoom-in-95 duration-100 origin-top-right overflow-hidden">
          
          {/* Section: Financial Documents */}
          <div className="py-1">
            <div className="px-3.5 py-1 text-[9px] font-bold uppercase tracking-widest text-zinc-400">
              Billing &amp; Financials
            </div>
            
            <Link
              href={`/workspaces/${shopSlug}/clients/${client.id}/statement`}
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 font-medium text-xs text-zinc-800 hover:text-black transition-colors flex items-center gap-2.5"
            >
              <span className="text-zinc-500">📜</span>
              <span>Statement of Account</span>
            </Link>

            <Link
              href={`/workspaces/${shopSlug}/documents/new?clientId=${client.id}&type=QUOTATION`}
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 font-medium text-xs text-zinc-800 hover:text-black transition-colors flex items-center gap-2.5"
            >
              <span className="text-zinc-500">📋</span>
              <span>Draft Quotation</span>
            </Link>

            <Link
              href={`/workspaces/${shopSlug}/documents/new?clientId=${client.id}&type=INVOICE`}
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 font-medium text-xs text-zinc-800 hover:text-black transition-colors flex items-center gap-2.5"
            >
              <span className="text-zinc-500">🧾</span>
              <span>Draft Invoice</span>
            </Link>
          </div>

          {/* Section: Profile & Entity Relations */}
          <div className="py-1">
            <div className="px-3.5 py-1 text-[9px] font-bold uppercase tracking-widest text-zinc-400">
              Entity Management
            </div>

            <EditClientModal
              client={client}
              shopId={shop.id}
              shopSlug={shopSlug}
              redirectToDirectoryAfterDelete={true}
              customTrigger={(openModal) => (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    openModal();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 font-medium text-xs text-zinc-800 hover:text-black transition-colors flex items-center gap-2.5 cursor-pointer"
                >
                  <span className="text-zinc-500">✏️</span>
                  <span>Edit Client Profile</span>
                </button>
              )}
            />

            {matchedSupplier ? (
              <Link
                href={`/workspaces/${shopSlug}/suppliers/${matchedSupplier.id}`}
                onClick={() => setIsOpen(false)}
                className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 font-medium text-xs text-zinc-800 hover:text-black transition-colors flex items-center gap-2.5"
              >
                <span className="text-zinc-500">🔗</span>
                <span>View Linked Vendor</span>
              </Link>
            ) : (
              <div onClick={() => setIsOpen(false)}>
                <SyncClientToSupplierButton
                  clientId={client.id}
                  shopId={shop.id}
                  shopSlug={shopSlug}
                  renderAsMenuItem={true}
                />
              </div>
            )}
          </div>

          {/* Section: Quick Clipboard Utility */}
          <div className="py-1 bg-zinc-50/50">
            <div className="px-3.5 py-1 text-[9px] font-bold uppercase tracking-widest text-zinc-400">
              Quick Copy
            </div>

            {client.taxPin && (
              <button
                type="button"
                onClick={() => copyToClipboard(client.taxPin!, "KRA PIN")}
                className="w-full text-left px-3.5 py-1.5 hover:bg-zinc-100 font-medium text-[11px] text-zinc-600 hover:text-black transition-colors flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>📌</span>
                  <span>Tax PIN</span>
                </span>
                <span className="font-bold text-black">{client.taxPin}</span>
              </button>
            )}

            {client.email && client.email !== "—" && (
              <button
                type="button"
                onClick={() => copyToClipboard(client.email, "Email")}
                className="w-full text-left px-3.5 py-1.5 hover:bg-zinc-100 font-medium text-[11px] text-zinc-600 hover:text-black transition-colors flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>✉️</span>
                  <span>Email</span>
                </span>
                <span className="text-zinc-500 truncate max-w-[120px]">{client.email}</span>
              </button>
            )}

            {client.phone && (
              <button
                type="button"
                onClick={() => copyToClipboard(client.phone!, "Phone")}
                className="w-full text-left px-3.5 py-1.5 hover:bg-zinc-100 font-medium text-[11px] text-zinc-600 hover:text-black transition-colors flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>📞</span>
                  <span>Phone</span>
                </span>
                <span className="text-zinc-500">{client.phone}</span>
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
