// src/app/workspaces/[slug]/products/EditProductModal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProductItem, deleteProductItem } from "@/lib/actions/products";
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

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Updating product item...");

    const res = await updateProductItem({
      id: product.id,
      shopId,
      shopSlug,
      name,
      sku: sku || undefined,
      unitPrice: parseFloat(unitPrice),
      defaultTaxType: taxType,
    });

    setLoading(false);
    if (res.success) {
      toast.success("Catalog item updated!", { id: toastId });
      setIsOpen(false);
      router.refresh();
    } else {
      toast.error(res.error || "Failed to update product.", { id: toastId });
    }
  }

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;
    const toastId = toast.loading("Deleting product item...");

    const res = await deleteProductItem(product.id, shopId, shopSlug);
    if (res.success) {
      toast.success("Catalog item deleted!", { id: toastId });
      setIsOpen(false);
      router.refresh();
    } else {
      toast.error(res.error || "Failed to delete product.", { id: toastId });
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="border border-black px-2 py-1 text-[10px] font-bold uppercase hover:bg-black hover:text-white transition-colors"
      >
        Edit
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-black w-full max-w-sm p-6 space-y-6 relative font-mono text-xs">
            
            <div className="space-y-1">
              <h2 className="text-xl font-bold uppercase tracking-tight">Edit Catalog Node</h2>
              <p className="text-[10px] text-zinc-400 uppercase">Update item pricing &amp; tax rules</p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block">Product Name / Description</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block">SKU Reference</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block">Unit Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black font-bold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block">Tax Type</label>
                  <select
                    value={taxType}
                    onChange={(e) => setTaxType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="V_16">16% VAT</option>
                    <option value="V_0">0% VAT</option>
                    <option value="EXEMPT">Exempt</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-black pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="border border-rose-600 text-rose-600 px-3 py-1.5 font-bold uppercase hover:bg-rose-600 hover:text-white transition-colors"
                >
                  DELETE
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="border border-zinc-300 px-3 py-1.5 text-zinc-600 hover:border-black hover:text-black transition-colors"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-black text-white px-4 py-1.5 font-bold uppercase hover:bg-zinc-900 transition-colors disabled:bg-zinc-300"
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
