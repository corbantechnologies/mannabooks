// src/app/workspaces/[slug]/documents/[id]/CreditNotePopover.tsx
"use client";

import { useState } from "react";
import { raiseCreditNoteAction } from "@/lib/actions/documents";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface DocumentItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  itemTotal: string;
}

interface CreditNotePopoverProps {
  invoiceId: string;
  shopId: string;
  shopSlug: string;
  items: DocumentItem[];
  defaultCuNumber?: string | null;
  onClose: () => void;
}

export function CreditNotePopover({
  invoiceId,
  shopId,
  shopSlug,
  items,
  defaultCuNumber,
  onClose,
}: CreditNotePopoverProps) {
  const router = useRouter();
  const [isPartial, setIsPartial] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(
    items.map((item) => item.id)
  );
  const [creditNoteCuNumber, setCreditNoteCuNumber] = useState(defaultCuNumber || "");
  const [loading, setLoading] = useState(false);

  function toggleItem(id: string) {
    if (selectedItemIds.includes(id)) {
      setSelectedItemIds(selectedItemIds.filter((item) => item !== id));
    } else {
      setSelectedItemIds([...selectedItemIds, id]);
    }
  }

  async function handleRaiseCreditNote(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await raiseCreditNoteAction({
        invoiceId,
        shopId,
        shopSlug,
        isPartial,
        selectedItemIds: isPartial ? selectedItemIds : undefined,
        creditNoteCuNumber: creditNoteCuNumber.trim() || undefined,
      });

      if (res.success) {
        toast.success(`Credit Note ${res.serial} successfully issued.`);
        onClose();
        router.push(`/workspaces/${shopSlug}/documents/${res.creditNoteId}`);
      } else {
        toast.error(res.error || "Failed to raise Credit Note.");
      }
    } catch (err) {
      toast.error("An unexpected error occurred while raising Credit Note.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-black w-[95%] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-6 font-mono text-xs shadow-lg animate-in fade-in duration-150">
        
        <div className="flex justify-between items-start border-b border-black pb-4">
          <div>
            <h3 className="font-bold uppercase tracking-tight text-base">Raise Credit Note</h3>
            <p className="text-[10px] text-zinc-400 uppercase">Issue formal adjustment against invoice</p>
          </div>
          <button
            onClick={onClose}
            className="text-black font-bold hover:bg-zinc-100 px-2 py-0.5 border border-black text-xs"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleRaiseCreditNote} className="space-y-5">
          {/* CREDIT TYPE SELECTOR */}
          <div className="space-y-2">
            <span className="text-[10px] text-zinc-400 uppercase block">Credit Valuation Mode</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPartial(false)}
                className={`py-2 px-3 border border-black font-bold uppercase text-[10px] ${
                  !isPartial ? "bg-black text-white" : "bg-white text-black hover:bg-zinc-50"
                }`}
              >
                Full Credit (100%)
              </button>
              <button
                type="button"
                onClick={() => setIsPartial(true)}
                className={`py-2 px-3 border border-black font-bold uppercase text-[10px] ${
                  isPartial ? "bg-black text-white" : "bg-white text-black hover:bg-zinc-50"
                }`}
              >
                Partial Line Credit
              </button>
            </div>
          </div>

          {/* ITEM SELECTION (FOR PARTIAL CREDIT) */}
          {isPartial && (
            <div className="space-y-2 border border-zinc-200 p-3 bg-zinc-50">
              <span className="text-[10px] font-bold uppercase text-black block mb-2">
                Select Line Items to Include:
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {items.map((item) => {
                  const isChecked = selectedItemIds.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      className="flex items-center justify-between p-2 bg-white border border-black cursor-pointer text-[11px]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleItem(item.id)}
                          className="accent-black"
                        />
                        <span className="font-bold uppercase truncate">{item.description}</span>
                      </div>
                      <span className="font-bold text-zinc-600">{item.itemTotal}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* OPTIONAL CREDIT NOTE eTIMS CU NUMBER */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="text-zinc-400 text-[10px] uppercase block">
                Credit Note eTIMS CU Number
              </label>
              <span className="text-[9px] text-zinc-400 italic">Optional</span>
            </div>
            <input
              type="text"
              value={creditNoteCuNumber}
              onChange={(e) => setCreditNoteCuNumber(e.target.value)}
              placeholder="e.g. CN-CU0123456789/2026"
              className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black text-xs"
            />
          </div>

          {/* SUBMIT BUTTONS */}
          <div className="flex gap-2 pt-2 border-t border-black">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 border border-black px-4 py-2 text-xs font-bold uppercase hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (isPartial && selectedItemIds.length === 0)}
              className="w-1/2 border border-black bg-black text-white px-4 py-2 text-xs font-bold uppercase hover:bg-zinc-800 transition-colors disabled:bg-zinc-400"
            >
              {loading ? "Issuing..." : "Issue Credit Note"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
