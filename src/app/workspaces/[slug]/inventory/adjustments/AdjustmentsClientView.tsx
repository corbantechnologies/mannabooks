"use client";
// src/app/workspaces/[slug]/inventory/adjustments/AdjustmentsClientView.tsx

import { useState } from "react";
import { toast } from "react-hot-toast";
import { recordStockAdjustment } from "@/lib/actions/inventory";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Props {
  shopId: string;
  shopSlug: string;
  shopCurrency: string;
  locations: any[];
  trackedProducts: any[];
  adjustmentHistory: any[];
}

const REASONS = [
  { value: "COUNT_CORRECTION", label: "Count Correction" },
  { value: "DAMAGED", label: "Damaged / Written Off" },
  { value: "EXPIRED", label: "Expired" },
  { value: "THEFT", label: "Theft / Shrinkage" },
  { value: "PROMOTION", label: "Promotional Use" },
  { value: "OTHER", label: "Other" },
];

const TYPE_BADGE: Record<string, string> = {
  ADJUSTMENT_IN: "bg-blue-100 text-blue-900 border-blue-300",
  ADJUSTMENT_OUT: "bg-amber-100 text-amber-900 border-amber-300",
  OPENING_BALANCE: "bg-zinc-100 text-zinc-700 border-zinc-300",
};

export function AdjustmentsClientView({ shopId, shopSlug, shopCurrency, locations, trackedProducts, adjustmentHistory }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form state
  const [productId, setProductId] = useState("");
  const [locationId, setLocationId] = useState(locations.find(l => l.isDefault)?.id || locations[0]?.id || "");
  const [direction, setDirection] = useState<"IN" | "OUT">("IN");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [reason, setReason] = useState<"COUNT_CORRECTION" | "DAMAGED" | "EXPIRED" | "THEFT" | "PROMOTION" | "OTHER">("COUNT_CORRECTION");
  const [notes, setNotes] = useState("");

  const selectedProduct = trackedProducts.find(p => p.id === productId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) return toast.error("Select a product.");
    if (!locationId) return toast.error("Select a stock location.");
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) return toast.error("Quantity must be a positive number.");

    setLoading(true);
    const toastId = toast.loading("Recording adjustment…");

    const res = await recordStockAdjustment({
      shopId,
      shopSlug,
      productId,
      locationId,
      direction,
      quantity: qty,
      unitCost: unitCost ? parseFloat(unitCost) : undefined,
      reason,
      notes: notes.trim() || undefined,
    });

    setLoading(false);

    if (res.success) {
      toast.success(`Adjustment recorded. New stock: ${res.newStock?.toFixed(2)}`, { id: toastId });
      setProductId("");
      setQuantity("");
      setUnitCost("");
      setNotes("");
      router.refresh();
    } else {
      toast.error(res.error || "Adjustment failed.", { id: toastId });
    }
  }

  return (
    <div className="p-4 sm:p-8 space-y-10 selection:bg-black selection:text-white font-mono text-xs">

      {/* HEADER */}
      <div className="border-b border-zinc-200/80 pb-6">
        <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Inventory / Adjustments</span>
        <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Stock Adjustments</h1>
        <p className="font-sans text-xs text-zinc-600 mt-1">
          Manually adjust inventory levels — damaged goods write-offs, count corrections, opening balances, and promotions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* ADJUSTMENT FORM */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-modern p-6 space-y-5">
            <h2 className="font-sans font-bold text-sm uppercase tracking-tight border-b border-zinc-100 pb-3">
              Record Adjustment
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* DIRECTION TOGGLE */}
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-2">Adjustment Type</label>
                <div className="flex gap-2">
                  {(["IN", "OUT"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDirection(d)}
                      className={`flex-1 py-2 font-mono text-xs font-bold uppercase rounded border transition-colors ${
                        direction === d
                          ? d === "IN" ? "bg-blue-900 text-white border-blue-900" : "bg-rose-700 text-white border-rose-700"
                          : "bg-white text-zinc-600 border-zinc-300 hover:border-zinc-400"
                      }`}
                    >
                      {d === "IN" ? "▲ Stock In" : "▼ Stock Out"}
                    </button>
                  ))}
                </div>
              </div>

              {/* PRODUCT */}
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1.5">Product *</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-zinc-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-black font-sans text-xs"
                  required
                >
                  <option value="">— Select Product —</option>
                  {trackedProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.sku ? `[${p.sku}]` : ""} — Current: {parseFloat(p.stockQuantity).toFixed(2)}
                    </option>
                  ))}
                </select>
                {selectedProduct && (
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Current stock: <strong>{parseFloat(selectedProduct.stockQuantity).toFixed(2)} units</strong>
                    {" | "}Cost price: <strong>{formatCurrency(selectedProduct.costPrice, shopCurrency)}</strong>
                  </p>
                )}
              </div>

              {/* LOCATION */}
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1.5">Location *</label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-zinc-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-black font-sans text-xs"
                  required
                >
                  <option value="">— Select Location —</option>
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.name} {l.code ? `[${l.code}]` : ""}{l.isDefault ? " (Default)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* QUANTITY */}
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1.5">Quantity *</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-3 py-2.5 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black font-mono text-sm"
                  required
                />
              </div>

              {/* UNIT COST (for IN adjustments) */}
              {direction === "IN" && (
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1.5">
                    Unit Cost <span className="font-normal italic">Optional</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    placeholder={`e.g. ${selectedProduct ? parseFloat(selectedProduct.costPrice).toFixed(2) : "0.00"}`}
                    className="w-full px-3 py-2.5 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black font-mono text-sm"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Used for FIFO cost calculation. Defaults to product cost price.</p>
                </div>
              )}

              {/* REASON */}
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1.5">Reason *</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full px-3 py-2.5 border border-zinc-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-black font-sans text-xs"
                >
                  {REASONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* NOTES */}
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1.5">
                  Notes <span className="font-normal italic">Optional</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Additional context or reference..."
                  className="w-full px-3 py-2.5 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black font-sans text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-3 rounded font-mono text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                {loading ? "Recording…" : `Commit ${direction === "IN" ? "Stock In" : "Stock Out"} Adjustment`}
              </button>
            </form>
          </div>
        </div>

        {/* ADJUSTMENT HISTORY */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="font-sans font-bold text-sm uppercase tracking-tight text-black">Adjustment History</h2>

          <div className="card-modern overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
                  <th className="p-4 border-r border-zinc-200">Date</th>
                  <th className="p-4 border-r border-zinc-200">Product</th>
                  <th className="p-4 border-r border-zinc-200 text-center">Type</th>
                  <th className="p-4 border-r border-zinc-200 text-right">Qty</th>
                  <th className="p-4 border-r border-zinc-200 text-right">Balance</th>
                  <th className="p-4">Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 bg-white">
                {adjustmentHistory.map((entry: any) => {
                  const isOut = entry.movementType === "ADJUSTMENT_OUT";
                  return (
                    <tr key={entry.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="p-4 border-r border-zinc-200/80 text-zinc-500">
                        {new Date(entry.createdAt).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                      </td>
                      <td className="p-4 border-r border-zinc-200/80 font-sans font-semibold text-black text-sm">
                        {entry.product?.name || "—"}
                      </td>
                      <td className="p-4 border-r border-zinc-200/80 text-center">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold uppercase ${TYPE_BADGE[entry.movementType] || "bg-zinc-100 text-zinc-500 border-zinc-200"}`}>
                          {entry.movementType.replace("_", " ")}
                        </span>
                      </td>
                      <td className={`p-4 border-r border-zinc-200/80 font-semibold text-right ${isOut ? "text-rose-700" : "text-emerald-700"}`}>
                        {isOut ? "-" : "+"}{parseFloat(entry.quantity).toFixed(2)}
                      </td>
                      <td className="p-4 border-r border-zinc-200/80 font-semibold text-right text-black">
                        {entry.runningBalance !== null ? parseFloat(entry.runningBalance).toFixed(2) : "—"}
                      </td>
                      <td className="p-4 text-zinc-600">
                        {entry.adjustmentReason?.replace("_", " ") || ""}
                        {entry.notes && <span className="block text-[10px] text-zinc-400">{entry.notes}</span>}
                      </td>
                    </tr>
                  );
                })}
                {adjustmentHistory.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-zinc-400 italic font-sans text-xs">
                      No adjustments recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
