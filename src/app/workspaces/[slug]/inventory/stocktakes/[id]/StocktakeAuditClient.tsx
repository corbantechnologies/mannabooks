"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Search,
  Check,
  TrendingDown,
  TrendingUp,
  Warehouse,
  Clock,
  Sparkles,
  FileCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateStocktakeItemCountAction, reconcileStocktakeAction } from "@/lib/actions/stocktake";

interface StocktakeItem {
  id: string;
  stocktakeId: string;
  productId: string;
  bookQuantity: string;
  countedQuantity: string;
  varianceQuantity: string;
  varianceCostKes: string;
  notes: string | null;
  product: {
    id: string;
    name: string;
    sku: string | null;
    costPrice: string | null;
    unitPrice: string | null;
  };
}

interface StocktakeAuditClientProps {
  shopId: string;
  shopSlug: string;
  stocktake: any;
}

export function StocktakeAuditClient({
  shopId,
  shopSlug,
  stocktake,
}: StocktakeAuditClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [items, setItems] = useState<StocktakeItem[]>(stocktake.items || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "VARIANCES" | "SHORTAGES" | "SURPLUSES">("ALL");

  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [reconcileError, setReconcileError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const isCompleted = stocktake.status === "COMPLETED";

  // Handle local change & sync to server
  const handleCountChange = (itemId: string, newCountStr: string) => {
    // 1. Optimistic local update
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const countNum = newCountStr === "" ? 0 : Number(newCountStr);
        const book = Number(item.bookQuantity) || 0;
        const diff = countNum - book;
        const unitCost = Number(item.product.costPrice || item.product.unitPrice || 0);
        return {
          ...item,
          countedQuantity: newCountStr,
          varianceQuantity: String(diff.toFixed(2)),
          varianceCostKes: String((diff * unitCost).toFixed(2)),
        };
      })
    );

    // 2. Persist to server
    updateStocktakeItemCountAction({
      stocktakeId: stocktake.id,
      itemId,
      countedQuantity: newCountStr === "" ? 0 : Number(newCountStr),
    });
  };

  const handleNotesChange = (itemId: string, notes: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, notes } : item))
    );
    updateStocktakeItemCountAction({
      stocktakeId: stocktake.id,
      itemId,
      countedQuantity: Number(items.find((i) => i.id === itemId)?.countedQuantity || 0),
      notes,
    });
  };

  const handleReconcile = () => {
    setReconcileError(null);
    startTransition(async () => {
      const res = await reconcileStocktakeAction(shopId, stocktake.id);
      if (res.success) {
        setIsReconcileModalOpen(false);
        setSuccessToast(
          `Stocktake reconciled successfully! Adjusted ${res.totalAdjustmentCount} variance items in warehouse ledger.`
        );
        router.refresh();
      } else {
        setReconcileError(res.error || "Failed to finalize stocktake.");
      }
    });
  };

  // Calculations
  const stats = useMemo(() => {
    let totalBookQty = 0;
    let totalCountedQty = 0;
    let netVarianceQty = 0;
    let netVarianceCostKes = 0;
    let varianceCount = 0;

    for (const item of items) {
      const book = Number(item.bookQuantity) || 0;
      const counted = Number(item.countedQuantity) || 0;
      const vQty = Number(item.varianceQuantity) || 0;
      const vCost = Number(item.varianceCostKes) || 0;

      totalBookQty += book;
      totalCountedQty += counted;
      netVarianceQty += vQty;
      netVarianceCostKes += vCost;
      if (Math.abs(vQty) > 0.001) varianceCount++;
    }

    return {
      totalBookQty,
      totalCountedQty,
      netVarianceQty,
      netVarianceCostKes,
      varianceCount,
    };
  }, [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.product.sku && item.product.sku.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      const v = Number(item.varianceQuantity) || 0;
      if (filterType === "VARIANCES") return Math.abs(v) > 0.001;
      if (filterType === "SHORTAGES") return v < -0.001;
      if (filterType === "SURPLUSES") return v > 0.001;
      return true;
    });
  }, [items, searchQuery, filterType]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/workspaces/${shopSlug}/inventory/stocktakes`}
              className="text-zinc-500 hover:text-black transition p-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
              Audit Sheet #{stocktake.stocktakeNumber}
            </span>
            {isCompleted ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800">
                RECONCILED &amp; CLOSED
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-100 text-amber-800 animate-pulse">
                IN PROGRESS
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-black">
            Physical Inventory Count: {stocktake.location?.name}
          </h1>
          <p className="text-xs text-zinc-500 font-sans mt-0.5">
            Conducted by {stocktake.conductedBy?.name || stocktake.conductedBy?.email} &bull; Started:{" "}
            {new Date(stocktake.startedAt).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-zinc-300 rounded-md text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Count Sheet
          </button>

          {!isCompleted && (
            <button
              onClick={() => {
                setReconcileError(null);
                setIsReconcileModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-sm transition"
            >
              <FileCheck className="w-3.5 h-3.5" />
              Reconcile &amp; Post Variances
            </button>
          )}
        </div>
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          {successToast}
        </div>
      )}

      {/* Audit Stats Metric Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-lg p-3">
          <span className="text-[10px] font-mono uppercase text-zinc-500 block">Catalog Scope</span>
          <span className="text-lg font-bold font-mono text-zinc-900">{items.length} Products</span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-3">
          <span className="text-[10px] font-mono uppercase text-zinc-500 block">Discrepancy Items</span>
          <span
            className={`text-lg font-bold font-mono ${
              stats.varianceCount > 0 ? "text-amber-600" : "text-emerald-600"
            }`}
          >
            {stats.varianceCount} items
          </span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-3">
          <span className="text-[10px] font-mono uppercase text-zinc-500 block">Net Qty Variance</span>
          <span
            className={`text-lg font-bold font-mono ${
              stats.netVarianceQty < 0
                ? "text-red-600"
                : stats.netVarianceQty > 0
                ? "text-emerald-600"
                : "text-zinc-900"
            }`}
          >
            {stats.netVarianceQty > 0 ? `+${stats.netVarianceQty.toFixed(2)}` : stats.netVarianceQty.toFixed(2)}
          </span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-3">
          <span className="text-[10px] font-mono uppercase text-zinc-500 block">Net Discrepancy Value</span>
          <span
            className={`text-lg font-bold font-mono ${
              stats.netVarianceCostKes < 0
                ? "text-red-600"
                : stats.netVarianceCostKes > 0
                ? "text-emerald-600"
                : "text-zinc-900"
            }`}
          >
            KES {stats.netVarianceCostKes.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search items by product or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-zinc-300 rounded text-xs focus:ring-1 focus:ring-black"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(["ALL", "VARIANCES", "SHORTAGES", "SURPLUSES"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterType(mode)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold tracking-wide transition ${
                filterType === mode
                  ? "bg-black text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Main Count Table */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 font-mono uppercase text-[10px] text-zinc-500">
                <th className="py-2.5 px-3">Product Name &amp; SKU</th>
                <th className="py-2.5 px-3 text-right">Book (System)</th>
                <th className="py-2.5 px-3 text-right w-36">Counted (Physical)</th>
                <th className="py-2.5 px-3 text-right">Variance Qty</th>
                <th className="py-2.5 px-3 text-right">Discrepancy (KES)</th>
                <th className="py-2.5 px-3">Audit Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredItems.map((item) => {
                const book = Number(item.bookQuantity) || 0;
                const counted = Number(item.countedQuantity) || 0;
                const vQty = Number(item.varianceQuantity) || 0;
                const vCost = Number(item.varianceCostKes) || 0;

                return (
                  <tr
                    key={item.id}
                    className={`transition hover:bg-zinc-50/70 ${
                      Math.abs(vQty) > 0.001
                        ? vQty < 0
                          ? "bg-red-50/30"
                          : "bg-emerald-50/30"
                        : ""
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-semibold text-zinc-900">{item.product.name}</div>
                      <div className="text-[10px] font-mono text-zinc-400">
                        {item.product.sku || "NO-SKU"} &bull; Cost: KES{" "}
                        {Number(item.product.costPrice || item.product.unitPrice || 0).toFixed(2)}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-semibold text-zinc-600">
                      {book.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-right">
                      {isCompleted ? (
                        <span className="font-mono font-bold text-zinc-900">
                          {counted.toLocaleString()}
                        </span>
                      ) : (
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="0"
                          value={item.countedQuantity}
                          onChange={(e) => handleCountChange(item.id, e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="w-28 text-right border border-zinc-300 rounded px-2 py-1 font-mono font-bold text-xs focus:ring-1 focus:ring-black bg-white"
                        />
                      )}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold">
                      {vQty === 0 ? (
                        <span className="text-zinc-400">0.00</span>
                      ) : vQty > 0 ? (
                        <span className="text-emerald-600 inline-flex items-center gap-0.5">
                          <TrendingUp className="w-3 h-3" />+{vQty.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-red-600 inline-flex items-center gap-0.5">
                          <TrendingDown className="w-3 h-3" />
                          {vQty.toFixed(2)}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right font-mono">
                      {vCost === 0 ? (
                        <span className="text-zinc-400">KES 0.00</span>
                      ) : (
                        <span
                          className={`font-semibold ${
                            vCost < 0 ? "text-red-600" : "text-emerald-600"
                          }`}
                        >
                          KES {vCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {isCompleted ? (
                        <span className="text-[11px] text-zinc-500">{item.notes || "—"}</span>
                      ) : (
                        <input
                          type="text"
                          placeholder="e.g. Broken packaging / shelf 3B"
                          value={item.notes || ""}
                          onChange={(e) => handleNotesChange(item.id, e.target.value)}
                          className="w-full border border-zinc-200 rounded px-2 py-1 text-[11px]"
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECONCILE MODAL */}
      {isReconcileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-zinc-200 overflow-hidden">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div>
                <h3 className="font-bold text-zinc-900 text-sm">Post Stocktake Reconciliation</h3>
                <p className="text-xs text-zinc-500">Atomic inventory journals and shrinkage write-offs</p>
              </div>
              <button
                onClick={() => setIsReconcileModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 text-lg font-mono p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              {reconcileError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
                  {reconcileError}
                </div>
              )}

              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Audited Scope:</span>
                  <span className="font-semibold text-zinc-900">{items.length} Products</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Discrepancy Items:</span>
                  <span className="font-semibold text-amber-600">{stats.varianceCount} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Net Quantity Variance:</span>
                  <span className="font-semibold text-zinc-900">{stats.netVarianceQty.toFixed(2)} units</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-zinc-200">
                  <span className="text-zinc-700 font-bold">Net Financial Variance:</span>
                  <span className="font-bold text-zinc-900">
                    KES {stats.netVarianceCostKes.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-amber-800">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <p className="text-[11px]">
                  Confirming reconciliation will automatically generate <code>ADJUSTMENT_IN</code> or{" "}
                  <code>ADJUSTMENT_OUT</code> entries in the stock ledger for every variance item, updating on-hand warehouse
                  balances and locking this audit session permanently.
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReconcileModalOpen(false)}
                  className="px-3 py-1.5 border border-zinc-300 rounded text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleReconcile}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isPending ? "Reconciling..." : "Confirm & Post Adjustments"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
