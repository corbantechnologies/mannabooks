"use client";
// src/app/workspaces/[slug]/inventory/locations/[id]/LocationDetailClientView.tsx

import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateStockLocation, deleteStockLocation } from "@/lib/actions/inventory";
import { toast } from "react-hot-toast";
import { ConfirmModal } from "@/components/ConfirmModal";

interface StockItem {
  productId: string;
  name: string;
  sku: string | null;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  reorderThreshold: number;
  totalValue: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
}

interface LocationDetailProps {
  shopId: string;
  shopSlug: string;
  shopCurrency: string;
  location: {
    id: string;
    name: string;
    code: string | null;
    isDefault: boolean;
    isActive: boolean;
    createdAt: Date;
  };
  metrics: {
    totalProducts: number;
    totalUnits: number;
    totalValuation: number;
    lowStockCount: number;
    outOfStockCount: number;
    movementsCount: number;
    transfersCount: number;
  };
  items: StockItem[];
  recentMovements: any[];
  transfers: any[];
}

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
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

const MOVEMENT_TYPE_COLORS: Record<string, string> = {
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

export function LocationDetailClientView({
  shopId,
  shopSlug,
  shopCurrency,
  location,
  metrics,
  items,
  recentMovements,
  transfers,
}: LocationDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"inventory" | "movements" | "transfers">("inventory");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">("ALL");

  // Edit Location Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [name, setName] = useState(location.name);
  const [code, setCode] = useState(location.code || "");
  const [isDefault, setIsDefault] = useState(location.isDefault);
  const [loading, setLoading] = useState(false);

  async function handleUpdateLocation(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Location name is required.");
    setLoading(true);

    const res = await updateStockLocation({
      locationId: location.id,
      shopId,
      shopSlug,
      name,
      code,
      isDefault,
      isActive: location.isActive,
    });

    if (res.success) {
      toast.success("Location updated.");
      setShowEditModal(false);
      router.refresh();
    } else {
      toast.error(res.error || "Update failed.");
    }
    setLoading(false);
  }

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirmDelete() {
    setIsDeleting(true);
    const toastId = toast.loading(`Deleting location "${location.name}"...`);
    const res = await deleteStockLocation(location.id, shopSlug);
    setIsDeleting(false);
    if (res.success) {
      toast.success("Location deleted.", { id: toastId });
      setShowDeleteConfirm(false);
      router.push(`/workspaces/${shopSlug}/inventory/locations`);
    } else {
      toast.error(res.error || "Delete failed.", { id: toastId });
    }
  }

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === "IN_STOCK") return item.quantity > item.reorderThreshold;
      if (statusFilter === "LOW_STOCK") return item.isLowStock;
      if (statusFilter === "OUT_OF_STOCK") return item.isOutOfStock;

      return true;
    });
  }, [items, searchQuery, statusFilter]);

  return (
    <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white font-mono text-xs">

      {/* BREADCRUMB & HEADER */}
      <div className="space-y-3 border-b border-zinc-200/80 pb-6">
        <Link
          href={`/workspaces/${shopSlug}/inventory/locations`}
          className="text-zinc-500 hover:text-black transition-colors inline-flex items-center gap-1 font-semibold uppercase text-[10px]"
        >
          ← Back to Stock Locations
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold uppercase tracking-tight text-black font-sans">
                🏢 {location.name}
              </h1>
              {location.code && (
                <span className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded border border-zinc-200 font-semibold text-[10px]">
                  {location.code}
                </span>
              )}
              {location.isDefault && (
                <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded font-semibold uppercase">
                  DEFAULT HUB
                </span>
              )}
              <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold uppercase ${
                location.isActive ? "bg-emerald-100 text-emerald-900 border-emerald-300" : "bg-zinc-100 text-zinc-400 border-zinc-200"
              }`}>
                {location.isActive ? "ACTIVE" : "ARCHIVED"}
              </span>
            </div>
            <p className="font-sans text-xs text-zinc-600">
              Location statistics, on-hand product inventory, valuation, and stock movements.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/workspaces/${shopSlug}/inventory/adjustments`}
              className="border border-zinc-300 hover:border-black bg-white text-black px-3.5 py-2 font-mono text-xs font-semibold uppercase rounded transition-colors"
            >
              + Adjust Stock
            </Link>
            <Link
              href={`/workspaces/${shopSlug}/inventory/transfers/new`}
              className="bg-black text-white hover:bg-zinc-800 px-4 py-2 font-mono text-xs font-semibold uppercase rounded transition-colors"
            >
              + Transfer Stock
            </Link>
            <button
              onClick={() => setShowEditModal(true)}
              className="border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 px-3 py-2 font-mono text-xs font-semibold uppercase rounded transition-colors"
            >
              Edit Location
            </button>
            {!location.isDefault && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2 font-mono text-xs font-semibold uppercase rounded transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI STATISTICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card-modern p-5 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Total Products</p>
          <p className="text-xl font-semibold font-mono text-black">{metrics.totalProducts}</p>
          <p className="text-[10px] text-zinc-500">distinct SKUs</p>
        </div>

        <div className="card-modern p-5 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">On-Hand Units</p>
          <p className="text-xl font-semibold font-mono text-black">{metrics.totalUnits.toFixed(2)}</p>
          <p className="text-[10px] text-zinc-500">total stock quantity</p>
        </div>

        <div className="card-modern p-5 space-y-1 border-emerald-200 bg-emerald-50/40">
          <p className="text-[10px] text-emerald-800 uppercase font-semibold">Location Stock Value</p>
          <p className="text-xl font-semibold font-mono text-emerald-700">{formatCurrency(metrics.totalValuation, shopCurrency)}</p>
          <p className="text-[10px] text-emerald-700">inventory valuation</p>
        </div>

        <div className={`card-modern p-5 space-y-1 ${metrics.lowStockCount > 0 ? "border-amber-300 bg-amber-50" : ""}`}>
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Low Stock Alerts</p>
          <p className={`text-xl font-semibold font-mono ${metrics.lowStockCount > 0 ? "text-amber-900" : "text-black"}`}>
            {metrics.lowStockCount}
          </p>
          <p className="text-[10px] text-zinc-500">at / below threshold</p>
        </div>

        <div className={`card-modern p-5 space-y-1 ${metrics.outOfStockCount > 0 ? "border-rose-300 bg-rose-50" : ""}`}>
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Out of Stock</p>
          <p className={`text-xl font-semibold font-mono ${metrics.outOfStockCount > 0 ? "text-rose-800" : "text-black"}`}>
            {metrics.outOfStockCount}
          </p>
          <p className="text-[10px] text-zinc-500">zero balance</p>
        </div>

        <div className="card-modern p-5 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Logged Movements</p>
          <p className="text-xl font-semibold font-mono text-black">{metrics.movementsCount}</p>
          <p className="text-[10px] text-zinc-500">audit ledger records</p>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-zinc-200 gap-6">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`pb-3 font-mono text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px ${
            activeTab === "inventory"
              ? "border-black text-black"
              : "border-transparent text-zinc-400 hover:text-zinc-700"
          }`}
        >
          📦 Stock Inventory ({items.length})
        </button>

        <button
          onClick={() => setActiveTab("movements")}
          className={`pb-3 font-mono text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px ${
            activeTab === "movements"
              ? "border-black text-black"
              : "border-transparent text-zinc-400 hover:text-zinc-700"
          }`}
        >
          📜 Movement Ledger ({recentMovements.length})
        </button>

        <button
          onClick={() => setActiveTab("transfers")}
          className={`pb-3 font-mono text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px ${
            activeTab === "transfers"
              ? "border-black text-black"
              : "border-transparent text-zinc-400 hover:text-zinc-700"
          }`}
        >
          🔄 Transfers ({transfers.length})
        </button>
      </div>

      {/* TAB 1: STOCK INVENTORY */}
      {activeTab === "inventory" && (
        <div className="space-y-4">
          {/* SEARCH & FILTERS */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name or SKU..."
              className="px-3.5 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black font-sans text-xs w-full sm:max-w-xs"
            />

            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Filter:</span>
              {[
                { label: "All Items", value: "ALL" },
                { label: "In Stock", value: "IN_STOCK" },
                { label: "Low Stock", value: "LOW_STOCK" },
                { label: "Out of Stock", value: "OUT_OF_STOCK" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value as any)}
                  className={`px-2.5 py-1 rounded text-[10px] font-semibold uppercase transition-colors ${
                    statusFilter === f.value
                      ? "bg-black text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* INVENTORY TABLE */}
          <div className="card-modern overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
                  <th className="p-4 border-r border-zinc-200">Product</th>
                  <th className="p-4 border-r border-zinc-200">SKU</th>
                  <th className="p-4 border-r border-zinc-200 text-right">Selling Price</th>
                  <th className="p-4 border-r border-zinc-200 text-right">Cost Price</th>
                  <th className="p-4 border-r border-zinc-200 text-right">Location Qty</th>
                  <th className="p-4 border-r border-zinc-200 text-right">Location Value</th>
                  <th className="p-4 border-r border-zinc-200 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 bg-white">
                {filteredItems.map((item) => (
                  <tr key={item.productId} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="p-4 border-r border-zinc-200/80 font-sans font-semibold text-black text-sm">
                      {item.name}
                    </td>
                    <td className="p-4 border-r border-zinc-200/80 text-zinc-600 font-mono uppercase">
                      {item.sku || <span className="text-zinc-300 italic font-normal lowercase">unassigned</span>}
                    </td>
                    <td className="p-4 border-r border-zinc-200/80 text-right font-semibold text-black">
                      {formatCurrency(item.unitPrice, shopCurrency)}
                    </td>
                    <td className="p-4 border-r border-zinc-200/80 text-right text-zinc-500">
                      {item.costPrice > 0 ? formatCurrency(item.costPrice, shopCurrency) : "—"}
                    </td>
                    <td className="p-4 border-r border-zinc-200/80 text-right font-bold text-sm text-black">
                      {item.quantity.toFixed(2)}
                    </td>
                    <td className="p-4 border-r border-zinc-200/80 text-right font-semibold text-emerald-700">
                      {formatCurrency(item.totalValue, shopCurrency)}
                    </td>
                    <td className="p-4 border-r border-zinc-200/80 text-center">
                      {item.isOutOfStock ? (
                        <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded font-semibold text-[10px] uppercase">
                          Out of Stock
                        </span>
                      ) : item.isLowStock ? (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-semibold text-[10px] uppercase">
                          Low Stock (≤{item.reorderThreshold})
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded font-semibold text-[10px] uppercase">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <Link
                        href={`/workspaces/${shopSlug}/inventory/adjustments`}
                        className="border border-zinc-300 px-2.5 py-1 text-[10px] font-semibold uppercase rounded hover:border-black hover:bg-zinc-50 transition-colors"
                      >
                        Adjust
                      </Link>
                    </td>
                  </tr>
                ))}

                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-zinc-400 italic font-sans text-xs">
                      No products found matching the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MOVEMENT LEDGER */}
      {activeTab === "movements" && (
        <div className="space-y-4">
          <div className="card-modern overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
                  <th className="p-4 border-r border-zinc-200">Date & Time</th>
                  <th className="p-4 border-r border-zinc-200">Product</th>
                  <th className="p-4 border-r border-zinc-200">Movement Type</th>
                  <th className="p-4 border-r border-zinc-200 text-right">Quantity</th>
                  <th className="p-4 border-r border-zinc-200 text-right">Balance After</th>
                  <th className="p-4 border-r border-zinc-200">User / Created By</th>
                  <th className="p-4">Notes / Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 bg-white">
                {recentMovements.map((entry: any) => {
                  const isOutflow = ["SALE", "ADJUSTMENT_OUT", "TRANSFER_OUT", "VOID"].includes(entry.movementType);
                  return (
                    <tr key={entry.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="p-4 border-r border-zinc-200/80 text-zinc-500 whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                        <span className="block text-[10px] text-zinc-400">
                          {new Date(entry.createdAt).toLocaleTimeString("en-KE", { timeStyle: "short" })}
                        </span>
                      </td>
                      <td className="p-4 border-r border-zinc-200/80 font-sans font-semibold text-black text-sm">
                        {entry.product?.name || "—"}
                        {entry.product?.sku && (
                          <span className="block text-[10px] text-zinc-400 font-mono">{entry.product.sku}</span>
                        )}
                      </td>
                      <td className="p-4 border-r border-zinc-200/80">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold uppercase ${MOVEMENT_TYPE_COLORS[entry.movementType] || "bg-zinc-100 text-zinc-500 border-zinc-200"}`}>
                          {MOVEMENT_TYPE_LABELS[entry.movementType] || entry.movementType}
                        </span>
                      </td>
                      <td className={`p-4 border-r border-zinc-200/80 font-semibold text-right ${isOutflow ? "text-rose-700" : "text-emerald-700"}`}>
                        {isOutflow ? "-" : "+"}{parseFloat(entry.quantity).toFixed(2)}
                      </td>
                      <td className="p-4 border-r border-zinc-200/80 font-semibold text-right text-black">
                        {entry.runningBalance !== null ? parseFloat(entry.runningBalance).toFixed(2) : "—"}
                      </td>
                      <td className="p-4 border-r border-zinc-200/80 text-zinc-600 font-sans">
                        {entry.createdBy?.name || "System"}
                      </td>
                      <td className="p-4 text-zinc-500">
                        {entry.notes || <span className="text-zinc-300 italic">None</span>}
                      </td>
                    </tr>
                  );
                })}

                {recentMovements.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-zinc-400 italic font-sans text-xs">
                      No stock movements recorded for this location yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSFERS */}
      {activeTab === "transfers" && (
        <div className="space-y-4">
          <div className="card-modern overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
                  <th className="p-4 border-r border-zinc-200">Direction</th>
                  <th className="p-4 border-r border-zinc-200">Origin / Source</th>
                  <th className="p-4 border-r border-zinc-200">Destination</th>
                  <th className="p-4 border-r border-zinc-200 text-center">Status</th>
                  <th className="p-4 border-r border-zinc-200 text-center">Items Count</th>
                  <th className="p-4 border-r border-zinc-200">Date Initiated</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 bg-white">
                {transfers.map((t: any) => {
                  const isOutbound = t.fromLocationId === location.id;
                  return (
                    <tr key={t.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="p-4 border-r border-zinc-200/80">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold uppercase ${
                          isOutbound ? "bg-purple-100 text-purple-900 border-purple-300" : "bg-indigo-100 text-indigo-900 border-indigo-300"
                        }`}>
                          {isOutbound ? "↗ OUTBOUND" : "↙ INBOUND"}
                        </span>
                      </td>
                      <td className="p-4 border-r border-zinc-200/80 font-sans font-semibold text-black">
                        {t.fromLocation?.name || "—"}
                      </td>
                      <td className="p-4 border-r border-zinc-200/80 font-sans font-semibold text-black">
                        {t.toLocation?.name || "—"}
                      </td>
                      <td className="p-4 border-r border-zinc-200/80 text-center">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold uppercase ${
                          t.status === "COMPLETED" ? "bg-emerald-100 text-emerald-900 border-emerald-300" :
                          t.status === "IN_TRANSIT" ? "bg-amber-100 text-amber-900 border-amber-300" :
                          t.status === "CANCELLED" ? "bg-rose-100 text-rose-900 border-rose-300" :
                          "bg-zinc-100 text-zinc-700 border-zinc-300"
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="p-4 border-r border-zinc-200/80 text-center font-semibold text-black">
                        {t.items?.length || 0} product(s)
                      </td>
                      <td className="p-4 border-r border-zinc-200/80 text-zinc-500">
                        {new Date(t.createdAt).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                      </td>
                      <td className="p-4 text-center">
                        <Link
                          href={`/workspaces/${shopSlug}/inventory/transfers`}
                          className="text-[10px] font-semibold uppercase text-black hover:underline"
                        >
                          View Transfer →
                        </Link>
                      </td>
                    </tr>
                  );
                })}

                {transfers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-zinc-400 italic font-sans text-xs">
                      No transfers recorded for this location yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-2xl w-full max-w-md p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-sans font-bold text-base uppercase tracking-tight">Edit Location</h2>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-400 hover:text-black text-lg leading-none">✕</button>
            </div>

            <form onSubmit={handleUpdateLocation} className="space-y-5">
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1.5">Location Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black font-sans text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1.5">
                  Location Code <span className="font-normal italic">Optional</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2.5 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black font-mono text-sm uppercase"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 accent-black"
                />
                <span className="font-sans text-sm text-black font-medium">Set as Default Location</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-black text-white py-2.5 rounded font-mono text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Saving…" : "Update Location"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 border border-zinc-300 rounded hover:bg-zinc-50 font-mono text-xs font-semibold uppercase text-zinc-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Stock Location"
        message={`Are you sure you want to delete "${location.name}"? Past historical stock movements will be preserved, but this location will no longer be available for transactions or transfers.`}
        confirmLabel="Delete Location"
        variant="danger"
        isLoading={isDeleting}
      />

    </div>
  );
}
