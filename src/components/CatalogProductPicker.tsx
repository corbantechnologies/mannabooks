// src/components/CatalogProductPicker.tsx
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";

export interface CatalogProductItem {
  id: string;
  name: string;
  sku?: string | null;
  unitPrice: string;
  costPrice?: string | null;
  defaultTaxType: "V_16" | "V_0" | "EXEMPT";
  trackStock?: boolean;
  stockQuantity?: string | null;
  itemType?: string | null;
}

interface CatalogProductPickerProps {
  products: CatalogProductItem[];
  selectedProductId?: string;
  currency: string;
  onSelect: (product: CatalogProductItem | null) => void;
  placeholder?: string;
  isProcurement?: boolean;
}

export function CatalogProductPicker({
  products,
  selectedProductId,
  currency,
  onSelect,
  placeholder = "Select / Search from Catalog Register...",
  isProcurement = false,
}: CatalogProductPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  // Auto-focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Click outside and Escape key handling
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

  // Filter products by query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  return (
    <div className="relative w-full text-left font-sans" ref={popoverRef}>
      
      {/* TRIGGER DISPLAY */}
      {selectedProduct ? (
        <div className="flex items-center justify-between gap-2 px-3 py-2 border border-zinc-300 bg-zinc-50 hover:bg-zinc-100 rounded-md transition-colors text-xs font-semibold">
          <div
            className="flex-1 min-w-0 cursor-pointer flex items-center gap-2"
            onClick={() => setIsOpen(!isOpen)}
            title={selectedProduct.name}
          >
            <span className="text-zinc-500 font-mono text-[10px] shrink-0">📦 LINKED:</span>
            <span className="truncate text-black font-bold">{selectedProduct.name}</span>
            <span className="text-zinc-500 font-mono text-[10px] shrink-0">
              {isProcurement
                ? `(Cost: ${formatCurrency(parseFloat(selectedProduct.costPrice || "0"), currency)})`
                : `(${formatCurrency(parseFloat(selectedProduct.unitPrice), currency)})`}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(null);
            }}
            className="text-zinc-400 hover:text-rose-600 font-mono text-xs px-1.5 py-0.5 rounded hover:bg-zinc-200 shrink-0 cursor-pointer transition-colors"
            title="Unlink catalog item"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-3 py-2 border rounded-md text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer ${
            isOpen
              ? "border-black ring-1 ring-black bg-white"
              : "border-zinc-300 bg-white hover:border-zinc-400 text-zinc-500"
          }`}
        >
          <span className="truncate flex items-center gap-1.5">
            <span className="text-zinc-400 text-[10px]">🔍</span>
            <span className="text-zinc-600 truncate">{placeholder}</span>
          </span>
          <span className="text-[9px] text-zinc-400 font-mono shrink-0">{isOpen ? "▲" : "▼"}</span>
        </button>
      )}

      {/* SEARCHABLE POPOVER DROPDOWN */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[300px] max-w-lg border border-zinc-200/80 bg-white rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          
          {/* SEARCH INPUT BAR */}
          <div className="p-2.5 border-b border-zinc-100 bg-zinc-50/70">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-zinc-400 text-xs">
                🔍
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type product name or SKU to search..."
                className="w-full pl-8 pr-7 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-black placeholder:text-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-400 hover:text-black text-xs font-mono"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex justify-between items-center px-1 mt-1.5 text-[10px] font-mono text-zinc-400 uppercase font-semibold">
              <span>{filteredProducts.length} items found</span>
              <span>Select item to populate row</span>
            </div>
          </div>

          {/* PRODUCT LIST (SCROLLABLE & CONSTRAINED) */}
          <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100 font-sans text-xs">
            {filteredProducts.map((p) => {
              const stockVal = parseFloat(p.stockQuantity || "0");
              const isTracked = p.trackStock;
              const isSelected = p.id === selectedProductId;

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelect(p);
                    setIsOpen(false);
                  }}
                  className={`p-3 hover:bg-emerald-50/50 cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                    isSelected ? "bg-emerald-50/80 border-l-2 border-emerald-600" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-black text-xs leading-snug line-clamp-2" title={p.name}>
                        {p.name}
                      </span>
                      {p.sku && (
                        <span className="bg-zinc-100 text-zinc-600 font-mono text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase shrink-0">
                          {p.sku}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[10px]">
                      {isTracked ? (
                        stockVal > 0 ? (
                          <span className="text-emerald-700 font-semibold">
                            ✓ {stockVal} in stock
                          </span>
                        ) : (
                          <span className="text-rose-600 font-bold uppercase">
                            ⚠️ Out of stock
                          </span>
                        )
                      ) : (
                        <span className="text-zinc-400 italic">Service / Non-tracked</span>
                      )}
                      <span className="text-zinc-300">•</span>
                      <span className="text-zinc-500 uppercase">
                        Tax: {p.defaultTaxType === "V_16" ? "16% VAT" : p.defaultTaxType === "V_0" ? "0% Zero" : "Exempt"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-bold text-black block">
                      {isProcurement
                        ? formatCurrency(parseFloat(p.costPrice || "0"), currency)
                        : formatCurrency(parseFloat(p.unitPrice), currency)}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono uppercase">
                      {isProcurement ? "Cost (COGS)" : "Selling Price"}
                    </span>
                    {isProcurement && (
                      <span className="text-[9px] text-zinc-400 font-mono block">
                        Sell: {formatCurrency(parseFloat(p.unitPrice), currency)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="p-6 text-center text-zinc-400 space-y-1">
                <p className="font-semibold text-xs">No matching catalog items.</p>
                <p className="text-[10px] font-sans text-zinc-500">
                  You can type custom deliverables directly into the Billing Description field.
                </p>
              </div>
            )}
          </div>

          {/* POPOVER FOOTER */}
          <div className="p-2 bg-zinc-50 border-t border-zinc-100 flex justify-between items-center text-[10px] font-mono text-zinc-500">
            <span>Press <kbd className="px-1 py-0.5 bg-white border border-zinc-200 rounded text-[9px]">ESC</kbd> to close</span>
            {selectedProduct && (
              <button
                type="button"
                onClick={() => {
                  onSelect(null);
                  setIsOpen(false);
                }}
                className="text-rose-600 hover:text-rose-800 font-semibold uppercase hover:underline cursor-pointer"
              >
                Clear Selection
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
