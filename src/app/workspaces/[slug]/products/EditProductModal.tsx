// src/app/workspaces/[slug]/products/EditProductModal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts";
import { toast } from "react-hot-toast";

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
  };
  shopId: string;
  shopSlug: string;
}

export function EditProductModal({ product, shopId, shopSlug }: EditProductModalProps) {
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200/80 rounded-lg shadow-2xl w-full max-w-xl sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 relative font-mono text-xs animate-in zoom-in-95 duration-150">
            
            <div className="border-b border-zinc-100 pb-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tight font-sans text-black">Edit Catalog Node</h2>
                <p className="text-[10px] text-zinc-400 uppercase font-semibold mt-0.5">Update item classification, pricing, &amp; inventory tracking</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-black text-sm font-bold px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5 font-mono text-xs">
              
              {/* CLASSIFICATION & SKU ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold">Item Classification</label>
                  <select
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value as any)}
                    className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs font-semibold h-10"
                  >
                    <option value="PRODUCT">📦 Product (Tangible Good)</option>
                    <option value="SERVICE">🛠️ Service (Labor / Consulting)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold">SKU / Code Reference</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. LAP-8935"
                    className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:border-black uppercase text-xs rounded font-semibold h-10"
                  />
                </div>
              </div>

              {/* PRODUCT NAME */}
              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block font-semibold">Product Name / Description</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ergonomic Laptop Stand"
                  className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs font-sans font-semibold h-10"
                  required
                />
              </div>

              {/* PRICING & TAX ROW (3 COLS) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold">Selling Price (KES)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:border-black font-semibold text-xs rounded h-10"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold">Cost Price / COGS (KES)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:border-black font-semibold text-xs rounded h-10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold">Tax Type</label>
                  <select
                    value={taxType}
                    onChange={(e) => setTaxType(e.target.value as any)}
                    className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:border-black text-xs font-semibold rounded h-10"
                  >
                    <option value="V_16">16% VAT</option>
                    <option value="V_0">0% VAT (Zero-Rated)</option>
                    <option value="EXEMPT">Tax Exempt</option>
                  </select>
                </div>
              </div>

              {/* INVENTORY TRACKING BLOCK */}
              <div className="border border-zinc-200 bg-zinc-50 p-4 space-y-3 rounded-md">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-200">
                    <div className="space-y-1">
                      <label className="text-zinc-500 uppercase block text-[10px] font-semibold">Available Stock Quantity</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={stockQuantity}
                        onChange={(e) => setStockQuantity(e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs font-semibold h-9"
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
                        className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs font-semibold h-9"
                      />
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
                      onClick={() => {
                        deleteProductMutation.mutate(product.id, {
                          onSuccess: () => {
                            setIsOpen(false);
                            setShowDeleteConfirm(false);
                            router.refresh();
                          },
                        });
                      }}
                      className="bg-rose-600 text-white px-3 py-1.5 font-bold uppercase text-[10px] hover:bg-rose-700 transition-colors"
                    >
                      Yes, Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="bg-zinc-100 text-zinc-500 px-3 py-1.5 font-bold uppercase text-[10px] hover:bg-zinc-200 transition-colors"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="border border-rose-200 bg-rose-50 text-rose-700 px-4 py-2 font-semibold uppercase hover:bg-rose-600 hover:text-white rounded transition-colors text-xs"
                  >
                    DELETE
                  </button>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="btn-secondary-modern px-4 py-2 text-xs font-semibold uppercase"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary-modern px-5 py-2 text-xs font-semibold uppercase disabled:bg-zinc-300"
                  >
                    {loading ? "SAVING..." : "SAVE CHANGES"}
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
