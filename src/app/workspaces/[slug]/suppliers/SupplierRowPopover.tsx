// src/app/workspaces/[slug]/suppliers/SupplierRowPopover.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { EditSupplierModal } from "./EditSupplierModal";
import { toast } from "react-hot-toast";

interface SupplierRowPopoverProps {
  supplier: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    supplierType: "WALK_IN" | "INDIVIDUAL" | "CORPORATE";
    taxPin: string | null;
    requiresEtims?: boolean;
    paymentTerms?: string | null;
  };
  shopId: string;
  shopSlug: string;
}

export function SupplierRowPopover({ supplier, shopId, shopSlug }: SupplierRowPopoverProps) {
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

  function copyPin() {
    if (supplier.taxPin) {
      navigator.clipboard.writeText(supplier.taxPin);
      toast.success("KRA PIN copied!");
    }
    setIsOpen(false);
  }

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className={`w-8 h-8 flex items-center justify-center rounded-md font-mono text-xs font-bold transition-all cursor-pointer ${
          isOpen
            ? "bg-black text-white"
            : "border border-zinc-200 hover:border-zinc-400 bg-white text-zinc-700 hover:text-black"
        }`}
        title="Supplier Actions"
      >
        •••
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-52 border border-zinc-200/80 bg-white rounded-xl shadow-xl z-50 font-mono text-xs divide-y divide-zinc-100 animate-in fade-in zoom-in-95 duration-100 origin-top-right overflow-hidden text-left">
          <div className="py-1">
            <Link
              href={`/workspaces/${shopSlug}/suppliers/${supplier.id}`}
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 font-medium text-xs text-zinc-800 hover:text-black transition-colors flex items-center gap-2"
            >
              <span>👁️</span>
              <span>Procurement View</span>
            </Link>

            <Link
              href={`/workspaces/${shopSlug}/documents/new?supplierId=${supplier.id}&type=LPO`}
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 font-medium text-xs text-zinc-800 hover:text-black transition-colors flex items-center gap-2"
            >
              <span>📑</span>
              <span>Issue LPO</span>
            </Link>

            <Link
              href={`/workspaces/${shopSlug}/documents/new?supplierId=${supplier.id}&type=PO`}
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 font-medium text-xs text-zinc-800 hover:text-black transition-colors flex items-center gap-2"
            >
              <span>📦</span>
              <span>Issue Purchase Order</span>
            </Link>
          </div>

          <div className="py-1">
            <EditSupplierModal
              supplier={supplier}
              shopId={shopId}
              shopSlug={shopSlug}
              customTrigger={(openModal) => (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    openModal();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 font-medium text-xs text-zinc-800 hover:text-black transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span>✏️</span>
                  <span>Edit Profile</span>
                </button>
              )}
            />

            {supplier.taxPin && (
              <button
                type="button"
                onClick={copyPin}
                className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 font-medium text-xs text-zinc-600 hover:text-black transition-colors flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>📌</span>
                  <span>Copy PIN</span>
                </span>
                <span className="font-bold text-[10px] text-zinc-400">{supplier.taxPin}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
