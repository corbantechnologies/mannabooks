"use client";

import { useState, useTransition } from "react";
import { formatCurrency } from "@/lib/utils";
import { createProductBatchAction } from "@/lib/actions/wms";
import { toast } from "react-hot-toast";
import { Spinner } from "@/components/Spinner";
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  DollarSign,
  Plus,
  X,
  Check,
  Package,
  Calendar,
  Layers,
} from "lucide-react";

interface ExpiryRiskClientProps {
  shopId: string;
  shopSlug: string;
  currency: string;
  report: {
    critical: any[];
    warning: any[];
    notice: any[];
    totalAtRiskKes: number;
  };
  products: any[];
  locations: any[];
  bins: any[];
}

export function ExpiryRiskClient({
  shopId,
  shopSlug,
  currency,
  report,
  products,
  locations,
  bins,
}: ExpiryRiskClientProps) {
  const [activeTier, setActiveTier] = useState<"CRITICAL" | "WARNING" | "NOTICE" | "ALL">("ALL");
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Add Batch Form
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [locationId, setLocationId] = useState(locations[0]?.id || "");
  const [binId, setBinId] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [manufactureDate, setManufactureDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [costPrice, setCostPrice] = useState("");

  const allBatches = [...report.critical, ...report.warning, ...report.notice];

  const displayedBatches =
    activeTier === "CRITICAL"
      ? report.critical
      : activeTier === "WARNING"
      ? report.warning
      : activeTier === "NOTICE"
      ? report.notice
      : allBatches;

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !locationId || !batchNumber.trim() || !expiryDate || !quantity) {
      toast.error("Please fill in all required batch fields.");
      return;
    }

    startTransition(async () => {
      const res = await createProductBatchAction({
        shopId,
        productId,
        locationId,
        binId: binId || undefined,
        batchNumber: batchNumber.trim(),
        manufactureDate: manufactureDate || undefined,
        expiryDate,
        quantity: parseFloat(quantity) || 0,
        costPrice: parseFloat(costPrice) || 0,
      });

      if (res.success) {
        toast.success(`Batch ${batchNumber.trim()} registered with FEFO tracking!`);
        setShowAddBatchModal(false);
        setBatchNumber("");
        setQuantity("");
        setCostPrice("");
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to register batch.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* SEVERITY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTier("CRITICAL")}
          className={`card-modern p-4 border transition-all cursor-pointer ${
            activeTier === "CRITICAL"
              ? "border-red-600 bg-red-50/50 ring-1 ring-red-600"
              : "border-red-200 bg-red-50/20 hover:border-red-400"
          }`}
        >
          <div className="flex items-center gap-1.5 text-red-700 font-mono text-[10px] font-bold uppercase">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Critical (&lt; 30 Days)</span>
          </div>
          <span className="text-2xl font-bold font-sans text-red-950 mt-1 block">
            {report.critical.length} Batches
          </span>
          <span className="text-[11px] font-mono font-semibold text-red-800 block mt-0.5">
            {formatCurrency(
              report.critical.reduce((sum, b) => sum + b.totalValueKes, 0),
              currency
            )}{" "}
            at risk
          </span>
        </div>

        <div
          onClick={() => setActiveTier("WARNING")}
          className={`card-modern p-4 border transition-all cursor-pointer ${
            activeTier === "WARNING"
              ? "border-amber-600 bg-amber-50/50 ring-1 ring-amber-600"
              : "border-amber-200 bg-amber-50/20 hover:border-amber-400"
          }`}
        >
          <div className="flex items-center gap-1.5 text-amber-700 font-mono text-[10px] font-bold uppercase">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Warning (30–60 Days)</span>
          </div>
          <span className="text-2xl font-bold font-sans text-amber-950 mt-1 block">
            {report.warning.length} Batches
          </span>
          <span className="text-[11px] font-mono font-semibold text-amber-800 block mt-0.5">
            {formatCurrency(
              report.warning.reduce((sum, b) => sum + b.totalValueKes, 0),
              currency
            )}{" "}
            at risk
          </span>
        </div>

        <div
          onClick={() => setActiveTier("NOTICE")}
          className={`card-modern p-4 border transition-all cursor-pointer ${
            activeTier === "NOTICE"
              ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600"
              : "border-blue-200 bg-blue-50/20 hover:border-blue-400"
          }`}
        >
          <div className="flex items-center gap-1.5 text-blue-700 font-mono text-[10px] font-bold uppercase">
            <Clock className="w-3.5 h-3.5" />
            <span>Notice (60–90 Days)</span>
          </div>
          <span className="text-2xl font-bold font-sans text-blue-950 mt-1 block">
            {report.notice.length} Batches
          </span>
          <span className="text-[11px] font-mono font-semibold text-blue-800 block mt-0.5">
            {formatCurrency(
              report.notice.reduce((sum, b) => sum + b.totalValueKes, 0),
              currency
            )}{" "}
            valuation
          </span>
        </div>

        <div
          onClick={() => setActiveTier("ALL")}
          className={`card-modern p-4 border transition-all cursor-pointer ${
            activeTier === "ALL"
              ? "border-black bg-zinc-50 ring-1 ring-black"
              : "border-zinc-200 bg-white hover:border-black"
          }`}
        >
          <div className="flex items-center gap-1.5 text-zinc-600 font-mono text-[10px] font-bold uppercase">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Total Value At Risk</span>
          </div>
          <span className="text-2xl font-bold font-mono text-black mt-1 block">
            {formatCurrency(report.totalAtRiskKes, currency)}
          </span>
          <span className="text-[11px] text-zinc-400 block mt-0.5">
            Across {allBatches.length} tracked batches
          </span>
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
        <span className="font-mono text-[10px] uppercase font-bold text-zinc-500">
          Showing: {activeTier} Expiry Stream ({displayedBatches.length} items)
        </span>

        <button
          type="button"
          onClick={() => setShowAddBatchModal(true)}
          className="bg-black hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Register New Batch</span>
        </button>
      </div>

      {/* BATCHES TABLE */}
      <div className="card-modern bg-white overflow-hidden border border-zinc-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-zinc-100/60 border-b border-zinc-200 text-zinc-500 font-mono text-[10px] uppercase">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Batch #</th>
                <th className="py-2.5 px-4 font-semibold">Product</th>
                <th className="py-2.5 px-4 font-semibold">Location &amp; Bin</th>
                <th className="py-2.5 px-4 font-semibold">Expiry Date &amp; Horizon</th>
                <th className="py-2.5 px-4 font-semibold text-right">Units</th>
                <th className="py-2.5 px-4 font-semibold text-right">Valuation ({currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70">
              {displayedBatches.map((b) => (
                <tr key={b.id} className="hover:bg-zinc-50/50">
                  <td className="py-3 px-4 font-mono font-bold text-black">
                    <span className="border border-zinc-300 bg-zinc-50 px-2 py-0.5 rounded text-[11px]">
                      {b.batchNumber}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-black">
                    <p>{b.product?.name || "Product"}</p>
                    {b.product?.sku && (
                      <p className="text-[10px] text-zinc-400 font-mono">SKU: {b.product.sku}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-zinc-600 text-xs">
                    <p className="font-semibold text-black">{b.location?.name || "Main Store"}</p>
                    {b.bin && (
                      <span className="inline-block mt-0.5 font-mono text-[10px] text-zinc-500 border border-zinc-200 bg-zinc-50 px-1.5 py-0.2 rounded">
                        Bin: {b.bin.binCode}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-mono text-xs font-bold text-black">
                      {new Date(b.expiryDate).toLocaleDateString("en-KE", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase mt-0.5 ${
                        b.daysUntilExpiry <= 0
                          ? "bg-red-100 text-red-900 border border-red-300"
                          : b.daysUntilExpiry <= 30
                          ? "bg-red-50 text-red-800 border border-red-200"
                          : b.daysUntilExpiry <= 60
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-blue-50 text-blue-800 border border-blue-200"
                      }`}
                    >
                      {b.daysUntilExpiry <= 0
                        ? `EXPIRED (${Math.abs(b.daysUntilExpiry)}d ago)`
                        : `${b.daysUntilExpiry} days remaining`}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-black text-xs">
                    {b.quantityNum}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-black text-xs">
                    {formatCurrency(b.totalValueKes, currency)}
                  </td>
                </tr>
              ))}

              {displayedBatches.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-400 italic">
                    No batches found matching this risk tier.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: REGISTER NEW BATCH */}
      {showAddBatchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="card-modern max-w-md w-full bg-white p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <h3 className="font-bold text-sm uppercase tracking-wider text-black flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span>Register Product Batch (FEFO)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddBatchModal(false)}
                className="text-zinc-400 hover:text-black cursor-pointer bg-transparent border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Catalog Product *
                </label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full border border-zinc-300 rounded p-2 text-xs font-sans bg-white focus:outline-black"
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.sku ? `(${p.sku})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Location *
                  </label>
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="w-full border border-zinc-300 rounded p-2 text-xs font-sans bg-white focus:outline-black"
                    required
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Storage Bin / Shelf
                  </label>
                  <select
                    value={binId}
                    onChange={(e) => setBinId(e.target.value)}
                    className="w-full border border-zinc-300 rounded p-2 text-xs font-sans bg-white focus:outline-black"
                  >
                    <option value="">Unassigned Shelf</option>
                    {bins
                      .filter((b) => !locationId || b.locationId === locationId)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.binCode} ({b.zone})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Batch / Lot Number *
                </label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. LOT-2026-08A"
                  className="w-full border border-zinc-300 rounded p-2 text-xs font-mono uppercase font-bold focus:outline-black"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Manufacture Date
                  </label>
                  <input
                    type="date"
                    value={manufactureDate}
                    onChange={(e) => setManufactureDate(e.target.value)}
                    className="w-full border border-zinc-300 rounded p-2 text-xs font-mono focus:outline-black"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Expiration Date *
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full border border-zinc-300 rounded p-2 text-xs font-mono font-bold focus:outline-black"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Initial Units *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full border border-zinc-300 rounded p-2 text-xs font-mono focus:outline-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Unit Cost Price ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-zinc-300 rounded p-2 text-xs font-mono focus:outline-black"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowAddBatchModal(false)}
                  className="px-4 py-2 border border-zinc-300 rounded text-xs font-semibold text-zinc-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-black text-white hover:bg-zinc-800 px-5 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isPending ? <Spinner size={14} /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Batch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
