// src/app/workspaces/[slug]/products/EditProductModal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts";
import { toast } from "react-hot-toast";
import { Spinner } from "@/components/Spinner";
import Link from "next/link";

interface StockLocation {
  id: string;
  name: string;
  code: string | null;
  isDefault: boolean;
}

interface EditProductModalProps {
  product: {
    id: string;
    name: string;
    sku: string | null;
    itemType?: string;
    unitPrice: string;
    costPrice?: string;
    defaultTaxType: "V_16" | "V_0" | "EXEMPT";
    trackStock?: boolean;
    stockQuantity?: string;
    reorderThreshold?: string;
    defaultLocationId?: string | null;
  };
  shopId: string;
  shopSlug: string;
  locations?: StockLocation[];
}

export function EditProductModal({ product, shopId, shopSlug, locations = [] }: EditProductModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [name, setName] = useState(product.name);
  const [sku, setSku] = useState(product.sku || "");
  const [itemType, setItemType] = useState<"PRODUCT" | "SERVICE">((product.itemType as any) || "PRODUCT");
  const [unitPrice, setUnitPrice] = useState(product.unitPrice);
  const [costPrice, setCostPrice] = useState(product.costPrice || "0.00");
  const [taxType, setTaxType] = useState(product.defaultTaxType);
  const [trackStock, setTrackStock] = useState(product.trackStock || false);
  const [stockQuantity, setStockQuantity] = useState(product.stockQuantity || "0");
  const [reorderThreshold, setReorderThreshold] = useState(product.reorderThreshold || "5");
  const [locationId, setLocationId] = useState<string>(
    product.defaultLocationId || locations.find(l => l.isDefault)?.id || locations[0]?.id || ""
  );
  const wasAlreadyTracking = product.trackStock || false;

  const updateProductMutation = useUpdateProduct(shopId, shopSlug);
  const deleteProductMutation = useDeleteProduct(shopId, shopSlug);
  const loading = updateProductMutation.isPending || deleteProductMutation.isPending;

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    updateProductMutation.mutate(
      {
        id: product.id,
        name,
        sku: sku || undefined,
        itemType,
        unitPrice: parseFloat(unitPrice),
        costPrice: parseFloat(costPrice),
        defaultTaxType: taxType,
        trackStock,
        stockQuantity: parseFloat(stockQuantity),
        reorderThreshold: parseFloat(reorderThreshold),
        locationId: locationId || undefined,
      },
      {
        onSuccess: () => {
          setIsOpen(false);
          router.refresh();
        },
      }
    );
  }



  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-secondary-modern px-2 py-1 text-[10px] font-semibold uppercase"
      >
        Edit
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200/80 rounded-xl shadow-2xl w-[95%] sm:w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-6 animate-in zoom-in-95 duration-150 text-left">
            
            <div className="flex justify-between items-start border-b border-zinc-200/80 pb-4">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tight font-sans text-black">Edit Product / Service</h2>
                <p className="font-sans text-xs text-zinc-400 mt-0.5">Update item details, pricing, and inventory tracking</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-black font-bold text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5 font-sans text-xs">
              
              {/* CLASSIFICATION & SKU ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold text-[10px]">Item Classification</label>
                  <select
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value as any)}
                    className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black rounded-md text-xs font-semibold h-10"
                  >
                    <option value="PRODUCT">📦 Product (Tangible Good)</option>
                    <option value="SERVICE">🛠️ Service (Labor / Consulting)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold text-[10px]">SKU / Code Reference</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. LAP-8935"
                    className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black uppercase text-xs rounded-md font-semibold h-10 font-mono"
                  />
                </div>
              </div>

              {/* PRODUCT NAME */}
              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block font-semibold text-[10px]">Product Name / Description *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ergonomic Laptop Stand"
                  className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black rounded-md text-xs font-sans font-semibold h-10"
                  required
                />
              </div>

              {/* PRICING & TAX ROW (3 COLS) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold text-[10px]">Selling Price (KES) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black font-semibold text-xs rounded-md h-10"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold text-[10px]">Cost Price / COGS (KES)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black font-semibold text-xs rounded-md h-10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold text-[10px]">Tax Type</label>
                  <select
                    value={taxType}
                    onChange={(e) => setTaxType(e.target.value as any)}
                    className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black text-xs font-semibold rounded-md h-10"
                  >
                    <option value="V_16">16% VAT</option>
                    <option value="V_0">0% VAT (Zero-Rated)</option>
                    <option value="EXEMPT">Tax Exempt</option>
                  </select>
                </div>
              </div>

              {/* INVENTORY TRACKING BLOCK */}
              <div className="border border-zinc-200 bg-zinc-50 p-4 space-y-3 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={trackStock}
                    onChange={(e) => setTrackStock(e.target.checked)}
                    className="w-4 h-4 accent-black rounded"
                  />
                  <span className="font-semibold uppercase text-xs text-black">Enable Inventory Stock Counter</span>
                </label>

                {trackStock && (
                  <div className="space-y-3 pt-2 border-t border-zinc-200">
                    {/* Location selector — only shown when enabling tracking for the first time */}
                    {!wasAlreadyTracking && (
                      <div className="space-y-1">
                        <label className="text-zinc-500 uppercase block text-[10px] font-semibold">
                          Stock Location
                          <span className="ml-1 normal-case text-zinc-400 font-normal">(for opening balance)</span>
                        </label>
                        {locations.length > 0 ? (
                          <select
                            value={locationId}
                            onChange={(e) => setLocationId(e.target.value)}
                            className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black rounded-md text-xs font-semibold h-9"
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
                              Auto-creates "General Store" location
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
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-zinc-500 uppercase block text-[10px] font-semibold">Available Stock Quantity</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={stockQuantity}
                          onChange={(e) => setStockQuantity(e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black rounded-md text-xs font-semibold h-9 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-zinc-500 uppercase block text-[10px] font-semibold">Low Stock Alert Limit</label>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={reorderThreshold}
                          onChange={(e) => setReorderThreshold(e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black rounded-md text-xs font-semibold h-9 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* FOOTER ACTIONS */}
              <div className="border-t border-zinc-200/80 pt-5 flex justify-between items-center">
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2 animate-in fade-in zoom-in-95">
                    <span className="text-[10px] text-rose-600 font-bold uppercase">Confirm?</span>
                    <button
                      type="button"
                      disabled={deleteProductMutation.isPending}
                      onClick={() => {
                        deleteProductMutation.mutate(product.id, {
                          onSuccess: () => {
                            setIsOpen(false);
                            setShowDeleteConfirm(false);
                            router.refresh();
                          },
                        });
                      }}
                      className="bg-rose-600 text-white px-3 py-1.5 font-semibold uppercase text-xs rounded-md hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {deleteProductMutation.isPending ? (
                        <>
                          <Spinner size={10} color="white" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        "Yes, Delete"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="btn-secondary-modern px-3 py-1.5 text-xs font-semibold uppercase"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 px-3 py-1.5 font-semibold uppercase text-xs rounded-md transition-colors"
                  >
                    Delete Item
                  </button>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="btn-secondary-modern px-3 py-1.5 text-xs font-semibold uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateProductMutation.isPending}
                    className="btn-primary-modern px-4 py-1.5 text-xs font-semibold uppercase disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {updateProductMutation.isPending ? (
                      <>
                        <Spinner size={10} color="white" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      "Save"
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
