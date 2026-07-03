// src/app/workspaces/[slug]/products/ProductFormClientSide.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProductItem } from "@/lib/actions/products";
import { toast } from "react-hot-toast";

export function ProductFormClientSide({ shopId, shopSlug }: { shopId: string; shopSlug: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCatalogSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const sku = formData.get("sku") as string;
    const unitPrice = parseFloat(formData.get("unitPrice") as string);
    const defaultTaxType = formData.get("defaultTaxType") as "V_16" | "V_0" | "EXEMPT";

    if (!name || isNaN(unitPrice) || unitPrice < 0) {
      const msg = "Item parameters or tracking values are invalid.";
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    const toastId = toast.loading("Registering catalog item...");

    const res = await createProductItem({
      shopId,
      shopSlug,
      name,
      sku: sku || undefined,
      unitPrice,
      defaultTaxType,
    });

    setLoading(false);
    if (!res.success) {
      const msg = res.error || "Failed to commit node to registry.";
      setError(msg);
      toast.error(msg, { id: toastId });
    } else {
      toast.success(`Catalog item "${name}" created!`, { id: toastId });
      setIsOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-zinc-900 transition-colors rounded-none border border-black"
      >
        + Register Catalog Item
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-none z-50 flex items-center justify-center p-4 animate-fade-in animate-duration-150">
          <div className="bg-white border border-black w-full max-w-sm p-6 space-y-6 flex flex-col relative rounded-none">
            
            <div className="space-y-1">
              <h2 className="text-xl font-bold uppercase tracking-tight">Add Catalog Node</h2>
              <p className="font-mono text-[10px] text-zinc-400 uppercase">Define product rate profile metrics</p>
            </div>

            {error && (
              <div className="border border-black bg-zinc-50 p-3 font-mono text-[11px] text-black font-bold uppercase">
                &gt; TRANSACTION_DENIED: {error}
              </div>
            )}

            <form onSubmit={handleCatalogSubmit} className="space-y-4 font-mono text-xs">
              
              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block">Product Name / Service Specification</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g., Consulting Service Hour"
                  className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 rounded-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-zinc-400 uppercase block">SKU / Code Reference</label>
                  <span className="text-[9px] text-zinc-400 font-mono italic">Optional</span>
                </div>
                <input
                  type="text"
                  name="sku"
                  placeholder="e.g., CON-SER-4821 (Auto-generated if blank)"
                  className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 rounded-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block">Base Unit Price</label>
                  <input
                    type="number"
                    name="unitPrice"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 rounded-none font-bold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block">Default Tax Type</label>
                  <select
                    name="defaultTaxType"
                    className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black rounded-none"
                  >
                    <option value="V_16">16% VAT</option>
                    <option value="V_0">0% VAT (Zero-Rated)</option>
                    <option value="EXEMPT">Tax Exempt</option>
                  </select>
                </div>
              </div>

              {/* ACTIONS LAYER */}
              <div className="border-t border-black pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="border border-zinc-300 px-4 py-2 text-zinc-600 hover:border-black hover:text-black transition-colors rounded-none"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-black text-white px-6 py-2 font-bold uppercase hover:bg-zinc-900 transition-colors disabled:bg-zinc-300 rounded-none border border-black"
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