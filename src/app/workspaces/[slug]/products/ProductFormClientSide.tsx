// src/app/workspaces/[slug]/products/ProductFormClientSide.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateProduct } from "@/hooks/useProducts";
import { toast } from "react-hot-toast";

export function ProductFormClientSide({ shopId, shopSlug }: { shopId: string; shopSlug: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProductMutation = useCreateProduct(shopId, shopSlug);

  async function handleCatalogSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const sku = formData.get("sku") as string;
    const unitPrice = parseFloat(formData.get("unitPrice") as string);
    const defaultTaxType = formData.get("defaultTaxType") as "V_16" | "V_0" | "EXEMPT";
    const trackStock = formData.get("trackStock") === "on";
    const stockQuantity = parseFloat(formData.get("stockQuantity") as string || "0");
    const reorderThreshold = parseFloat(formData.get("reorderThreshold") as string || "5");

    if (!name || isNaN(unitPrice) || unitPrice < 0) {
      const msg = "Item parameters or tracking values are invalid.";
      setError(msg);
      toast.error(msg);
      return;
    }

    createProductMutation.mutate(
      { name, sku: sku || undefined, unitPrice, defaultTaxType, trackStock, stockQuantity, reorderThreshold },
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
        className="btn-primary-modern px-4 py-2 text-xs font-semibold uppercase tracking-wider"
      >
        + Register Catalog Item
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200/80 rounded-md shadow-xl max-w-md w-full p-6 space-y-6 font-mono text-xs animate-in zoom-in-95 duration-150 relative">
            
            <div className="space-y-1">
              <h2 className="text-xl font-semibold uppercase tracking-tight font-sans text-black">Add Catalog Node</h2>
              <p className="font-mono text-[10px] text-zinc-400 uppercase font-semibold">Define product rate profile metrics</p>
            </div>

            {error && (
              <div className="border border-zinc-200 bg-zinc-50 p-3 font-mono text-[11px] text-black font-semibold uppercase rounded">
                &gt; TRANSACTION_DENIED: {error}
              </div>
            )}

            <form onSubmit={handleCatalogSubmit} className="space-y-4 font-mono text-xs">
              
              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block font-semibold">Product Name / Service Specification</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g., Consulting Service Hour"
                  className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-zinc-400 uppercase block font-semibold">SKU / Code Reference</label>
                  <span className="text-[9px] text-zinc-400 font-mono italic">Optional</span>
                </div>
                <input
                  type="text"
                  name="sku"
                  placeholder="e.g., CON-SER-4821 (Auto-generated if blank)"
                  className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold">Base Unit Price</label>
                  <input
                    type="number"
                    name="unitPrice"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold">Default Tax Type</label>
                  <select
                    name="defaultTaxType"
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs font-semibold"
                  >
                    <option value="V_16">16% VAT</option>
                    <option value="V_0">0% VAT (Zero-Rated)</option>
                    <option value="EXEMPT">Tax Exempt</option>
                  </select>
                </div>
              </div>

              {/* INVENTORY TRACKING BLOCK */}
              <div className="border border-zinc-200 bg-zinc-50 p-3.5 space-y-3 rounded">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="trackStock"
                    className="accent-black"
                  />
                  <span className="font-semibold uppercase text-xs text-black">Track Item</span>
                </label>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-zinc-400 uppercase block text-[9px] font-semibold">Available Stock Qty</label>
                    <input
                      type="number"
                      name="stockQuantity"
                      step="1"
                      min="0"
                      defaultValue="0"
                      className="w-full px-2.5 py-1.5 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-400 uppercase block text-[9px] font-semibold">Low Stock Alert Limit</label>
                    <input
                      type="number"
                      name="reorderThreshold"
                      step="1"
                      min="1"
                      defaultValue="5"
                      className="w-full px-2.5 py-1.5 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* ACTIONS LAYER */}
              <div className="border-t border-zinc-200/80 pt-4 flex justify-end gap-2">
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
                  className="btn-primary-modern px-6 py-2 font-semibold uppercase text-xs disabled:bg-zinc-300"
                >
                  {loading ? "RECORDING..." : "SAVE ITEM"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}