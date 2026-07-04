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
    unitPrice: string;
    defaultTaxType: "V_16" | "V_0" | "EXEMPT";
  };
  shopId: string;
  shopSlug: string;
}

export function EditProductModal({ product, shopId, shopSlug }: EditProductModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(product.name);
  const [sku, setSku] = useState(product.sku || "");
  const [unitPrice, setUnitPrice] = useState(product.unitPrice);
  const [taxType, setTaxType] = useState(product.defaultTaxType);
  const [loading, setLoading] = useState(false);

  const updateProductMutation = useUpdateProduct(shopId, shopSlug);
  const deleteProductMutation = useDeleteProduct(shopId, shopSlug);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    updateProductMutation.mutate(
      {
        id: product.id,
        name,
        sku: sku || undefined,
        unitPrice: parseFloat(unitPrice),
        defaultTaxType: taxType,
      },
      {
        onSuccess: () => {
          setIsOpen(false);
          router.refresh();
        },
      }
    );
  }

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;
    deleteProductMutation.mutate(product.id, {
      onSuccess: () => {
        setIsOpen(false);
        router.refresh();
      },
    });
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200/80 rounded-md shadow-xl w-[95%] sm:w-full max-w-sm max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-6 relative font-mono text-xs animate-in zoom-in-95 duration-150">
            
            <div className="space-y-1">
              <h2 className="text-xl font-semibold uppercase tracking-tight font-sans text-black">Edit Catalog Node</h2>
              <p className="text-[10px] text-zinc-400 uppercase font-semibold">Update item pricing &amp; tax rules</p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block font-semibold">Product Name / Description</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block font-semibold">SKU Reference</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black uppercase text-xs rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold">Unit Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black font-semibold text-xs rounded"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold">Tax Type</label>
                  <select
                    value={taxType}
                    onChange={(e) => setTaxType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black text-xs font-semibold rounded"
                  >
                    <option value="V_16">16% VAT</option>
                    <option value="V_0">0% VAT</option>
                    <option value="EXEMPT">Exempt</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-zinc-200/80 pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="border border-rose-200 bg-rose-50 text-rose-600 px-3 py-1.5 font-semibold uppercase hover:bg-rose-600 hover:text-white rounded transition-colors text-xs"
                >
                  DELETE
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="btn-secondary-modern px-3 py-1.5 text-xs font-semibold uppercase"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary-modern px-4 py-1.5 text-xs font-semibold uppercase disabled:bg-zinc-300"
                  >
                    {loading ? "SAVING..." : "SAVE"}
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
