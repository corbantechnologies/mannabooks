"use client";
// src/app/workspaces/[slug]/inventory/locations/[id]/LocationDetailClientView.tsx

import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateStockLocation, deleteStockLocation } from "@/lib/actions/inventory";
import { createStorageBinAction, deleteStorageBinAction } from "@/lib/actions/wms";
import { toast } from "react-hot-toast";
import { ConfirmModal } from "@/components/ConfirmModal";
import QRCode from "react-qr-code";
import {
  Layers,
  Plus,
  Trash2,
  QrCode,
  Printer,
  X,
  Building2,
  Tag,
} from "lucide-react";

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
  bins?: any[];
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
  bins = [],
  recentMovements,
  transfers,
}: LocationDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"inventory" | "bins" | "movements" | "transfers">("inventory");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">("ALL");

  // Storage Bins State
  const [locationBins, setLocationBins] = useState<any[]>(bins || []);
  const [showAddBinModal, setShowAddBinModal] = useState(false);
  const [printBin, setPrintBin] = useState<any | null>(null);
  const [binSearch, setBinSearch] = useState("");
  const [binZone, setBinZone] = useState("");
  const [binRack, setBinRack] = useState("");
  const [binShelf, setBinShelf] = useState("");
  const [binCode, setBinCode] = useState("");
  const [binDesc, setBinDesc] = useState("");
  const [isBinSubmitting, setIsBinSubmitting] = useState(false);

  // Auto-generate standard bin code when Zone/Rack/Shelf changes
  const handleAutoCode = (z: string, r: string, s: string) => {
    const parts = [z.trim().toUpperCase(), r.trim().toUpperCase(), s.trim().toUpperCase()].filter(Boolean);
    if (parts.length > 0) {
      setBinCode(parts.join("-"));
    }
  };

  async function handleCreateBin(e: React.FormEvent) {
    e.preventDefault();
    if (!binZone.trim() || !binCode.trim()) {
      toast.error("Please fill in zone and bin code.");
      return;
    }

    setIsBinSubmitting(true);
    const res = await createStorageBinAction({
      shopId,
      locationId: location.id,
      zone: binZone.trim(),
      rack: binRack.trim() || undefined,
      shelf: binShelf.trim() || undefined,
      binCode: binCode.trim(),
      description: binDesc.trim() || undefined,
    });
    setIsBinSubmitting(false);

    if (res.success && res.bin) {
      toast.success(`Storage bin ${binCode.trim()} created!`);
      setLocationBins((prev) => [...prev, res.bin]);
      setShowAddBinModal(false);
      setBinZone("");
      setBinRack("");
      setBinShelf("");
      setBinCode("");
      setBinDesc("");
    } else {
      toast.error(res.error || "Failed to create storage bin.");
    }
  }

  async function handleDeleteBin(bin: any) {
    if (!confirm(`Are you sure you want to archive storage bin "${bin.binCode}"?`)) return;
    const res = await deleteStorageBinAction(shopId, bin.id);
    if (res.success) {
      toast.success("Storage bin archived.");
      setLocationBins((prev) => prev.filter((b) => b.id !== bin.id));
    } else {
      toast.error(res.error || "Failed to archive storage bin.");
    }
  }

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
    <div className="p-5 sm:p-7 space-y-6 font-mono text-xs">

      {/* BREADCRUMB & HEADER */}
      <div className="space-y-3 border-b border-zinc-100 pb-6">
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
              onClick={() => setShowAddBinModal(true)}
              className="border border-zinc-300 hover:border-black bg-white text-black px-3.5 py-2 font-mono text-xs font-semibold uppercase rounded transition-colors inline-flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-zinc-500" />
              <span>+ Add Storage Bin</span>
            </button>
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
        <div className="card-modern p-4 sm:p-5 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Total Products</p>
          <p className="text-xl font-semibold font-mono text-black">{metrics.totalProducts}</p>
          <p className="text-[10px] text-zinc-500">distinct SKUs</p>
        </div>

        <div className="card-modern p-4 sm:p-5 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">On-Hand Units</p>
          <p className="text-xl font-semibold font-mono text-black">{metrics.totalUnits.toFixed(2)}</p>
          <p className="text-[10px] text-zinc-500">total stock quantity</p>
        </div>

        <div className="card-modern p-4 sm:p-5 space-y-1 border-emerald-200 bg-emerald-50/40">
          <p className="text-[10px] text-emerald-800 uppercase font-semibold">Location Stock Value</p>
          <p className="text-xl font-semibold font-mono text-emerald-700">{formatCurrency(metrics.totalValuation, shopCurrency)}</p>
          <p className="text-[10px] text-emerald-700">inventory valuation</p>
        </div>

        <div className="card-modern p-4 sm:p-5 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Storage Bins</p>
          <p className="text-xl font-semibold font-mono text-black">{locationBins.length}</p>
          <p className="text-[10px] text-zinc-500">mapped shelves / slots</p>
        </div>

        <div className={`card-modern p-4 sm:p-5 space-y-1 ${metrics.lowStockCount > 0 ? "border-amber-300 bg-amber-50" : ""}`}>
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Low Stock Alerts</p>
          <p className={`text-xl font-semibold font-mono ${metrics.lowStockCount > 0 ? "text-amber-900" : "text-black"}`}>
            {metrics.lowStockCount}
          </p>
          <p className="text-[10px] text-zinc-500">at / below threshold</p>
        </div>

        <div className={`card-modern p-4 sm:p-5 space-y-1 ${metrics.outOfStockCount > 0 ? "border-rose-300 bg-rose-50" : ""}`}>
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Out of Stock</p>
          <p className={`text-xl font-semibold font-mono ${metrics.outOfStockCount > 0 ? "text-rose-800" : "text-black"}`}>
            {metrics.outOfStockCount}
          </p>
          <p className="text-[10px] text-zinc-500">zero balance</p>
        </div>

        <div className="card-modern p-4 sm:p-5 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Logged Movements</p>
          <p className="text-xl font-semibold font-mono text-black">{metrics.movementsCount}</p>
          <p className="text-[10px] text-zinc-500">audit ledger records</p>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-zinc-100 gap-6 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`pb-3 font-mono text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px whitespace-nowrap ${
            activeTab === "inventory"
              ? "border-black text-black"
              : "border-transparent text-zinc-400 hover:text-zinc-700"
          }`}
        >
          📦 Stock Inventory ({items.length})
        </button>

        <button
          onClick={() => setActiveTab("bins")}
          className={`pb-3 font-mono text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px whitespace-nowrap inline-flex items-center gap-1.5 ${
            activeTab === "bins"
              ? "border-black text-black"
              : "border-transparent text-zinc-400 hover:text-zinc-700"
          }`}
        >
          <span>🗄️ Storage Bins &amp; Shelves ({locationBins.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("movements")}
          className={`pb-3 font-mono text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px whitespace-nowrap ${
            activeTab === "movements"
              ? "border-black text-black"
              : "border-transparent text-zinc-400 hover:text-zinc-700"
          }`}
        >
          📜 Movement Ledger ({recentMovements.length})
        </button>

        <button
          onClick={() => setActiveTab("transfers")}
          className={`pb-3 font-mono text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px whitespace-nowrap ${
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
          <div className="surface overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-wide font-semibold text-zinc-400 bg-zinc-50/60">
                  <th className="px-4 py-3 border-r border-zinc-100">Product</th>
                  <th className="px-4 py-3 border-r border-zinc-100">SKU</th>
                  <th className="px-4 py-3 border-r border-zinc-100 text-right">Selling Price</th>
                  <th className="px-4 py-3 border-r border-zinc-100 text-right">Cost Price</th>
                  <th className="px-4 py-3 border-r border-zinc-100 text-right">Location Qty</th>
                  <th className="px-4 py-3 border-r border-zinc-100 text-right">Location Value</th>
                  <th className="px-4 py-3 border-r border-zinc-100 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredItems.map((item) => (
                  <tr key={item.productId} className="hover:bg-zinc-50 transition-colors border-b border-zinc-100/80 last:border-0">
                    <td className="p-4 border-r border-zinc-100 font-sans font-semibold text-black text-sm">
                      {item.name}
                    </td>
                    <td className="p-4 border-r border-zinc-100 text-zinc-600 font-mono uppercase">
                      {item.sku || <span className="text-zinc-300 italic font-normal lowercase">unassigned</span>}
                    </td>
                    <td className="p-4 border-r border-zinc-100 text-right font-semibold text-black">
                      {formatCurrency(item.unitPrice, shopCurrency)}
                    </td>
                    <td className="p-4 border-r border-zinc-100 text-right text-zinc-500">
                      {item.costPrice > 0 ? formatCurrency(item.costPrice, shopCurrency) : "—"}
                    </td>
                    <td className="p-4 border-r border-zinc-100 text-right font-bold text-sm text-black">
                      {item.quantity.toFixed(2)}
                    </td>
                    <td className="p-4 border-r border-zinc-100 text-right font-semibold text-emerald-700">
                      {formatCurrency(item.totalValue, shopCurrency)}
                    </td>
                    <td className="px-4 py-3 border-r border-zinc-100 text-center">
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
                    <td className="px-4 py-3 text-center">
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

      {/* TAB: STORAGE BINS */}
      {activeTab === "bins" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <input
              type="text"
              value={binSearch}
              onChange={(e) => setBinSearch(e.target.value)}
              placeholder="Search storage bins by code, zone, rack, or shelf..."
              className="px-3.5 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black font-sans text-xs w-full sm:max-w-xs"
            />

            <div className="flex items-center gap-2">
              <Link
                href={`/workspaces/${shopSlug}/inventory/bins`}
                className="text-[10px] text-zinc-500 hover:text-black font-semibold uppercase px-3 py-2 border border-zinc-200 rounded hover:bg-zinc-50 transition-colors whitespace-nowrap"
              >
                Global WMS Bins ↗
              </Link>
              <button
                type="button"
                onClick={() => setShowAddBinModal(true)}
                className="bg-black text-white hover:bg-zinc-800 px-3.5 py-2 font-mono text-xs font-semibold uppercase rounded transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Storage Bin</span>
              </button>
            </div>
          </div>

          {/* STORAGE BINS TABLE */}
          <div className="surface overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-wide font-semibold text-zinc-400 bg-zinc-50/60">
                  <th className="px-4 py-3 border-r border-zinc-100 w-12 text-center">QR</th>
                  <th className="px-4 py-3 border-r border-zinc-100 min-w-[140px]">Bin Code</th>
                  <th className="px-4 py-3 border-r border-zinc-100">Zone</th>
                  <th className="px-4 py-3 border-r border-zinc-100">Rack</th>
                  <th className="px-4 py-3 border-r border-zinc-100">Shelf / Tier</th>
                  <th className="px-4 py-3 border-r border-zinc-100">Description</th>
                  <th className="px-4 py-3 text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {locationBins
                  .filter((b) => {
                    if (!binSearch.trim()) return true;
                    const q = binSearch.toLowerCase();
                    return (
                      b.binCode?.toLowerCase().includes(q) ||
                      b.zone?.toLowerCase().includes(q) ||
                      b.rack?.toLowerCase().includes(q) ||
                      b.shelf?.toLowerCase().includes(q) ||
                      b.description?.toLowerCase().includes(q)
                    );
                  })
                  .map((bin) => (
                    <tr key={bin.id} className="hover:bg-zinc-50 transition-colors border-b border-zinc-100/80 last:border-0">
                      <td className="p-3 border-r border-zinc-100 text-center">
                        <button
                          type="button"
                          onClick={() => setPrintBin(bin)}
                          className="p-1 hover:bg-zinc-100 rounded text-zinc-600 hover:text-black transition-colors"
                          title="View / Print QR barcode label"
                        >
                          <QrCode className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                      <td className="p-4 border-r border-zinc-100 font-bold text-black font-mono text-sm">
                        {bin.binCode}
                      </td>
                      <td className="p-4 border-r border-zinc-100 font-semibold text-zinc-800">
                        {bin.zone}
                      </td>
                      <td className="p-4 border-r border-zinc-100 text-zinc-600">
                        {bin.rack || <span className="text-zinc-300 italic">None</span>}
                      </td>
                      <td className="p-4 border-r border-zinc-100 text-zinc-600">
                        {bin.shelf || <span className="text-zinc-300 italic">None</span>}
                      </td>
                      <td className="p-4 border-r border-zinc-100 text-zinc-500 font-sans">
                        {bin.description || <span className="text-zinc-300 italic">No notes</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPrintBin(bin)}
                            className="border border-zinc-300 px-2 py-1 text-[10px] font-semibold uppercase rounded hover:border-black hover:bg-zinc-50 transition-colors inline-flex items-center gap-1"
                          >
                            <Printer className="w-3 h-3 text-zinc-500" />
                            <span>Label</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBin(bin)}
                            className="text-zinc-400 hover:text-rose-600 p-1 transition-colors"
                            title="Archive bin"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {locationBins.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-zinc-400 font-sans text-xs">
                      <div className="max-w-sm mx-auto space-y-3">
                        <Layers className="w-8 h-8 text-zinc-300 mx-auto" />
                        <p className="font-semibold text-zinc-700">No Storage Bins in {location.name} Yet</p>
                        <p className="text-zinc-400 text-xs">
                          Map physical aisles, racks, and shelf storage bins in this warehouse to optimize item picking and FEFO expiry tracking.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowAddBinModal(true)}
                          className="bg-black text-white px-4 py-2 rounded font-mono text-xs uppercase font-bold hover:bg-zinc-800 transition-colors"
                        >
                          + Add First Storage Bin
                        </button>
                      </div>
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
          <div className="surface overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-wide font-semibold text-zinc-400 bg-zinc-50/60">
                  <th className="px-4 py-3 border-r border-zinc-100">Date & Time</th>
                  <th className="px-4 py-3 border-r border-zinc-100">Product</th>
                  <th className="px-4 py-3 border-r border-zinc-100">Movement Type</th>
                  <th className="px-4 py-3 border-r border-zinc-100 text-right">Quantity</th>
                  <th className="px-4 py-3 border-r border-zinc-100 text-right">Balance After</th>
                  <th className="px-4 py-3 border-r border-zinc-100">User / Created By</th>
                  <th className="p-4">Notes / Reference</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {recentMovements.map((entry: any) => {
                  const isOutflow = ["SALE", "ADJUSTMENT_OUT", "TRANSFER_OUT", "VOID"].includes(entry.movementType);
                  return (
                    <tr key={entry.id} className="hover:bg-zinc-50 transition-colors border-b border-zinc-100/80 last:border-0">
                      <td className="p-4 border-r border-zinc-100 text-zinc-500 whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                        <span className="block text-[10px] text-zinc-400">
                          {new Date(entry.createdAt).toLocaleTimeString("en-KE", { timeStyle: "short" })}
                        </span>
                      </td>
                      <td className="p-4 border-r border-zinc-100 font-sans font-semibold text-black text-sm">
                        {entry.product?.name || "—"}
                        {entry.product?.sku && (
                          <span className="block text-[10px] text-zinc-400 font-mono">{entry.product.sku}</span>
                        )}
                      </td>
                      <td className="p-4 border-r border-zinc-100">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold uppercase ${MOVEMENT_TYPE_COLORS[entry.movementType] || "bg-zinc-100 text-zinc-500 border-zinc-200"}`}>
                          {MOVEMENT_TYPE_LABELS[entry.movementType] || entry.movementType}
                        </span>
                      </td>
                      <td className={`p-4 border-r border-zinc-100 font-semibold text-right ${isOutflow ? "text-rose-700" : "text-emerald-700"}`}>
                        {isOutflow ? "-" : "+"}{parseFloat(entry.quantity).toFixed(2)}
                      </td>
                      <td className="p-4 border-r border-zinc-100 font-semibold text-right text-black">
                        {entry.runningBalance !== null ? parseFloat(entry.runningBalance).toFixed(2) : "—"}
                      </td>
                      <td className="p-4 border-r border-zinc-100 text-zinc-600 font-sans">
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
          <div className="surface overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-wide font-semibold text-zinc-400 bg-zinc-50/60">
                  <th className="px-4 py-3 border-r border-zinc-100">Direction</th>
                  <th className="px-4 py-3 border-r border-zinc-100">Origin / Source</th>
                  <th className="px-4 py-3 border-r border-zinc-100">Destination</th>
                  <th className="px-4 py-3 border-r border-zinc-100 text-center">Status</th>
                  <th className="px-4 py-3 border-r border-zinc-100 text-center">Items Count</th>
                  <th className="px-4 py-3 border-r border-zinc-100">Date Initiated</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {transfers.map((t: any) => {
                  const isOutbound = t.fromLocationId === location.id;
                  return (
                    <tr key={t.id} className="hover:bg-zinc-50 transition-colors border-b border-zinc-100/80 last:border-0">
                      <td className="p-4 border-r border-zinc-100">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold uppercase ${
                          isOutbound ? "bg-purple-100 text-purple-900 border-purple-300" : "bg-indigo-100 text-indigo-900 border-indigo-300"
                        }`}>
                          {isOutbound ? "↗ OUTBOUND" : "↙ INBOUND"}
                        </span>
                      </td>
                      <td className="p-4 border-r border-zinc-100 font-sans font-semibold text-black">
                        {t.fromLocation?.name || "—"}
                      </td>
                      <td className="p-4 border-r border-zinc-100 font-sans font-semibold text-black">
                        {t.toLocation?.name || "—"}
                      </td>
                      <td className="px-4 py-3 border-r border-zinc-100 text-center">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold uppercase ${
                          t.status === "COMPLETED" ? "bg-emerald-100 text-emerald-900 border-emerald-300" :
                          t.status === "IN_TRANSIT" ? "bg-amber-100 text-amber-900 border-amber-300" :
                          t.status === "CANCELLED" ? "bg-rose-100 text-rose-900 border-rose-300" :
                          "bg-zinc-100 text-zinc-700 border-zinc-300"
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="p-4 border-r border-zinc-100 text-center font-semibold text-black">
                        {t.items?.length || 0} product(s)
                      </td>
                      <td className="px-4 py-3 border-r border-zinc-100 text-zinc-400">
                        {new Date(t.createdAt).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                      </td>
                      <td className="px-4 py-3 text-center">
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

      {/* MODAL: ADD STORAGE BIN */}
      {showAddBinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <div>
                <h2 className="font-sans font-bold text-base uppercase tracking-tight text-black">
                  Add Storage Bin / Shelf
                </h2>
                <p className="text-[11px] text-zinc-500 font-sans">
                  Assigned to Location: <strong className="text-zinc-900">{location.name}</strong>
                </p>
              </div>
              <button onClick={() => setShowAddBinModal(false)} className="text-zinc-400 hover:text-black text-lg leading-none">✕</button>
            </div>

            <form onSubmit={handleCreateBin} className="space-y-4">
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Zone *</label>
                  <input
                    type="text"
                    value={binZone}
                    onChange={(e) => {
                      setBinZone(e.target.value);
                      handleAutoCode(e.target.value, binRack, binShelf);
                    }}
                    placeholder="e.g. A"
                    className="w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-1 focus:ring-black font-mono text-xs uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Rack</label>
                  <input
                    type="text"
                    value={binRack}
                    onChange={(e) => {
                      setBinRack(e.target.value);
                      handleAutoCode(binZone, e.target.value, binShelf);
                    }}
                    placeholder="e.g. 01"
                    className="w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-1 focus:ring-black font-mono text-xs uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Shelf</label>
                  <input
                    type="text"
                    value={binShelf}
                    onChange={(e) => {
                      setBinShelf(e.target.value);
                      handleAutoCode(binZone, binRack, e.target.value);
                    }}
                    placeholder="e.g. S1"
                    className="w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-1 focus:ring-black font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">
                  Bin Code * <span className="font-normal italic">(QR Scannable identifier)</span>
                </label>
                <input
                  type="text"
                  value={binCode}
                  onChange={(e) => setBinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A-01-S1"
                  className="w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-1 focus:ring-black font-mono text-sm uppercase font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Description / Notes</label>
                <input
                  type="text"
                  value={binDesc}
                  onChange={(e) => setBinDesc(e.target.value)}
                  placeholder="e.g. Top tier shelf for fast-moving items"
                  className="w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-1 focus:ring-black font-sans text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isBinSubmitting}
                  className="flex-1 bg-black text-white py-2.5 rounded font-mono text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                >
                  {isBinSubmitting ? "Saving Bin..." : "Save Storage Bin"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddBinModal(false)}
                  className="px-4 border border-zinc-300 rounded hover:bg-zinc-50 font-mono text-xs font-semibold uppercase text-zinc-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRINT QR BARCODE LABEL */}
      {printBin && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">QR Shelf Label</span>
              <button onClick={() => setPrintBin(null)} className="text-zinc-400 hover:text-black text-base">✕</button>
            </div>

            <div className="p-4 border-2 border-dashed border-zinc-200 rounded-lg inline-block bg-white">
              <QRCode value={printBin.binCode} size={140} />
            </div>

            <div className="space-y-1">
              <p className="font-mono text-xl font-bold tracking-tight text-black">{printBin.binCode}</p>
              <p className="text-xs text-zinc-500 font-sans">
                {location.name} · Zone {printBin.zone}
                {printBin.rack && ` · Rack ${printBin.rack}`}
                {printBin.shelf && ` · Shelf ${printBin.shelf}`}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 bg-black text-white py-2 rounded font-mono text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Label</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintBin(null)}
                className="px-4 border border-zinc-300 rounded hover:bg-zinc-50 font-mono text-xs font-semibold uppercase text-zinc-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
