// src/app/workspaces/[slug]/products/ProductFormClientSide.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateProduct } from "@/hooks/useProducts";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface StockLocation {
  id: string;
  name: string;
  code: string | null;
  isDefault: boolean;
}

export function ProductFormClientSide({
  shopId,
  shopSlug,
  locations = [],
}: {
  shopId: string;
  shopSlug: string;
  locations?: StockLocation[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemType, setItemType] = useState<"PRODUCT" | "SERVICE">("PRODUCT");
  const [trackStock, setTrackStock] = useState(false);

  const createProductMutation = useCreateProduct(shopId, shopSlug);

  async function handleCatalogSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const sku = formData.get("sku") as string;
    const unitPrice = parseFloat(formData.get("unitPrice") as string);
    const costPrice = parseFloat(formData.get("costPrice") as string || "0");
    const defaultTaxType = formData.get("defaultTaxType") as "V_16" | "V_0" | "EXEMPT";
    const stockQuantity = parseFloat(formData.get("stockQuantity") as string || "0");
    const reorderThreshold = parseFloat(formData.get("reorderThreshold") as string || "5");
    const locationId = formData.get("locationId") as string | null;

    if (!name || isNaN(unitPrice) || unitPrice < 0) {
      const msg = "Item parameters or tracking values are invalid.";
      setError(msg);
      toast.error(msg);
      return;
    }

    createProductMutation.mutate(
      {
        name,
        sku: sku || undefined,
        itemType,
        unitPrice,
        costPrice,
        defaultTaxType,
        trackStock,
        stockQuantity,
        reorderThreshold,
        locationId: locationId || undefined,
      },
      {
        onSuccess: () => {
          setIsOpen(false);
          setItemType("PRODUCT");
          setTrackStock(false);
          router.refresh();
        },
      }
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary-modern px-4 py-2 text-xs font-semibold uppercase tracking-wider"
      >
        + Register Catalog Item
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-zinc-200/80 rounded-xl shadow-2xl w-full max-w-2xl my-4 sm:my-0 font-mono text-xs animate-in zoom-in-95 duration-150 relative overflow-hidden">
            
            {/* MODAL HEADER */}
            <div className="border-b border-zinc-100 p-6 flex justify-between items-start bg-zinc-50/50">
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold uppercase tracking-tight font-sans text-black">Add Catalog Node</h2>
                <p className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">Define product rate profile metrics</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-black text-sm font-bold px-2 py-1 rounded transition-colors"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 border border-rose-200 bg-rose-50 p-3 font-mono text-[11px] text-rose-800 font-semibold uppercase rounded">
                ⚠ VALIDATION_ERROR: {error}
              </div>
            )}

            <form onSubmit={handleCatalogSubmit} className="p-6 space-y-5">
              
              {/* ITEM TYPE TOGGLE */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 uppercase block font-semibold text-[10px]">Item Classification</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setItemType("PRODUCT")}
                    className={`py-3 px-4 rounded-lg border-2 text-left transition-all ${
                      itemType === "PRODUCT"
                        ? "border-black bg-black text-white"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
                    }`}
                  >
                    <div className="text-lg mb-0.5">📦</div>
                    <div className="font-bold uppercase text-xs">Product</div>
                    <div className="text-[10px] opacity-70">Tangible / Physical Good</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setItemType("SERVICE")}
                    className={`py-3 px-4 rounded-lg border-2 text-left transition-all ${
                      itemType === "SERVICE"
                        ? "border-black bg-black text-white"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
                    }`}
                  >
                    <div className="text-lg mb-0.5">🛠️</div>
                    <div className="font-bold uppercase text-xs">Service</div>
                    <div className="text-[10px] opacity-70">Labor / Consulting</div>
                  </button>
                </div>
              </div>

              {/* NAME & SKU ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold text-[10px]">
                    {itemType === "SERVICE" ? "Service Name / Description" : "Product Name / Description"}
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder={itemType === "SERVICE" ? "e.g., Consulting Hour, Legal Review" : "e.g., Laptop Stand, Coffee Bag"}
                    className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded-md text-xs font-sans h-10"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-zinc-400 uppercase block font-semibold text-[10px]">SKU / Code Reference</label>
                    <span className="text-[9px] text-zinc-400 italic">Optional</span>
                  </div>
                  <input
                    type="text"
                    name="sku"
                    placeholder="e.g., CON-SER-4821 (auto-generated if blank)"
                    className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded-md text-xs uppercase h-10"
                  />
                </div>
              </div>

              {/* PRICING ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold text-[10px]">Selling Price (KES)</label>
                  <input
                    type="number"
                    name="unitPrice"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded-md text-xs font-semibold h-10"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <label className="text-zinc-400 uppercase block font-semibold text-[10px]">Cost Price / COGS (KES)</label>
                  </div>
                  <input
                    type="number"
                    name="costPrice"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded-md text-xs font-semibold h-10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold text-[10px]">Default Tax Type</label>
                  <select
                    name="defaultTaxType"
                    className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded-md text-xs font-semibold h-10"
                  >
                    <option value="V_16">16% VAT (Standard)</option>
                    <option value="V_0">0% VAT (Zero-Rated)</option>
                    <option value="EXEMPT">Tax Exempt</option>
                  </select>
                </div>
              </div>

              {/* INVENTORY TRACKING BLOCK — only for products */}
              {itemType === "PRODUCT" && (
                <div className="border border-zinc-200 bg-zinc-50/60 p-4 space-y-3 rounded-lg">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div
                      className={`w-10 h-6 rounded-full transition-colors relative ${trackStock ? "bg-black" : "bg-zinc-300"}`}
                      onClick={() => setTrackStock(!trackStock)}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${trackStock ? "left-5" : "left-1"}`} />
                    </div>
                    <div>
                      <span className="font-bold uppercase text-xs text-black block">Track Inventory Stock</span>
                      <span className="text-[10px] text-zinc-500">Auto-deduct stock when sold via receipts / POS</span>
                    </div>
                  </label>

                  {trackStock && (
                    <div className="space-y-3 pt-3 border-t border-zinc-200">
                      {/* LOCATION SELECTOR */}
                      <div className="space-y-1">
                        <label className="text-zinc-500 uppercase block text-[10px] font-semibold">
                          Stock Location
                          <span className="ml-1 normal-case text-zinc-400 font-normal">(where this stock is held)</span>
                        </label>
                        {locations.length > 0 ? (
                          <select
                            name="locationId"
                            className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded-md text-xs font-semibold h-9"
                          >
                            {locations.map((loc) => (
                              <option key={loc.id} value={loc.id}>
                                {loc.name}{loc.code ? ` (${loc.code})` : ""}{loc.isDefault ? " — Default" : ""}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                            <span className="text-amber-800 text-[10px] font-semibold uppercase">
                              No locations configured — "General Store" will be auto-created
                            </span>
                            <Link
                              href={`/workspaces/${shopSlug}/inventory/locations`}
                              className="text-[10px] underline text-amber-700 hover:text-amber-900 whitespace-nowrap ml-2"
                              target="_blank"
                            >
                              Setup →
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* STOCK QTY + REORDER */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-zinc-500 uppercase block text-[10px] font-semibold">Opening Stock Qty</label>
                          <input
                            type="number"
                            name="stockQuantity"
                            step="1"
                            min="0"
                            defaultValue="0"
                            className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded-md text-xs font-semibold h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-zinc-500 uppercase block text-[10px] font-semibold">Low Stock Alert Limit</label>
                          <input
                            type="number"
                            name="reorderThreshold"
                            step="1"
                            min="1"
                            defaultValue="5"
                            className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded-md text-xs font-semibold h-9"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ACTIONS */}
              <div className="border-t border-zinc-200/80 pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn-secondary-modern px-5 py-2.5 text-xs font-semibold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProductMutation.isPending}
                  className="btn-primary-modern px-6 py-2.5 font-semibold uppercase text-xs disabled:bg-zinc-300 disabled:cursor-not-allowed"
                >
                  {createProductMutation.isPending ? "Saving..." : "Save Item"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}