// src/app/workspaces/[slug]/clients/ClientFormClientSide.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateClient } from "@/hooks/useClients";
import { toast } from "react-hot-toast";

export function ClientFormClientSide({ shopId, shopSlug }: { shopId: string; shopSlug: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [clientType, setClientType] = useState<"WALK_IN" | "INDIVIDUAL" | "CORPORATE">("WALK_IN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createClientMutation = useCreateClient(shopId, shopSlug);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const taxPin = formData.get("taxPin") as string;
    const requiresEtims = formData.get("requiresEtims") === "on";

    createClientMutation.mutate(
      {
        name,
        email,
        phone: phone || undefined,
        clientType,
        taxPin: taxPin || undefined,
        requiresEtims,
      },
      {
        onSuccess: () => {
          setIsOpen(false);
          setClientType("WALK_IN");
          router.refresh();
        },
      }
    );
  }

  return (
    <>
      {/* TRIGGER CTA BUTTON */}
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary-modern px-4 py-2 text-xs font-semibold uppercase tracking-wider"
      >
        + Register Customer
      </button>

      {/* OVERLAY INTERFACE BACKDROP */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200/80 rounded-md shadow-xl max-w-lg w-full p-6 space-y-6 font-mono text-xs animate-in zoom-in-95 duration-150 relative">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold uppercase tracking-tight font-sans text-black">Add New Client</h2>
              <p className="font-sans text-xs text-zinc-400">Enter client profile and contact information</p>
            </div>

            {error && (
              <div className="border border-rose-200 bg-rose-50 p-3 font-sans text-xs text-rose-800 font-semibold rounded">
                ⚠ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              
              {/* TAB SELECTOR GRID */}
              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block font-semibold">Registry Profile Type</label>
                <div className="grid grid-cols-3 border border-zinc-200 divide-x divide-zinc-200 bg-white rounded">
                  {(["WALK_IN", "INDIVIDUAL", "CORPORATE"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setClientType(type)}
                      className={`py-2 text-[10px] font-semibold uppercase tracking-tighter transition-colors ${
                        clientType === type 
                          ? "bg-black text-white" 
                          : "bg-white text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      {type === "WALK_IN" ? "Walk-In" : type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block font-semibold">Client Name / Corporate Title</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g., Acme Supplies LTD"
                  className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold">Email Address <span className="text-[9px] text-zinc-400 font-normal">(Optional)</span></label>
                  <input
                    type="email"
                    name="email"
                    placeholder="name@domain.com (optional)"
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold">Phone Contact</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="e.g., 0712345678"
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
                  />
                </div>
              </div>

              {/* TAX PIN INPUT */}
              <div className="space-y-1 pt-2 border-t border-dashed border-zinc-200">
                <div className="flex justify-between items-center">
                  <label className="text-black font-semibold uppercase block">KRA Tax PIN</label>
                  <span className="text-[9px] text-zinc-400 italic">Sole Prop (A...) or Corp (P...)</span>
                </div>
                <input
                  type="text"
                  name="taxPin"
                  placeholder="e.g. A012345678B (Personal/Sole Prop) or P051234567A (Company)"
                  className="w-full px-3 py-2 border border-zinc-300 bg-white font-mono text-xs uppercase focus:outline-none focus:border-black placeholder:text-zinc-300 rounded"
                  maxLength={20}
                />
              </div>

              {/* STATUTORY eTIMS FISCAL REQUIREMENT TOGGLE */}
              <div className="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded">
                <input
                  type="checkbox"
                  id="requiresEtims"
                  name="requiresEtims"
                  className="accent-black w-4 h-4 cursor-pointer rounded-sm"
                />
                <label htmlFor="requiresEtims" className="font-semibold uppercase text-[10px] cursor-pointer">
                  Requires KRA eTIMS / CU Fiscal Compliance
                </label>
              </div>

              {/* ACTION TOGGLE WRAPPER */}
              <div className="border-t border-zinc-200/80 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn-secondary-modern px-4 py-2 text-xs font-semibold uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary-modern px-6 py-2 font-semibold uppercase text-xs disabled:bg-zinc-300"
                >
                  {loading ? "SAVING..." : "SAVE PROFILE"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}