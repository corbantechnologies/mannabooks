"use client";

import { useState } from "react";
import { restockProductAction } from "@/lib/actions/products";
import toast from "react-hot-toast";
import { Spinner } from "@/components/Spinner";

interface QuickRestockModalProps {
  product: {
    id: string;
    name: string;
    sku?: string | null;
    stockQuantity: string;
    reorderThreshold?: string | null;
    costPrice?: string | null;
  };
  shopId: string;
  shopSlug: string;
  currency?: string;
  locations?: Array<{ id: string; name: string }>;
  triggerButton?: React.ReactNode;
}

export function QuickRestockModal({
  product,
  shopId,
  shopSlug,
  currency = "KES",
  locations = [],
  triggerButton,
}: QuickRestockModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [addQty, setAddQty] = useState("");
  const [unitCost, setUnitCost] = useState(product.costPrice || "0.00");
  const [locationId, setLocationId] = useState(locations[0]?.id || "");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQty = parseFloat(product.stockQuantity || "0");
  const threshold = parseFloat(product.reorderThreshold || "5");

  async function handleRestock(e: React.FormEvent) {
    e.preventDefault();
    const qtyNum = parseFloat(addQty);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      toast.error("Please enter a valid stock quantity to add.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(`Restocking ${product.name}...`);

    try {
      const res = await restockProductAction({
        shopId,
        shopSlug,
        productId: product.id,
        addQuantity: qtyNum,
        unitCost: unitCost ? parseFloat(unitCost) : undefined,
        locationId: locationId || undefined,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        toast.success(`Successfully added +${qtyNum} units to ${product.name}! (New total: ${res.newQuantity})`, { id: toastId });
        setIsOpen(false);
        setAddQty("");
        setNotes("");
      } else {
        toast.error(res.error || "Failed to restock product.", { id: toastId });
      }
    } catch (err) {
      toast.error("Error updating inventory levels.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {triggerButton ? (
        <span onClick={() => setIsOpen(true)}>{triggerButton}</span>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="badge-amber cursor-pointer hover:opacity-80 transition-opacity"
        >
          + Restock
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <form
            onSubmit={handleRestock}
            className="bg-white border border-zinc-200/80 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs text-left"
          >
            <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Inventory Replenishment</span>
                <h3 className="font-bold text-sm uppercase text-black font-sans truncate" title={product.name}>
                  Restock: {product.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-black font-bold text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-sans">
              {/* CURRENT STATUS */}
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200/80 flex justify-between items-center text-xs">
                <div>
                  <span className="text-zinc-400 block uppercase text-[10px] font-semibold">Current Stock:</span>
                  <span className={`font-bold ${currentQty <= 0 ? 'text-rose-600' : currentQty <= threshold ? 'text-amber-800' : 'text-emerald-700'}`}>
                    {currentQty} Units Available
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-400 block uppercase text-[10px] font-semibold">Reorder Threshold:</span>
                  <span className="font-bold text-black">{threshold} Units</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-semibold text-zinc-500 block mb-1">
                  Quantity to Add *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  autoFocus
                  placeholder="e.g. 50"
                  value={addQty}
                  onChange={(e) => setAddQty(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm font-bold focus:outline-none focus:ring-1 focus:ring-black font-mono"
                />
                {addQty && !isNaN(parseFloat(addQty)) && (
                  <p className="text-[10px] text-emerald-700 font-sans mt-1">
                    ✓ New resulting stock balance: <strong>{(currentQty + parseFloat(addQty)).toFixed(2)}</strong> units
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-semibold text-zinc-500 block mb-1">
                    Unit Cost ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-black font-mono"
                  />
                </div>

                {locations.length > 0 ? (
                  <div>
                    <label className="text-[10px] uppercase font-semibold text-zinc-500 block mb-1">
                      Target Location
                    </label>
                    <select
                      value={locationId}
                      onChange={(e) => setLocationId(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs uppercase focus:outline-none focus:ring-1 focus:ring-black bg-white font-semibold"
                    >
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] uppercase font-semibold text-zinc-500 block mb-1">
                      SKU Code
                    </label>
                    <span className="text-zinc-600 block py-2 text-xs font-mono">{product.sku || "N/A"}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] uppercase font-semibold text-zinc-500 block mb-1">
                  Movement / Purchase Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Received from Supplier ABC (PO-102)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs font-sans focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200/80">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn-secondary-modern px-3 py-1.5 text-xs font-semibold uppercase"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !addQty}
                className="btn-primary-modern px-4 py-1.5 text-xs font-semibold uppercase disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size={10} color="white" />
                    <span>Updating...</span>
                  </>
                ) : (
                  "Confirm Restock"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
