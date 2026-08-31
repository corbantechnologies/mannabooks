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
          className="border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900 px-2.5 py-1 rounded font-mono text-[10px] font-bold uppercase transition-colors"
        >
          + Restock
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <form
            onSubmit={handleRestock}
            className="bg-white border border-zinc-300 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl font-mono text-xs text-left"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Inventory Replenishment</span>
                <h3 className="font-bold text-sm uppercase text-black font-sans truncate" title={product.name}>
                  Restock: {product.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-black font-bold text-base"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* CURRENT STATUS */}
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 flex justify-between items-center text-[11px]">
                <div>
                  <span className="text-zinc-400 block uppercase text-[9px]">Current Stock:</span>
                  <span className={`font-black ${currentQty <= 0 ? 'text-rose-600' : currentQty <= threshold ? 'text-amber-800' : 'text-emerald-700'}`}>
                    {currentQty} Units Available
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-400 block uppercase text-[9px]">Reorder Threshold:</span>
                  <span className="font-bold text-black">{threshold} Units</span>
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
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
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm font-bold focus:outline-none focus:border-black"
                />
                {addQty && !isNaN(parseFloat(addQty)) && (
                  <p className="text-[10px] text-emerald-700 font-sans mt-1">
                    ✓ New resulting stock balance: <strong>{(currentQty + parseFloat(addQty)).toFixed(2)}</strong> units
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                    Unit Cost ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs focus:outline-none focus:border-black"
                  />
                </div>

                {locations.length > 0 ? (
                  <div>
                    <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                      Target Location
                    </label>
                    <select
                      value={locationId}
                      onChange={(e) => setLocationId(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs uppercase focus:outline-none focus:border-black bg-white"
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
                    <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                      SKU Code
                    </label>
                    <span className="text-zinc-600 block py-2 text-xs">{product.sku || "N/A"}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                  Movement / Purchase Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Received from Supplier ABC (PO-102)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-sans focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border border-zinc-300 rounded-lg font-bold uppercase text-zinc-600 hover:bg-zinc-50 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !addQty}
                className="px-4 py-2 bg-black text-white rounded-lg font-bold uppercase hover:bg-zinc-800 disabled:opacity-50 text-xs flex items-center gap-1.5"
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
