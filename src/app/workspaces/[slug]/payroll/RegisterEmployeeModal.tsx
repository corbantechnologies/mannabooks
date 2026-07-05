// src/app/workspaces/[slug]/payroll/RegisterEmployeeModal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerNewEmployee } from "@/lib/actions/payroll";

interface RegisterEmployeeModalProps {
  shopId: string;
  shopSlug: string;
}

export function RegisterEmployeeModal({ shopId, shopSlug }: RegisterEmployeeModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [kraPin, setKraPin] = useState("");
  const [baseSalary, setBaseSalary] = useState("0");
  const [commissionRate, setCommissionRate] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Employee full name is required.");
      return;
    }

    setLoading(true);

    const res = await registerNewEmployee({
      shopId,
      fullName,
      nationalId: nationalId || undefined,
      kraPin: kraPin || undefined,
      baseSalary: parseFloat(baseSalary) || 0,
      commissionRate: parseFloat(commissionRate) || 0,
    });

    setLoading(false);

    if (res.success) {
      setIsOpen(false);
      setFullName("");
      setNationalId("");
      setKraPin("");
      setBaseSalary("0");
      setCommissionRate("0");
      router.refresh();
    } else {
      setError(res.error || "Failed to register staff.");
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-secondary-modern px-3 py-2 text-xs font-semibold uppercase tracking-wider"
      >
        + Register Employee
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200/80 rounded-md shadow-xl w-[95%] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-6 font-mono text-xs animate-in zoom-in-95 duration-150 text-left">
            
            <div className="flex justify-between items-start border-b border-zinc-200/80 pb-4">
              <div>
                <h3 className="font-semibold uppercase tracking-tight text-base font-sans text-black">Register Employee</h3>
                <p className="text-[10px] text-zinc-400 uppercase font-semibold">Human Capital Payroll Ledger Entry</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 font-semibold hover:bg-zinc-100 px-2 py-0.5 border border-zinc-300 rounded text-xs"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="border border-rose-200 bg-rose-50 p-3 text-rose-700 font-semibold uppercase rounded text-xs">
                &gt; ERROR: {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-black font-semibold uppercase block">Staff Member Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Kiprono"
                  className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block text-[10px] font-semibold">National ID / Passport #</label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="e.g. 12345678"
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block text-[10px] font-semibold">KRA Personal Tax PIN</label>
                  <input
                    type="text"
                    value={kraPin}
                    onChange={(e) => setKraPin(e.target.value)}
                    placeholder="e.g. A012345678B"
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 uppercase rounded text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block text-[10px] font-semibold">Base Monthly Salary (KES)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black font-semibold rounded text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block text-[10px] font-semibold">Default Commission Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black font-semibold rounded text-xs"
                  />
                </div>
              </div>

              <div className="border-t border-zinc-200/80 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn-secondary-modern px-4 py-2 text-xs uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary-modern px-4 py-2 text-xs uppercase disabled:bg-zinc-300"
                >
                  {loading ? "REGISTERING..." : "SAVE EMPLOYEE NODE"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
}
