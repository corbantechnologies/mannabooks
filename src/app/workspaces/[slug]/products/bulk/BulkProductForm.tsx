"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { createBulkProducts } from "@/lib/actions/products";

interface BulkProductFormProps {
  shopId: string;
  shopSlug: string;
}

interface BulkItem {
  id: string; // for React key
  name: string;
  sku: string;
  itemType: "PRODUCT" | "SERVICE";
  unitPrice: number | "";
  costPrice: number | "";
  defaultTaxType: "V_16" | "V_0" | "EXEMPT";
  trackStock: boolean;
  stockQuantity: number | "";
}

const DEFAULT_ITEM = (): BulkItem => ({
  id: crypto.randomUUID(),
  name: "",
  sku: "",
  itemType: "PRODUCT",
  unitPrice: "",
  costPrice: "",
  defaultTaxType: "V_16",
  trackStock: true,
  stockQuantity: "",
});

export function BulkProductForm({ shopId, shopSlug }: BulkProductFormProps) {
  const router = useRouter();
  const [items, setItems] = useState<BulkItem[]>([
    DEFAULT_ITEM(), DEFAULT_ITEM(), DEFAULT_ITEM(), DEFAULT_ITEM(), DEFAULT_ITEM()
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function addItem() {
    setItems((prev) => [...prev, DEFAULT_ITEM()]);
  }

  function addFiveItems() {
    setItems((prev) => [...prev, DEFAULT_ITEM(), DEFAULT_ITEM(), DEFAULT_ITEM(), DEFAULT_ITEM(), DEFAULT_ITEM()]);
  }

  function removeItem(id: string) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateItem<K extends keyof BulkItem>(id: string, field: K, value: BulkItem[K]) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading("Processing bulk catalog import...");

    // Filter out rows with no name
    const validItems = items.filter(i => i.name.trim() !== "");

    if (validItems.length === 0) {
      toast.error("No valid items to import. Please fill in at least one item name.", { id: toastId });
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await createBulkProducts({
        shopId,
        shopSlug,
        items: validItems.map((item) => ({
          name: item.name,
          sku: item.sku,
          itemType: item.itemType,
          unitPrice: Number(item.unitPrice) || 0,
          costPrice: Number(item.costPrice) || 0,
          defaultTaxType: item.defaultTaxType,
          trackStock: item.itemType === "PRODUCT" ? item.trackStock : false,
          stockQuantity: Number(item.stockQuantity) || 0,
        })),
      });

      if (res.success) {
        toast.success(`Successfully imported ${res.count} items.`, { id: toastId });
        router.refresh();
        router.push(`/workspaces/${shopSlug}/products`);
      } else {
        toast.error(res.error || "Failed to process bulk import.", { id: toastId });
      }
    } catch (err) {
      toast.error("A critical error occurred.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      <div className="card-modern overflow-x-auto p-0">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="p-3 font-semibold text-zinc-600 border-r border-zinc-200">No.</th>
              <th className="p-3 font-semibold text-zinc-600 border-r border-zinc-200 min-w-[200px]">Item Name *</th>
              <th className="p-3 font-semibold text-zinc-600 border-r border-zinc-200">SKU (Opt)</th>
              <th className="p-3 font-semibold text-zinc-600 border-r border-zinc-200">Type</th>
              <th className="p-3 font-semibold text-zinc-600 border-r border-zinc-200 w-24">Sell Price *</th>
              <th className="p-3 font-semibold text-zinc-600 border-r border-zinc-200 w-24">COGS (Opt)</th>
              <th className="p-3 font-semibold text-zinc-600 border-r border-zinc-200">Tax</th>
              <th className="p-3 font-semibold text-zinc-600 border-r border-zinc-200">Track Stock</th>
              <th className="p-3 font-semibold text-zinc-600 border-r border-zinc-200 w-20">Qty</th>
              <th className="p-3 font-semibold text-zinc-600 text-center">X</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {items.map((item, index) => (
              <tr key={item.id} className="hover:bg-zinc-50/50">
                <td className="p-2 border-r border-zinc-200 text-center text-zinc-400 font-bold">
                  {String(index + 1).padStart(2, '0')}
                </td>
                <td className="p-2 border-r border-zinc-200">
                  <input
                    type="text"
                    required
                    value={item.name}
                    onChange={(e) => updateItem(item.id, "name", e.target.value)}
                    className="w-full p-2 border border-zinc-200 rounded font-sans tracking-tight text-xs"
                    placeholder="E.g. Product Name"
                  />
                </td>
                <td className="p-2 border-r border-zinc-200">
                  <input
                    type="text"
                    value={item.sku}
                    onChange={(e) => updateItem(item.id, "sku", e.target.value)}
                    className="w-full p-2 border border-zinc-200 rounded font-mono text-[10px]"
                    placeholder="AUTO"
                  />
                </td>
                <td className="p-2 border-r border-zinc-200">
                  <select
                    value={item.itemType}
                    onChange={(e) => updateItem(item.id, "itemType", e.target.value as any)}
                    className="w-full p-2 border border-zinc-200 rounded font-mono text-[10px] uppercase"
                  >
                    <option value="PRODUCT">PRODUCT</option>
                    <option value="SERVICE">SERVICE</option>
                  </select>
                </td>
                <td className="p-2 border-r border-zinc-200">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, "unitPrice", e.target.value === "" ? "" : parseFloat(e.target.value))}
                    className="w-full p-2 border border-zinc-200 rounded font-mono text-[10px]"
                  />
                </td>
                <td className="p-2 border-r border-zinc-200">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.costPrice}
                    onChange={(e) => updateItem(item.id, "costPrice", e.target.value === "" ? "" : parseFloat(e.target.value))}
                    className="w-full p-2 border border-zinc-200 rounded font-mono text-[10px]"
                  />
                </td>
                <td className="p-2 border-r border-zinc-200">
                  <select
                    value={item.defaultTaxType}
                    onChange={(e) => updateItem(item.id, "defaultTaxType", e.target.value as any)}
                    className="w-full p-2 border border-zinc-200 rounded font-mono text-[10px] uppercase"
                  >
                    <option value="V_16">16% VAT</option>
                    <option value="V_0">0% VAT</option>
                    <option value="EXEMPT">EXEMPT</option>
                  </select>
                </td>
                <td className="p-2 border-r border-zinc-200 text-center">
                  <input
                    type="checkbox"
                    checked={item.trackStock}
                    disabled={item.itemType === "SERVICE"}
                    onChange={(e) => updateItem(item.id, "trackStock", e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </td>
                <td className="p-2 border-r border-zinc-200">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={!item.trackStock || item.itemType === "SERVICE"}
                    value={item.stockQuantity}
                    onChange={(e) => updateItem(item.id, "stockQuantity", e.target.value === "" ? "" : parseFloat(e.target.value))}
                    className="w-full p-2 border border-zinc-200 rounded font-mono text-[10px]"
                  />
                </td>
                <td className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1 hover:bg-rose-100 text-rose-500 rounded transition-colors"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center bg-zinc-50 border border-zinc-200 p-4 rounded-xl">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={addItem}
            className="btn-secondary-modern px-4 py-2 font-mono text-xs uppercase font-bold"
          >
            + Add 1 Row
          </button>
          <button
            type="button"
            onClick={addFiveItems}
            className="border border-zinc-300 bg-white hover:bg-zinc-100 text-black px-4 py-2 rounded-md font-mono text-xs uppercase font-bold transition-all shadow-sm"
          >
            + Add 5 Rows
          </button>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary-modern px-8 py-3 font-mono text-xs font-bold uppercase tracking-wider"
        >
          {isSubmitting ? "Importing..." : `Commit ${items.filter(i => i.name.trim() !== "").length} Items to Catalog`}
        </button>
      </div>

    </form>
  );
}
