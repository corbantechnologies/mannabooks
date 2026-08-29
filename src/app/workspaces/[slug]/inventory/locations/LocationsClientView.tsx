"use client";
// src/app/workspaces/[slug]/inventory/locations/LocationsClientView.tsx

import { useState } from "react";
import { toast } from "react-hot-toast";
import { createStockLocation, updateStockLocation, deleteStockLocation } from "@/lib/actions/inventory";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface LocationWithStats {
  id: string;
  name: string;
  code: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  totalProducts: number;
  totalUnits: number;
  totalValuation: number;
  lowStockCount: number;
}

interface Props {
  shopId: string;
  shopSlug: string;
  shopCurrency: string;
  initialLocations: LocationWithStats[];
}

export function LocationsClientView({ shopId, shopSlug, shopCurrency, initialLocations }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationWithStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  function openCreate() {
    setEditingLocation(null);
    setName("");
    setCode("");
    setIsDefault(initialLocations.length === 0);
    setShowForm(true);
  }

  function openEdit(loc: LocationWithStats) {
    setEditingLocation(loc);
    setName(loc.name);
    setCode(loc.code || "");
    setIsDefault(loc.isDefault);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingLocation(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Location name is required.");
    setLoading(true);

    if (editingLocation) {
      const res = await updateStockLocation({
        locationId: editingLocation.id,
        shopId,
        shopSlug,
        name,
        code,
        isDefault,
        isActive: editingLocation.isActive,
      });
      if (res.success) {
        toast.success("Location updated.");
        router.refresh();
        closeForm();
      } else {
        toast.error(res.error || "Update failed.");
      }
    } else {
      const res = await createStockLocation({ shopId, shopSlug, name, code, isDefault });
      if (res.success) {
        toast.success("Location created.");
        router.refresh();
        closeForm();
      } else {
        toast.error(res.error || "Create failed.");
      }
    }
    setLoading(false);
  }

  async function handleDelete(loc: LocationWithStats) {
    if (!confirm(`Delete location "${loc.name}"? This cannot be undone.`)) return;
    const res = await deleteStockLocation(loc.id, shopSlug);
    if (res.success) {
      toast.success("Location deleted.");
      router.refresh();
    } else {
      toast.error(res.error || "Delete failed.");
    }
  }

  const totalAllUnits = initialLocations.reduce((sum, l) => sum + l.totalUnits, 0);
  const totalAllValuation = initialLocations.reduce((sum, l) => sum + l.totalValuation, 0);

  return (
    <div className="p-4 sm:p-8 space-y-10 selection:bg-black selection:text-white font-mono text-xs">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/80 pb-6">
        <div>
          <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Inventory / Locations</span>
          <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Stock Locations</h1>
          <p className="font-sans text-xs text-zinc-600 mt-1">
            Physical storage nodes — warehouses, branches, shop floors. Click any location to view its stock inventory, valuation, and movements.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-black text-white hover:bg-zinc-800 px-4 py-2 font-mono text-xs font-semibold uppercase rounded transition-colors"
        >
          + Add Location
        </button>
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-modern p-5 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Active Locations</p>
          <p className="text-xl font-semibold font-mono text-black">{initialLocations.length}</p>
          <p className="text-[10px] text-zinc-500">storage nodes</p>
        </div>
        <div className="card-modern p-5 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Total Stock Units</p>
          <p className="text-xl font-semibold font-mono text-black">{totalAllUnits.toLocaleString()}</p>
          <p className="text-[10px] text-zinc-500">across all locations</p>
        </div>
        <div className="card-modern p-5 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Total Location Value</p>
          <p className="text-xl font-semibold font-mono text-emerald-700">{formatCurrency(totalAllValuation, shopCurrency)}</p>
          <p className="text-[10px] text-zinc-500">combined inventory valuation</p>
        </div>
        <div className="card-modern p-5 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Default Node</p>
          <p className="text-sm font-semibold font-sans text-black truncate">
            {initialLocations.find(l => l.isDefault)?.name || "None"}
          </p>
          <p className="text-[10px] text-zinc-500">primary fulfillment hub</p>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-2xl w-full max-w-md p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="font-sans font-bold text-base uppercase tracking-tight">
                {editingLocation ? "Edit Location" : "New Stock Location"}
              </h2>
              <button onClick={closeForm} className="text-zinc-400 hover:text-black text-lg leading-none">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1.5">Location Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Main Warehouse, Nairobi Branch"
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
                  placeholder="e.g. WH-01, BRANCH-NBI"
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
              <p className="text-[10px] text-zinc-500 -mt-3">
                The default location is used for stock movements when no specific location is selected.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-black text-white py-2.5 rounded font-mono text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Saving…" : editingLocation ? "Update Location" : "Create Location"}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 border border-zinc-300 rounded hover:bg-zinc-50 font-mono text-xs font-semibold uppercase text-zinc-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOCATIONS TABLE */}
      <div className="card-modern overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
              <th className="p-4 border-r border-zinc-200">Location Name</th>
              <th className="p-4 border-r border-zinc-200">Code</th>
              <th className="p-4 border-r border-zinc-200 text-right">Products</th>
              <th className="p-4 border-r border-zinc-200 text-right">On-Hand Units</th>
              <th className="p-4 border-r border-zinc-200 text-right">Stock Value</th>
              <th className="p-4 border-r border-zinc-200 text-center">Default</th>
              <th className="p-4 border-r border-zinc-200 text-center">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/80 bg-white">
            {initialLocations.map((loc) => (
              <tr key={loc.id} className="hover:bg-zinc-50/80 transition-colors group">
                <td className="p-4 border-r border-zinc-200/80">
                  <Link
                    href={`/workspaces/${shopSlug}/inventory/locations/${loc.id}`}
                    className="font-sans font-bold text-black text-sm hover:underline flex items-center gap-1.5"
                  >
                    <span>🏢 {loc.name}</span>
                    <span className="text-[10px] text-zinc-400 group-hover:text-black font-mono">→</span>
                  </Link>
                  <span className="block text-[10px] text-zinc-400 mt-0.5">
                    Added {new Date(loc.createdAt).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                  </span>
                </td>
                <td className="p-4 border-r border-zinc-200/80 text-zinc-600 uppercase tracking-wider font-semibold">
                  {loc.code || <span className="text-zinc-300 italic font-normal lowercase">unassigned</span>}
                </td>
                <td className="p-4 border-r border-zinc-200/80 text-right font-semibold text-black">
                  {loc.totalProducts} items
                  {loc.lowStockCount > 0 && (
                    <span className="block text-[10px] text-amber-700 font-normal">
                      ⚠️ {loc.lowStockCount} low stock
                    </span>
                  )}
                </td>
                <td className="p-4 border-r border-zinc-200/80 text-right font-semibold text-black">
                  {loc.totalUnits.toFixed(2)}
                </td>
                <td className="p-4 border-r border-zinc-200/80 text-right font-semibold text-emerald-700">
                  {formatCurrency(loc.totalValuation, shopCurrency)}
                </td>
                <td className="p-4 border-r border-zinc-200/80 text-center">
                  {loc.isDefault ? (
                    <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded font-semibold uppercase">DEFAULT</span>
                  ) : (
                    <span className="text-zinc-400 text-[10px]">—</span>
                  )}
                </td>
                <td className="p-4 border-r border-zinc-200/80 text-center">
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold uppercase ${
                    loc.isActive ? "bg-emerald-100 text-emerald-900 border-emerald-300" : "bg-zinc-100 text-zinc-400 border-zinc-200"
                  }`}>
                    {loc.isActive ? "ACTIVE" : "ARCHIVED"}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      href={`/workspaces/${shopSlug}/inventory/locations/${loc.id}`}
                      className="bg-black text-white px-3 py-1 text-[10px] font-semibold uppercase rounded hover:bg-zinc-800 transition-colors"
                    >
                      View Details →
                    </Link>
                    <button
                      onClick={() => openEdit(loc)}
                      className="border border-zinc-300 px-3 py-1 text-[10px] font-semibold uppercase rounded hover:border-black hover:bg-zinc-50 transition-colors"
                    >
                      Edit
                    </button>
                    {!loc.isDefault && (
                      <button
                        onClick={() => handleDelete(loc)}
                        className="border border-rose-200 text-rose-600 px-3 py-1 text-[10px] font-semibold uppercase rounded hover:bg-rose-50 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {initialLocations.length === 0 && (
              <tr>
                <td colSpan={8} className="p-12 text-center text-zinc-400 italic">
                  &gt; NO LOCATIONS CONFIGURED YET. CLICK "+ ADD LOCATION" TO CREATE YOUR FIRST STOCK NODE.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* INFO BOX */}
      <div className="border border-zinc-200 bg-zinc-50/60 rounded-xl p-5">
        <p className="font-sans text-xs text-zinc-600 leading-relaxed">
          <strong className="text-black">How locations work:</strong> Each location represents a physical storage node within your workspace —
          a main warehouse, a branch store, a shop floor, or a delivery vehicle. 
          Stock movements (purchases, sales, adjustments, transfers) are all recorded against specific locations,
          giving you accurate per-location inventory levels and audit trails.
        </p>
      </div>
    </div>
  );
}
