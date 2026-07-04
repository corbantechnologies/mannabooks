// src/app/workspaces/[slug]/suppliers/SupplierFormClientSide.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateSupplier } from "@/hooks/useSuppliers";

export function SupplierFormClientSide({ shopId, shopSlug }: { shopId: string; shopSlug: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [supplierType, setSupplierType] = useState<"WALK_IN" | "INDIVIDUAL" | "CORPORATE">("CORPORATE");
  const [paymentTerms, setPaymentTerms] = useState("NET_30");

  const createSupplierMutation = useCreateSupplier(shopId, shopSlug);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const taxPin = formData.get("taxPin") as string;
    const requiresEtims = formData.get("requiresEtims") === "on";

    createSupplierMutation.mutate(
      {
        name,
        email,
        phone: phone || undefined,
        supplierType,
        taxPin: taxPin || undefined,
        requiresEtims,
        paymentTerms,
      },
      {
        onSuccess: () => {
          setIsOpen(false);
          setSupplierType("CORPORATE");
          router.refresh();
        },
      }
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-black text-white px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider hover:bg-zinc-900 transition-colors rounded-none border border-black"
      >
        + Register Supplier / Vendor
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-black w-[95%] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-6 font-mono text-xs shadow-lg animate-in fade-in duration-150">
            
            <div className="flex justify-between items-start border-b border-black pb-4">
              <div>
                <h3 className="font-bold uppercase tracking-tight text-base">Register Vendor / Supplier</h3>
                <p className="text-[10px] text-zinc-400 uppercase">Inbound Procurement Entity Entry</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-black font-bold hover:bg-zinc-100 px-2 py-0.5 border border-black text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* CLASSIFICATION TYPE SELECTOR */}
              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block text-[10px]">Vendor Classification</label>
                <div className="grid grid-cols-3 border border-black divide-x divide-black bg-white">
                  {(["CORPORATE", "INDIVIDUAL", "WALK_IN"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSupplierType(type)}
                      className={`py-2 text-[10px] font-bold uppercase transition-colors ${
                        supplierType === type ? "bg-black text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      {type === "CORPORATE" ? "Corporate" : type === "INDIVIDUAL" ? "Sole Prop" : "Walk-in"}
                    </button>
                  ))}
                </div>
              </div>

              {/* NAME & CONTACT */}
              <div className="space-y-1">
                <label className="text-black font-bold uppercase block">Supplier / Company Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Metro Distributors LTD"
                  className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 rounded-none text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block text-[10px]">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="orders@vendor.com"
                    className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 rounded-none text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block text-[10px]">Phone Contact</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="e.g. 0712345678"
                    className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 rounded-none text-xs"
                  />
                </div>
              </div>

              {/* FLEXIBLE TAX PIN (SOLE PROP A... OR CORP P...) */}
              <div className="space-y-1 pt-2 border-t border-dashed border-zinc-200">
                <div className="flex justify-between items-center">
                  <label className="text-black font-bold uppercase block">KRA Tax PIN</label>
                  <span className="text-[9px] text-zinc-400 italic">Sole Prop (A...) or Corp (P...)</span>
                </div>
                <input
                  type="text"
                  name="taxPin"
                  placeholder="e.g. A012345678B (Personal/Sole Prop) or P051234567A (Company)"
                  className="w-full px-3 py-2 border border-black bg-white font-mono text-xs uppercase focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 rounded-none"
                  maxLength={20}
                />
              </div>

              {/* PAYMENT TERMS SELECTOR */}
              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block text-[10px]">Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black text-xs font-bold uppercase"
                >
                  <option value="NET_30">Net 30 Days</option>
                  <option value="NET_15">Net 15 Days</option>
                  <option value="NET_7">Net 7 Days</option>
                  <option value="COD">Cash on Delivery (COD)</option>
                  <option value="IMMEDIATE">Immediate Payment</option>
                </select>
              </div>

              {/* STATUTORY eTIMS FISCAL REQUIREMENT TOGGLE */}
              <div className="flex items-center gap-2 p-3 bg-zinc-50 border border-black">
                <input
                  type="checkbox"
                  id="supplierRequiresEtims"
                  name="requiresEtims"
                  className="accent-black w-4 h-4 cursor-pointer"
                />
                <label htmlFor="supplierRequiresEtims" className="font-bold uppercase text-[10px] cursor-pointer">
                  Requires KRA eTIMS / CU Fiscal Receipt
                </label>
              </div>

              {/* BUTTONS */}
              <div className="border-t border-black pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="border border-zinc-300 px-4 py-2 text-zinc-600 hover:border-black hover:text-black transition-colors rounded-none"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={createSupplierMutation.isPending}
                  className="bg-black text-white px-4 py-2 font-bold uppercase hover:bg-zinc-900 transition-colors disabled:bg-zinc-400 rounded-none"
                >
                  {createSupplierMutation.isPending ? "REGISTERING..." : "COMMIT SUPPLIER"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
}
