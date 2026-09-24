"use client";

import React, { useState, useTransition } from "react";
import {
  ClipboardCheck,
  Plus,
  ArrowRight,
  Warehouse,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Scan,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startStocktakeAction } from "@/lib/actions/stocktake";

interface Stocktake {
  id: string;
  stocktakeNumber: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  location: {
    name: string;
    code: string | null;
  };
  conductedBy: {
    name: string;
    email: string;
  };
  items: any[];
}

interface StocktakesClientProps {
  shopId: string;
  shopSlug: string;
  initialStocktakes: Stocktake[];
  locations: any[];
}

export function StocktakesClient({
  shopId,
  shopSlug,
  initialStocktakes,
  locations,
}: StocktakesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState(locations[0]?.id || "");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeAudits = initialStocktakes.filter((s) => s.status === "COUNTING" || s.status === "IN_PROGRESS" || s.status === "DRAFT");
  const completedAudits = initialStocktakes.filter((s) => s.status === "COMPLETED");

  const handleStartStocktake = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      const res = await startStocktakeAction({
        shopId,
        locationId: selectedLocationId,
      });

      if (res.success && res.stocktakeId) {
        setIsModalOpen(false);
        router.push(`/workspaces/${shopSlug}/inventory/stocktakes/${res.stocktakeId}`);
      } else {
        setErrorMsg(res.error || "Failed to initialize audit session.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-500">Active Audits</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-600 mt-2">{activeAudits.length}</p>
          <span className="text-[11px] text-zinc-500">Currently in count progress</span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-500">Reconciled Audits</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-600 mt-2">{completedAudits.length}</p>
          <span className="text-[11px] text-zinc-500">Posted variance adjustments</span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-500">Warehouses Monitored</span>
            <Warehouse className="w-4 h-4 text-zinc-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-zinc-900 mt-2">{locations.length}</p>
          <span className="text-[11px] text-zinc-500">Multi-branch locations available</span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-zinc-800">
            Stocktake Audit Sessions ({initialStocktakes.length})
          </h2>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-black text-white text-xs font-semibold rounded-md hover:bg-zinc-800 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          + Start Physical Stocktake
        </button>
      </div>

      {/* Table of Audits */}
      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
        {initialStocktakes.length === 0 ? (
          <div className="p-10 text-center">
            <ClipboardCheck className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-zinc-800">No stocktake audits initiated</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
              Start a stocktake session to snapshot current ledger stock, count physical items with your team, and automatically post variances.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-md hover:bg-zinc-800"
            >
              <Plus className="w-3.5 h-3.5" /> Initialize First Audit
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 font-mono uppercase text-[10px] text-zinc-500">
                  <th className="py-2.5 px-4">Audit ID</th>
                  <th className="py-2.5 px-4">Location / Warehouse</th>
                  <th className="py-2.5 px-4">Conducted By</th>
                  <th className="py-2.5 px-4 text-center">Items Audited</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Started At</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {initialStocktakes.map((audit) => {
                  const isCompleted = audit.status === "COMPLETED";

                  return (
                    <tr key={audit.id} className="hover:bg-zinc-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-zinc-900">
                        {audit.stocktakeNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-zinc-800">{audit.location.name}</span>
                        {audit.location.code && (
                          <span className="text-[10px] font-mono text-zinc-400 ml-1.5">
                            [{audit.location.code}]
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-600">
                        {audit.conductedBy?.name || audit.conductedBy?.email}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-zinc-800">
                        {audit.items?.length || 0} products
                      </td>
                      <td className="py-3 px-4">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            RECONCILED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-100 text-amber-800 animate-pulse">
                            <Clock className="w-3 h-3" />
                            IN COUNT
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-500 text-[11px]">
                        {new Date(audit.startedAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/workspaces/${shopSlug}/inventory/stocktakes/${audit.id}`}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded transition ${
                            isCompleted
                              ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                              : "bg-black text-white hover:bg-zinc-800"
                          }`}
                        >
                          {isCompleted ? "View Report" : "Resume Count"}
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* NEW AUDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-zinc-200 overflow-hidden">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div>
                <h3 className="font-bold text-zinc-900 text-sm">Start Physical Stocktake Audit</h3>
                <p className="text-xs text-zinc-500">Freeze system book stock for reconciliation</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 text-lg font-mono p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStartStocktake} className="p-4 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  Select Warehouse Location to Count *
                </label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  required
                  className="w-full border border-zinc-300 rounded px-2.5 py-2 text-xs focus:ring-1 focus:ring-black"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {loc.isDefault ? "(Default Main)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2 text-zinc-600">
                <div className="flex items-center gap-1.5 font-semibold text-zinc-900">
                  <FileSpreadsheet className="w-4 h-4 text-zinc-700" />
                  What happens next:
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-500">
                  <li>System snapshots current on-hand quantities for this branch.</li>
                  <li>Generates an audit count sheet for your warehouse staff.</li>
                  <li>After counting, discrepancies will be calculated automatically.</li>
                  <li>One click reconciles all ledger journals and shrinkage write-offs.</li>
                </ul>
              </div>

              <div className="pt-2 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-zinc-300 rounded text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 bg-black text-white font-semibold rounded hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isPending ? "Generating Audit..." : "Begin Stocktake"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
