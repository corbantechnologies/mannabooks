"use client";
// src/app/workspaces/[slug]/inventory/transfers/new/NewTransferForm.tsx

import { useState } from "react";
import { toast } from "react-hot-toast";
import { createStockTransfer } from "@/lib/actions/stock-transfers";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface TransferLine {
  productId: string;
  quantityRequested: number | "";
  notes: string;
}

interface Props {
  shopId: string;
  shopSlug: string;
  shopCurrency: string;
  locations: any[];
  trackedProducts: any[];
}

export function NewTransferForm({ shopId, shopSlug, shopCurrency, locations, trackedProducts }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fromLocationId, setFromLocationId] = useState(locations.find(l => l.isDefault)?.id || locations[0]?.id || "");
  const [toLocationId, setToLocationId] = useState(
    locations.find(l => !l.isDefault)?.id || locations[1]?.id || ""
  );
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<TransferLine[]>([
    { productId: "", quantityRequested: "", notes: "" }
  ]);

  function addLine() {
    setLines([...lines, { productId: "", quantityRequested: "", notes: "" }]);
  }

  function removeLine(idx: number) {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== idx));
  }

  function updateLine(idx: number, field: keyof TransferLine, value: any) {
    const updated = [...lines];
    updated[idx] = { ...updated[idx], [field]: value };
    setLines(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (fromLocationId === toLocationId) {
      return toast.error("Source and destination locations must be different.");
    }

    const validLines = lines.filter(l => l.productId && Number(l.quantityRequested) > 0);
    if (validLines.length === 0) {
      return toast.error("Add at least one product line with a quantity.");
    }

    setLoading(true);
    const toastId = toast.loading("Creating transfer…");

    const res = await createStockTransfer({
      shopId,
      shopSlug,
      fromLocationId,
      toLocationId,
      notes: notes.trim() || undefined,
      items: validLines.map(l => ({
        productId: l.productId,
        quantityRequested: Number(l.quantityRequested),
        notes: l.notes || undefined,
      })),
    });

    setLoading(false);

    if (res.success) {
      toast.success("Transfer created. Review and dispatch when ready.", { id: toastId });
      router.push(`/workspaces/${shopSlug}/inventory/transfers/${res.transferId}`);
    } else {
      toast.error(res.error || "Failed to create transfer.", { id: toastId });
    }
  }

  return (
    <div className="p-5 sm:p-7 space-y-6 font-mono text-xs max-w-3xl">

      {/* HEADER */}
      <div className="space-y-2">
        <span className="text-xs text-zinc-400 font-medium">Inventory / Transfers / New</span>
        <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Create Stock Transfer</h1>
        <p className="font-sans text-xs text-zinc-600 mt-1">
          A transfer starts as DRAFT. Dispatch it to deduct stock from source, then receive at destination to complete.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* FROM / TO LOCATIONS */}
        <div className="card-modern p-6 space-y-5">
          <h2 className="font-sans font-bold text-sm uppercase tracking-tight border-b border-zinc-100 pb-3">Transfer Route</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1.5">From Location (Source) *</label>
              <select
                value={fromLocationId}
                onChange={(e) => setFromLocationId(e.target.value)}
                className="w-full px-3 py-2.5 border border-zinc-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-black font-sans text-xs"
                required
              >
                {locations.map(l => (
                  <option key={l.id} value={l.id}>{l.name}{l.code ? ` [${l.code}]` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1.5">To Location (Destination) *</label>
              <select
                value={toLocationId}
                onChange={(e) => setToLocationId(e.target.value)}
                className="w-full px-3 py-2.5 border border-zinc-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-black font-sans text-xs"
                required
              >
                {locations.filter(l => l.id !== fromLocationId).map(l => (
                  <option key={l.id} value={l.id}>{l.name}{l.code ? ` [${l.code}]` : ""}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1.5">Transfer Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Reason for transfer, purchase order reference, etc."
              className="w-full px-3 py-2.5 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black font-sans text-xs resize-none"
            />
          </div>
        </div>

        {/* PRODUCT LINES */}
        <div className="card-modern p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
            <h2 className="font-sans font-bold text-sm uppercase tracking-tight">Products to Transfer</h2>
            <button
              type="button"
              onClick={addLine}
              className="text-[10px] font-semibold uppercase text-black border border-zinc-300 px-3 py-1 rounded hover:bg-zinc-50 transition-colors"
            >
              + Add Product
            </button>
          </div>

          <div className="space-y-3">
            {lines.map((line, idx) => {
              const product = trackedProducts.find(p => p.id === line.productId);
              return (
                <div key={idx} className="grid grid-cols-12 gap-3 items-start">
                  <div className="col-span-6">
                    <select
                      value={line.productId}
                      onChange={(e) => updateLine(idx, "productId", e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-black font-sans text-xs"
                    >
                      <option value="">— Select Product —</option>
                      {trackedProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.sku ? `[${p.sku}]` : ""} — Stock: {parseFloat(p.stockQuantity).toFixed(2)}
                        </option>
                      ))}
                    </select>
                    {product && (
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        Available: {parseFloat(product.stockQuantity).toFixed(2)} | Cost: {formatCurrency(product.costPrice, shopCurrency)}
                      </p>
                    )}
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={line.quantityRequested}
                      onChange={(e) => updateLine(idx, "quantityRequested", e.target.value ? parseFloat(e.target.value) : "")}
                      placeholder="Qty"
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black font-mono text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={line.notes}
                      onChange={(e) => updateLine(idx, "notes", e.target.value)}
                      placeholder="Notes"
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black font-sans text-xs"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-center pt-2">
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="text-rose-500 hover:text-rose-700 font-bold text-sm leading-none"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SUBMIT */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-black text-white py-3 rounded font-mono text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating…" : "Create Transfer (DRAFT)"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 border border-zinc-300 rounded hover:bg-zinc-50 font-mono text-xs font-semibold uppercase text-zinc-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
