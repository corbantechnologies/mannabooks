"use client";

import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { EditProductModal } from "./EditProductModal";
import { ShareCatalogModal } from "./ShareCatalogModal";
import { QuickRestockModal } from "./QuickRestockModal";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useProducts, useStockLocations } from "@/hooks/useProducts";
import { Spinner } from "@/components/Spinner";

interface ProductsTableClientProps {
  catalogList?: any[];
  shop: any;
  shopSlug: string;
  locations?: any[];
}

export function ProductsTableClient({
  catalogList = [],
  shop,
  shopSlug,
  locations = [],
}: ProductsTableClientProps) {
  const searchParams = useSearchParams();
  const search = searchParams.get("search")?.trim().toLowerCase() || "";
  const taxType = searchParams.get("taxType") || "ALL";

  const { data: rawProducts, isLoading } = useProducts(shop.id);
  const { data: rawLocations } = useStockLocations(shop.id);

  const activeLocations = Array.isArray(rawLocations) && rawLocations.length > 0 ? rawLocations : locations;

  const effectiveProducts = useMemo(() => {
    let list = Array.isArray(rawProducts) && rawProducts.length > 0 ? rawProducts : catalogList;
    if (search) {
      list = list.filter((p: any) =>
        (p.name || "").toLowerCase().includes(search) ||
        (p.sku || "").toLowerCase().includes(search)
      );
    }
    if (taxType && taxType !== "ALL") {
      list = list.filter((p: any) =>
        (p.default_tax_type || p.defaultTaxType) === taxType
      );
    }
    return list;
  }, [rawProducts, catalogList, search, taxType]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const isAllSelected =
    effectiveProducts.length > 0 && selectedIds.length === effectiveProducts.length;

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(effectiveProducts.map((p: any) => p.id));
    }
  }

  function toggleSelectItem(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  const selectedCount = selectedIds.length;

  if (isLoading && (!catalogList || catalogList.length === 0)) {
    return (
      <div className="surface p-12 bg-white flex flex-col items-center justify-center space-y-3">
        <Spinner className="w-5 h-5 text-zinc-600 animate-spin" />
        <p className="text-xs text-zinc-500 font-mono">Loading product catalog...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* FLOATING ACTION TOOLBAR FOR CURATED SELECTION */}
      {selectedCount > 0 && (
        <div className="sticky top-4 z-30 bg-black text-white border border-zinc-800 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-150">
          <div className="flex items-center gap-3">
            <span className="bg-emerald-500 text-black text-xs font-mono font-bold px-2.5 py-1 rounded-full">
              {selectedCount} Selected
            </span>
            <p className="text-xs font-sans text-zinc-300">
              You can share or export a curated catalog containing only these {selectedCount} items.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Curated Share Modal */}
            <ShareCatalogModal
              shopSlug={shopSlug}
              shopName={shop.name}
              selectedProductIds={selectedIds}
              buttonLabel={`Share Selected (${selectedCount})`}
              className="bg-white hover:bg-zinc-100 text-black px-4 py-2 font-mono text-xs font-bold uppercase rounded-lg transition-all shadow-sm flex items-center gap-1.5"
            />

            {/* Clear Selection */}
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-zinc-400 hover:text-white font-mono text-xs uppercase font-bold px-3 py-2"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* DATA LEDGER GRID */}
      <div className="surface overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-wide font-semibold text-zinc-400 bg-zinc-50/60">
              <th className="p-4 border-r border-zinc-200 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="rounded border-zinc-300 text-black focus:ring-black cursor-pointer"
                  title="Select all products"
                />
              </th>
              <th className="px-4 py-3 border-r border-zinc-100">Item Description</th>
              <th className="px-4 py-3 border-r border-zinc-100">Type</th>
              <th className="px-4 py-3 border-r border-zinc-100">SKU / Code Reference</th>
              <th className="px-4 py-3 border-r border-zinc-100">Selling Price</th>
              <th className="px-4 py-3 border-r border-zinc-100">Cost &amp; Profit Margin</th>
              <th className="px-4 py-3 border-r border-zinc-100">Stock Inventory Level</th>
              <th className="px-4 py-3 border-r border-zinc-100">Default Tax Flag</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {effectiveProducts.map((p: any) => {
              const isChecked = selectedIds.includes(p.id);
              const qty = parseFloat(p.stockQuantity || "0");
              const threshold = parseFloat(p.reorderThreshold || "5");
              const sellPrice = parseFloat(p.unitPrice || "0");
              const costPrice = parseFloat(p.costPrice || "0");
              const profitMargin = sellPrice > 0 ? ((sellPrice - costPrice) / sellPrice) * 100 : 0;

              return (
                <tr
                  key={p.id}
                  className={`transition-colors ${
                    isChecked ? "bg-zinc-50/90 font-medium" : "hover:bg-zinc-50/80"
                  }`}
                >
                  <td className="px-4 py-3 border-r border-zinc-100 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelectItem(p.id)}
                      className="rounded border-zinc-300 text-black focus:ring-black cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 border-r border-zinc-100 font-sans text-sm font-semibold text-zinc-900">
                    {p.name}
                  </td>
                  <td className="p-4 border-r border-zinc-100">
                    {p.itemType === "SERVICE" ? (
                      <span className="badge-zinc">
                        Service
                      </span>
                    ) : (
                      <span className="bg-blue-50 text-blue-900 border border-blue-200 px-2 py-0.5 rounded-md uppercase text-[10px] font-semibold">
                        Product
                      </span>
                    )}
                  </td>
                  <td className="p-4 border-r border-zinc-100 text-zinc-500 tracking-wider">
                    {p.sku || <span className="text-zinc-300 italic font-normal">None</span>}
                  </td>
                  <td className="p-4 border-r border-zinc-100 font-semibold text-sm text-black">
                    {formatCurrency(p.unitPrice, shop.currency)}
                  </td>
                  <td className="p-4 border-r border-zinc-100 text-xs">
                    {costPrice > 0 ? (
                      <div>
                        <span className="block text-zinc-500 font-mono text-[10px]">
                          Cost: {formatCurrency(costPrice, shop.currency)}
                        </span>
                        <span className={`font-bold text-[10px] ${profitMargin >= 20 ? "text-emerald-700" : "text-amber-800"}`}>
                          Margin: {profitMargin.toFixed(1)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-400 italic text-[10px]">N/A (Cost 0)</span>
                    )}
                  </td>
                  <td className="p-4 border-r border-zinc-100 text-xs">
                    {p.itemType === "SERVICE" || !p.trackStock ? (
                      <span className="text-zinc-400 italic font-normal">Service (Untracked)</span>
                    ) : qty <= 0 ? (
                      <div className="flex flex-col gap-1 items-start">
                        <span className="badge-rose">
                          ❌ Out of Stock ({qty})
                        </span>
                        <QuickRestockModal
                          product={p}
                          shopId={shop.id}
                          shopSlug={shopSlug}
                          currency={shop.currency}
                          locations={activeLocations}
                        />
                      </div>
                    ) : qty <= threshold ? (
                      <div className="flex flex-col gap-1 items-start">
                        <span className="badge-amber">
                          ⚠️ Low Stock ({qty} left)
                        </span>
                        <QuickRestockModal
                          product={p}
                          shopId={shop.id}
                          shopSlug={shopSlug}
                          currency={shop.currency}
                          locations={activeLocations}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span className="badge-emerald">
                          ✓ {qty} in Stock
                        </span>
                        <QuickRestockModal
                          product={p}
                          shopId={shop.id}
                          shopSlug={shopSlug}
                          currency={shop.currency}
                          locations={activeLocations}
                          triggerButton={
                            <button
                              type="button"
                              className="text-[10px] font-bold text-zinc-400 hover:text-emerald-800 uppercase cursor-pointer"
                              title="Restock units"
                            >
                              + Stock
                            </button>
                          }
                        />
                      </div>
                    )}
                  </td>
                  <td className="p-4 border-r border-zinc-100">
                    <span className={
                      p.defaultTaxType === "V_16" ? "badge-black" :
                      p.defaultTaxType === "V_0" ? "badge-zinc" :
                      "badge-zinc text-zinc-400"
                    }>
                      {p.defaultTaxType === "V_16" ? "VAT 16%" :
                       p.defaultTaxType === "V_0" ? "Zero Rated" : "Tax Exempt"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <EditProductModal product={p} shopId={shop.id} shopSlug={shopSlug} locations={activeLocations} />
                    </div>
                  </td>
                </tr>
              );
            })}

            {effectiveProducts.length === 0 && (
              <tr>
                <td colSpan={9} className="p-12 text-center text-zinc-400 italic font-sans text-xs">
                  No products or services found in this catalog.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
