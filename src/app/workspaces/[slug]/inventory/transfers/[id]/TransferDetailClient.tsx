"use client";
// src/app/workspaces/[slug]/inventory/transfers/[id]/TransferDetailClient.tsx

import { useState } from "react";
import { toast } from "react-hot-toast";
import { dispatchStockTransfer, receiveStockTransfer, cancelStockTransfer } from "@/lib/actions/stock-transfers";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-zinc-100 text-zinc-700 border-zinc-300",
  IN_TRANSIT: "bg-blue-100 text-blue-900 border-blue-300",
  COMPLETED: "bg-emerald-100 text-emerald-900 border-emerald-300",
  CANCELLED: "bg-rose-100 text-rose-700 border-rose-300",
};

interface Props {
  transfer: any;
  shopSlug: string;
  shopCurrency: string;
}

export function TransferDetailClient({ transfer, shopSlug, shopCurrency }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Received quantities for IN_TRANSIT → COMPLETED
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>(
    Object.fromEntries(transfer.items.map((item: any) => [
      item.id,
      parseFloat(item.quantityRequested)
    ]))
  );

  async function handleDispatch() {
    if (!confirm("Dispatch this transfer? This will immediately deduct stock from the source location.")) return;
    setLoading(true);
    const res = await dispatchStockTransfer(transfer.id, shopSlug);
    setLoading(false);
    if (res.success) {
      toast.success("Transfer dispatched — stock deducted from source.");
      router.refresh();
    } else {
      toast.error(res.error || "Dispatch failed.");
    }
  }

  async function handleReceive() {
    if (!confirm("Mark this transfer as received? Stock will be credited to the destination location.")) return;
    setLoading(true);
    const receivedItems = transfer.items.map((item: any) => ({
      transferItemId: item.id,
      quantityReceived: receivedQtys[item.id] ?? parseFloat(item.quantityRequested),
    }));
    const res = await receiveStockTransfer(transfer.id, shopSlug, receivedItems);
    setLoading(false);
    if (res.success) {
      toast.success("Transfer received — stock credited to destination.");
      router.refresh();
    } else {
      toast.error(res.error || "Receive failed.");
    }
  }

  async function handleCancel() {
    if (!confirm("Cancel this transfer? If dispatched, stock will be restored to the source location.")) return;
    setLoading(true);
    const res = await cancelStockTransfer(transfer.id, shopSlug);
    setLoading(false);
    if (res.success) {
      toast.success("Transfer cancelled.");
      router.refresh();
    } else {
      toast.error(res.error || "Cancellation failed.");
    }
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white font-mono text-xs max-w-4xl">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/80 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href={`/workspaces/${shopSlug}/inventory/transfers`}
              className="text-zinc-400 hover:text-black text-[10px] uppercase font-semibold"
            >
              ← All Transfers
            </Link>
            <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold uppercase ${STATUS_STYLES[transfer.status] || ""}`}>
              {transfer.status}
            </span>
          </div>
          <h1 className="text-xl font-semibold uppercase tracking-tight text-black font-sans">Transfer Details</h1>
          <p className="font-sans text-xs text-zinc-600 mt-1">
            {transfer.fromLocation?.name} → {transfer.toLocation?.name}
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap gap-2">
          {transfer.status === "DRAFT" && (
            <>
              <button
                onClick={handleDispatch}
                disabled={loading}
                className="bg-blue-900 text-white hover:bg-blue-800 px-4 py-2 font-mono text-xs font-semibold uppercase rounded transition-colors disabled:opacity-50"
              >
                {loading ? "…" : "🚚 Dispatch Transfer"}
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="border border-rose-300 text-rose-700 hover:bg-rose-50 px-4 py-2 font-mono text-xs font-semibold uppercase rounded transition-colors"
              >
                Cancel
              </button>
            </>
          )}
          {transfer.status === "IN_TRANSIT" && (
            <>
              <button
                onClick={handleReceive}
                disabled={loading}
                className="bg-emerald-900 text-white hover:bg-emerald-800 px-4 py-2 font-mono text-xs font-semibold uppercase rounded transition-colors disabled:opacity-50"
              >
                {loading ? "…" : "✅ Confirm Receipt"}
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="border border-rose-300 text-rose-700 hover:bg-rose-50 px-4 py-2 font-mono text-xs font-semibold uppercase rounded transition-colors"
              >
                Cancel & Restore
              </button>
            </>
          )}
        </div>
      </div>

      {/* TRANSFER INFO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "From Location", value: `${transfer.fromLocation?.name}${transfer.fromLocation?.code ? ` [${transfer.fromLocation.code}]` : ""}` },
          { label: "To Location", value: `${transfer.toLocation?.name}${transfer.toLocation?.code ? ` [${transfer.toLocation.code}]` : ""}` },
          { label: "Created", value: new Date(transfer.createdAt).toLocaleDateString("en-KE", { dateStyle: "medium" }) },
          { label: "Requested By", value: transfer.requestedBy?.name || "—" },
        ].map((item) => (
          <div key={item.label} className="card-modern p-4 space-y-1">
            <p className="text-[10px] text-zinc-400 uppercase font-semibold">{item.label}</p>
            <p className="font-sans font-semibold text-sm text-black">{item.value}</p>
          </div>
        ))}
      </div>

      {transfer.notes && (
        <div className="border border-zinc-200 bg-zinc-50 rounded-lg p-4">
          <p className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Transfer Notes</p>
          <p className="font-sans text-xs text-zinc-700">{transfer.notes}</p>
        </div>
      )}

      {/* LINE ITEMS TABLE */}
      <div className="card-modern overflow-x-auto">
        <div className="border-b border-zinc-200 px-5 py-3 bg-zinc-50/80 flex justify-between items-center">
          <h2 className="font-sans font-bold text-sm uppercase tracking-tight">Transfer Items</h2>
          <span className="text-[10px] text-zinc-400">{transfer.items.length} product{transfer.items.length !== 1 ? "s" : ""}</span>
        </div>
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50/50 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
              <th className="p-4 border-r border-zinc-200">Product</th>
              <th className="p-4 border-r border-zinc-200 text-right">Qty Requested</th>
              <th className="p-4 border-r border-zinc-200 text-right">
                {transfer.status === "IN_TRANSIT" ? "Qty to Receive" : "Qty Received"}
              </th>
              <th className="p-4 border-r border-zinc-200 text-right">Cost Price</th>
              <th className="p-4">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/80 bg-white">
            {transfer.items.map((item: any) => (
              <tr key={item.id} className="hover:bg-zinc-50/60 transition-colors">
                <td className="p-4 border-r border-zinc-200/80 font-sans font-semibold text-black text-sm">
                  {item.product?.name || "—"}
                  {item.product?.sku && <span className="block text-[10px] text-zinc-400 font-mono">{item.product.sku}</span>}
                </td>
                <td className="p-4 border-r border-zinc-200/80 text-right font-semibold">
                  {parseFloat(item.quantityRequested).toFixed(2)}
                </td>
                <td className="p-4 border-r border-zinc-200/80 text-right">
                  {transfer.status === "IN_TRANSIT" ? (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      max={item.quantityRequested}
                      value={receivedQtys[item.id] ?? parseFloat(item.quantityRequested)}
                      onChange={(e) => setReceivedQtys(prev => ({ ...prev, [item.id]: parseFloat(e.target.value) || 0 }))}
                      className="w-24 px-2 py-1 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-black font-mono text-xs text-right"
                    />
                  ) : (
                    <span className={parseFloat(item.quantityReceived) > 0 ? "text-emerald-700 font-semibold" : "text-zinc-400"}>
                      {parseFloat(item.quantityReceived).toFixed(2)}
                    </span>
                  )}
                </td>
                <td className="p-4 border-r border-zinc-200/80 text-right text-zinc-600">
                  {item.product?.costPrice ? formatCurrency(item.product.costPrice, "KES") : "—"}
                </td>
                <td className="p-4 text-zinc-500 italic">
                  {item.notes || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* STATUS TIMELINE */}
      <div className="card-modern p-6 space-y-3">
        <h2 className="font-sans font-bold text-sm uppercase tracking-tight border-b border-zinc-100 pb-3">Transfer Lifecycle</h2>
        <div className="flex items-center gap-0">
          {["DRAFT", "IN_TRANSIT", "COMPLETED"].map((stage, idx) => {
            const stages = ["DRAFT", "IN_TRANSIT", "COMPLETED"];
            const currentIdx = stages.indexOf(transfer.status === "CANCELLED" ? "DRAFT" : transfer.status);
            const passed = idx <= currentIdx && transfer.status !== "CANCELLED";
            return (
              <div key={stage} className="flex items-center">
                <div className={`w-3 h-3 rounded-full border-2 transition-colors ${
                  passed ? "bg-black border-black" : "bg-white border-zinc-300"
                }`} />
                <span className={`mx-2 text-[10px] font-semibold uppercase ${passed ? "text-black" : "text-zinc-400"}`}>
                  {stage.replace("_", " ")}
                </span>
                {idx < 2 && <div className={`h-px w-8 ${passed && idx < currentIdx ? "bg-black" : "bg-zinc-200"}`} />}
              </div>
            );
          })}
          {transfer.status === "CANCELLED" && (
            <span className="ml-4 text-[10px] font-semibold uppercase text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
              CANCELLED
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
