"use client";

import { useQuery } from "@tanstack/react-query";
import axiosClient from "@/lib/api/axios";
import { useStockLocations } from "@/hooks/useInventoryOps";
import { Spinner } from "@/components/Spinner";

interface Props {
  shopId: string;
  shopSlug: string;
}

const MOVEMENT_LABELS: Record<string, string> = {
  PURCHASE_RECEIPT: "Purchase Receipt",
  SALE: "Sale",
  ADJUSTMENT_IN: "Adjustment In",
  ADJUSTMENT_OUT: "Adjustment Out",
  TRANSFER_OUT: "Transfer Out",
  TRANSFER_IN: "Transfer In",
  OPENING_BALANCE: "Opening Balance",
  RETURN: "Return",
  VOID: "Void",
};

const MOVEMENT_COLORS: Record<string, string> = {
  PURCHASE_RECEIPT: "bg-emerald-100 text-emerald-900 border-emerald-300",
  SALE: "bg-rose-100 text-rose-900 border-rose-300",
  ADJUSTMENT_IN: "bg-blue-100 text-blue-900 border-blue-300",
  ADJUSTMENT_OUT: "bg-amber-100 text-amber-900 border-amber-300",
  TRANSFER_OUT: "bg-purple-100 text-purple-900 border-purple-300",
  TRANSFER_IN: "bg-indigo-100 text-indigo-900 border-indigo-300",
  OPENING_BALANCE: "bg-zinc-100 text-zinc-700 border-zinc-300",
  RETURN: "bg-cyan-100 text-cyan-900 border-cyan-300",
  VOID: "bg-zinc-100 text-zinc-400 border-zinc-200",
};

const OUTFLOW_TYPES = ["SALE", "ADJUSTMENT_OUT", "TRANSFER_OUT", "VOID"];

export function MovementHistoryClientView({ shopId, shopSlug }: Props) {
  const { data: locations = [] } = useStockLocations(shopId);

  const { data: ledger = [], isLoading } = useQuery({
    queryKey: ["inventory", "ledger", shopId],
    queryFn: async () => {
      try {
        const res: any = await axiosClient.get("/items/transfers", { params: { shop_id: shopId } });
        return Array.isArray(res) ? res : res?.transfers || [];
      } catch {
        return [];
      }
    },
    enabled: Boolean(shopId),
  });

  return (
    <div className="p-5 sm:p-7 space-y-6 font-mono text-xs">
      {/* HEADER */}
      <div className="space-y-2">
        <span className="text-xs text-zinc-400 font-medium">Inventory / Reports</span>
        <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Stock Movement History</h1>
        <p className="font-sans text-xs text-zinc-600 mt-1">
          Full immutable audit trail of every stock movement — sales, receipts, adjustments, and transfers.
        </p>
      </div>

      {/* TYPE LEGEND */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(MOVEMENT_LABELS).map(([type, label]) => (
          <span key={type} className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${MOVEMENT_COLORS[type]}`}>
            {label}
          </span>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner size={32} />
        </div>
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-wide font-semibold text-zinc-400 bg-zinc-50/60">
                <th className="px-4 py-3 border-r border-zinc-100">Date &amp; Time</th>
                <th className="px-4 py-3 border-r border-zinc-100">Product</th>
                <th className="px-4 py-3 border-r border-zinc-100">Type</th>
                <th className="px-4 py-3 border-r border-zinc-100">Location</th>
                <th className="px-4 py-3 border-r border-zinc-100 text-right">Qty Changed</th>
                <th className="px-4 py-3 border-r border-zinc-100 text-right">Unit Cost</th>
                <th className="px-4 py-3 border-r border-zinc-100 text-right">Balance After</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {ledger.map((entry: any) => {
                const type = entry.movementType || entry.type || "TRANSFER";
                const isOutflow = OUTFLOW_TYPES.includes(type);
                const qty = parseFloat(String(entry.quantity ?? "0"));
                const balance = entry.runningBalance != null ? parseFloat(String(entry.runningBalance)) : null;

                return (
                  <tr key={entry.id} className="hover:bg-zinc-50 transition-colors border-b border-zinc-100/80 last:border-0">
                    <td className="px-4 py-3 border-r border-zinc-100 text-zinc-400 whitespace-nowrap">
                      {new Date(entry.createdAt || entry.created_at).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                      <span className="block text-[10px] text-zinc-400">
                        {new Date(entry.createdAt || entry.created_at).toLocaleTimeString("en-KE", { timeStyle: "short" })}
                      </span>
                    </td>
                    <td className="p-4 border-r border-zinc-100 font-sans font-semibold text-black">
                      {entry.product?.name || entry.product_name || "—"}
                      {(entry.product?.sku || entry.sku) && (
                        <span className="block text-[10px] text-zinc-400 font-mono">
                          {entry.product?.sku || entry.sku}
                        </span>
                      )}
                    </td>
                    <td className="p-4 border-r border-zinc-100">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold uppercase ${MOVEMENT_COLORS[type] || "bg-zinc-100 text-zinc-600 border-zinc-200"}`}>
                        {MOVEMENT_LABELS[type] || type}
                      </span>
                    </td>
                    <td className="p-4 border-r border-zinc-100 text-zinc-600">
                      {entry.location?.name || entry.location_name || <span className="text-zinc-400 italic">Default</span>}
                    </td>
                    <td className={`p-4 border-r border-zinc-100 font-semibold text-right ${isOutflow ? "text-rose-700" : "text-emerald-700"}`}>
                      {isOutflow ? "-" : "+"}{qty.toFixed(2)}
                    </td>
                    <td className="p-4 border-r border-zinc-100 text-right text-zinc-600">
                      {entry.unitCost != null ? parseFloat(String(entry.unitCost)).toFixed(2) : "—"}
                    </td>
                    <td className="p-4 border-r border-zinc-100 font-semibold text-right text-black">
                      {balance != null ? balance.toFixed(2) : "—"}
                    </td>
                    <td className="p-4 text-zinc-500 max-w-xs truncate">{entry.notes || "—"}</td>
                  </tr>
                );
              })}
              {ledger.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-zinc-400 italic font-sans text-xs">
                    No stock movements recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
