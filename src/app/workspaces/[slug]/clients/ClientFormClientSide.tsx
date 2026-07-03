// src/app/workspaces/[slug]/clients/ClientFormClientSide.tsx
"use client";

import { useState } from "react";
import { createClientProfile } from "@/lib/actions/clients";

export function ClientFormClientSide({ shopId }: { shopId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [clientType, setClientType] = useState<"WALK_IN" | "INDIVIDUAL" | "CORPORATE">("WALK_IN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const taxPin = formData.get("taxPin") as string;

    const res = await createClientProfile({
      shopId,
      name,
      email,
      phone,
      clientType,
      taxPin: clientType === "WALK_IN" ? undefined : taxPin,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to commit record.");
    } else {
      setIsOpen(false);
      setClientType("WALK_IN");
      // Trigger native layout sync
      window.location.reload();
    }
  }

  return (
    <>
      {/* SHARP TRIGGER CTA BUTTON */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-zinc-900 transition-colors rounded-none border border-black"
      >
        + Register Customer
      </button>

      {/* OVERLAY INTERFACE BACKDROP */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-none z-50 flex items-center justify-center p-4 animate-fade-in animate-duration-150">
          <div className="bg-white border border-black w-full max-w-md p-6 space-y-6 flex flex-col relative rounded-none">
            
            <div className="space-y-1">
              <h2 className="text-xl font-bold uppercase tracking-tight">Onboard Client</h2>
              <p className="font-mono text-[10px] text-zinc-400 uppercase">Append new entity context to repository</p>
            </div>

            {error && (
              <div className="border border-black bg-zinc-50 p-3 font-mono text-[11px] text-black font-bold uppercase">
                &gt; VALIDATION_FAILURE: {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              
              {/* STARK TAB SELECTOR GRID */}
              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block">Registry Profile Type</label>
                <div className="grid grid-cols-3 border border-black divide-x divide-black bg-white">
                  {(["WALK_IN", "INDIVIDUAL", "CORPORATE"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setClientType(type)}
                      className={`py-2 text-[10px] font-bold uppercase tracking-tighter transition-colors rounded-none ${
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
                <label className="text-zinc-400 uppercase block">Client Name / Corporate Title</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g., Acme Supplies LTD"
                  className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 rounded-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="name@domain.com"
                    className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 rounded-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block">Phone Contact</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="e.g., 0712345678"
                    className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 rounded-none"
                  />
                </div>
              </div>

              {/* CONDITIONAL COMPLIANCE INPUT ELEMENT */}
              {clientType !== "WALK_IN" && (
                <div className="space-y-1 pt-2 border-t border-dashed border-zinc-200 animate-in fade-in duration-150">
                  <label className="text-black font-bold uppercase block">
                    {clientType === "CORPORATE" ? "Company Tax PIN" : "Personal Tax PIN"}
                  </label>
                  <input
                    type="text"
                    name="taxPin"
                    placeholder="e.g., A00XXXXXXXXB"
                    className="w-full px-3 py-2 border border-black bg-white font-mono text-sm uppercase focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 rounded-none"
                    maxLength={13}
                    required
                  />
                  <p className="text-[10px] text-zinc-400 font-sans italic normal-case leading-tight">
                    This statutory identifier is validated and directly linked onto generated transactional ledgers for audit compliance.
                  </p>
                </div>
              )}

              {/* ACTION TOGGLE WRAPPER */}
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
                  disabled={loading}
                  className="bg-black text-white px-6 py-2 font-bold uppercase hover:bg-zinc-900 transition-colors disabled:bg-zinc-300 rounded-none border border-black"
                >
                  {loading ? "COMMITTING NODE..." : "SAVE PROFILE"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}