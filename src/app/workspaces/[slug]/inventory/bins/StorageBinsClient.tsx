"use client";

import { useState, useTransition } from "react";
import { createStorageBinAction, deleteStorageBinAction } from "@/lib/actions/wms";
import { toast } from "react-hot-toast";
import { Spinner } from "@/components/Spinner";
import QRCode from "react-qr-code";
import {
  Layers,
  MapPin,
  Plus,
  Trash2,
  X,
  Check,
  QrCode,
  Tag,
  Building2,
  Printer,
} from "lucide-react";

interface StorageBinsClientProps {
  shopId: string;
  shopSlug: string;
  locations: any[];
  initialBins: any[];
}

export function StorageBinsClient({
  shopId,
  shopSlug,
  locations,
  initialBins,
}: StorageBinsClientProps) {
  const [bins, setBins] = useState<any[]>(initialBins);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(locations[0]?.id || "ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [printBin, setPrintBin] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();

  // Add Bin form
  const [formLocationId, setFormLocationId] = useState(locations[0]?.id || "");
  const [zone, setZone] = useState("");
  const [rack, setRack] = useState("");
  const [shelf, setShelf] = useState("");
  const [binCode, setBinCode] = useState("");
  const [description, setDescription] = useState("");

  const filteredBins = bins.filter((b) => {
    if (selectedLocationId === "ALL") return true;
    return b.locationId === selectedLocationId;
  });

  // Auto-generate standard code when Zone/Rack/Shelf changes
  const handleAutoCode = (z: string, r: string, s: string) => {
    const parts = [z.trim().toUpperCase(), r.trim().toUpperCase(), s.trim().toUpperCase()].filter(Boolean);
    if (parts.length > 0) {
      setBinCode(parts.join("-"));
    }
  };

  const handleCreateBin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLocationId || !zone.trim() || !binCode.trim()) {
      toast.error("Please fill in location, zone, and bin code.");
      return;
    }

    startTransition(async () => {
      const res = await createStorageBinAction({
        shopId,
        locationId: formLocationId,
        zone: zone.trim(),
        rack: rack.trim() || undefined,
        shelf: shelf.trim() || undefined,
        binCode: binCode.trim(),
        description: description.trim() || undefined,
      });

      if (res.success) {
        toast.success(`Bin ${binCode.trim()} created!`);
        setShowAddModal(false);
        setZone("");
        setRack("");
        setShelf("");
        setBinCode("");
        setDescription("");
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to create bin.");
      }
    });
  };

  const handleDeleteBin = async (bin: any) => {
    if (!confirm(`Are you sure you want to archive storage bin "${bin.binCode}"?`)) return;

    startTransition(async () => {
      const res = await deleteStorageBinAction(shopId, bin.id);
      if (res.success) {
        toast.success("Storage bin archived.");
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to archive bin.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Filter Location:
          </label>
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="border border-zinc-300 rounded px-2.5 py-1 text-xs font-sans bg-white focus:outline-black"
          >
            <option value="ALL">All Storage Nodes ({bins.length} bins)</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormLocationId(locations[0]?.id || "");
            setShowAddModal(true);
          }}
          className="bg-black hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Storage Bin / Shelf</span>
        </button>
      </div>

      {/* BINS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredBins.map((bin) => (
          <div
            key={bin.id}
            className="card-modern bg-white p-4 border border-zinc-200 space-y-3 flex flex-col justify-between hover:border-black transition-colors"
          >
            <div>
              <div className="flex justify-between items-start">
                <span className="font-mono text-sm font-bold text-black border border-black px-2 py-0.5 rounded bg-zinc-50">
                  {bin.binCode}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPrintBin(bin)}
                    title="Print Shelf Barcode / QR Label"
                    className="p-1 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded cursor-pointer bg-transparent border-none"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBin(bin)}
                    title="Archive bin"
                    className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer bg-transparent border-none"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 mt-3 text-xs">
                <div className="flex items-center gap-1.5 text-zinc-600 font-sans">
                  <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="font-semibold text-black">{bin.location?.name || "Warehouse"}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-500 font-mono text-[11px]">
                  <span>Zone: <strong className="text-zinc-700">{bin.zone}</strong></span>
                  {bin.rack && <span>• Rack: <strong className="text-zinc-700">{bin.rack}</strong></span>}
                  {bin.shelf && <span>• Shelf: <strong className="text-zinc-700">{bin.shelf}</strong></span>}
                </div>
                {bin.description && (
                  <p className="text-zinc-500 text-[11px] font-sans mt-1 line-clamp-2">
                    {bin.description}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100 flex justify-between items-center text-[10px] font-mono text-zinc-400">
              <span>Active Storage Node</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                OPERATIONAL
              </span>
            </div>
          </div>
        ))}

        {filteredBins.length === 0 && (
          <div className="col-span-full card-modern p-12 text-center text-zinc-400 italic text-xs bg-white border border-zinc-200">
            No storage bins defined yet. Click "+ Add Storage Bin / Shelf" to map warehouse aisles, racks, and shelves.
          </div>
        )}
      </div>

      {/* MODAL: ADD STORAGE BIN */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="card-modern max-w-md w-full bg-white p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <h3 className="font-bold text-sm uppercase tracking-wider text-black flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <span>Create Warehouse Storage Bin</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-black cursor-pointer bg-transparent border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Location / Warehouse *
                </label>
                <select
                  value={formLocationId}
                  onChange={(e) => setFormLocationId(e.target.value)}
                  className="w-full border border-zinc-300 rounded p-2 text-xs font-sans bg-white focus:outline-black"
                  required
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code || "LOC"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Zone / Aisle *
                  </label>
                  <input
                    type="text"
                    value={zone}
                    onChange={(e) => {
                      setZone(e.target.value);
                      handleAutoCode(e.target.value, rack, shelf);
                    }}
                    placeholder="e.g. A3"
                    className="w-full border border-zinc-300 rounded p-2 text-xs font-mono uppercase focus:outline-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Rack / Bay
                  </label>
                  <input
                    type="text"
                    value={rack}
                    onChange={(e) => {
                      setRack(e.target.value);
                      handleAutoCode(zone, e.target.value, shelf);
                    }}
                    placeholder="e.g. RB"
                    className="w-full border border-zinc-300 rounded p-2 text-xs font-mono uppercase focus:outline-black"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Shelf / Tier
                  </label>
                  <input
                    type="text"
                    value={shelf}
                    onChange={(e) => {
                      setShelf(e.target.value);
                      handleAutoCode(zone, rack, e.target.value);
                    }}
                    placeholder="e.g. S02"
                    className="w-full border border-zinc-300 rounded p-2 text-xs font-mono uppercase focus:outline-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Full Bin Code (Barcode Label) *
                </label>
                <input
                  type="text"
                  value={binCode}
                  onChange={(e) => setBinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A3-RB-S02"
                  className="w-full border border-zinc-300 rounded p-2 text-xs font-mono font-bold uppercase focus:outline-black"
                  required
                />
                <span className="text-[10px] text-zinc-400 font-sans block mt-1">
                  This string will be encoded onto printable physical shelf QR/Barcode stickers.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Description / Capacity Notes
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Bottom tier heavy machinery parts shelf"
                  rows={2}
                  className="w-full border border-zinc-300 rounded p-2 text-xs font-sans focus:outline-black"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
                  <span>Save Storage Bin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT SHELF LABEL MODAL */}
      {printBin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="card-modern max-w-xs w-full bg-white p-6 space-y-4 shadow-2xl text-center">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
              <span className="font-mono text-[10px] uppercase font-bold text-zinc-400">
                Physical Shelf Label
              </span>
              <button
                type="button"
                onClick={() => setPrintBin(null)}
                className="text-zinc-400 hover:text-black cursor-pointer bg-transparent border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-2 border-black bg-zinc-50 rounded flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                {printBin.location?.name || "Warehouse"}
              </span>
              <div className="bg-white p-2 border border-black">
                <QRCode value={printBin.binCode} size={110} />
              </div>
              <span className="font-mono text-base font-black tracking-tight text-black mt-1">
                {printBin.binCode}
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                Zone: {printBin.zone} {printBin.rack ? `| ${printBin.rack}` : ""} {printBin.shelf ? `| ${printBin.shelf}` : ""}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full bg-black text-white hover:bg-zinc-800 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Sticker</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
