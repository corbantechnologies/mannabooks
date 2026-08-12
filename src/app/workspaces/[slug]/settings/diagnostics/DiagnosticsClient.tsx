// src/app/workspaces/[slug]/settings/diagnostics/DiagnosticsClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { purgeLedgerAction, repairLedgerAction } from "@/lib/actions/documents";
import { toast } from "react-hot-toast";
import { Spinner } from "@/components/Spinner";
import Link from "next/link";

interface LedgerSnapshot {
  id: string;
  entryCount: number;
  notes: string | null;
  createdAt: string;
  data: any;
}

interface DiagnosticsClientProps {
  shopId: string;
  shopSlug: string;
  initialIsGlEnabled: boolean;
  ledgerSnapshots: LedgerSnapshot[];
}

export function DiagnosticsClient({
  shopId,
  shopSlug,
  initialIsGlEnabled,
  ledgerSnapshots = [],
}: DiagnosticsClientProps) {
  const router = useRouter();
  const [isGlEnabled, setIsGlEnabled] = useState(initialIsGlEnabled);
  const [purging, setPurging] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [showRebuildConfirm, setShowRebuildConfirm] = useState(false);
  const [expandedSnapshotId, setExpandedSnapshotId] = useState<string | null>(null);

  async function handlePurgeLedger() {
    setShowPurgeConfirm(false);
    setPurging(true);
    const toastId = toast.loading("Purging and archiving ledger entries...");
    try {
      const res = await purgeLedgerAction(shopId, shopSlug);
      if (res.success) {
        toast.success("Ledger successfully purged. Live posting is now paused.", { id: toastId });
        setIsGlEnabled(false);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to purge ledger.", { id: toastId });
      }
    } catch (err) {
      toast.error("An unexpected error occurred during purge.", { id: toastId });
    } finally {
      setPurging(false);
    }
  }

  async function handleRebuildLedger() {
    setShowRebuildConfirm(false);
    setRepairing(true);
    const toastId = toast.loading("Rebuilding ledger journal entries...");
    try {
      const res = await repairLedgerAction(shopId, shopSlug);
      if (res.success) {
        toast.success("Ledger successfully rebuilt and re-activated.", { id: toastId });
        setIsGlEnabled(true);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to rebuild ledger.", { id: toastId });
      }
    } catch (err) {
      toast.error("An unexpected error occurred during ledger rebuild.", { id: toastId });
    } finally {
      setRepairing(false);
    }
  }

  return (
    <div className="space-y-8 font-mono text-xs selection:bg-black selection:text-white">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Ledger Maintenance</span>
          <h1 className="text-3xl font-bold uppercase tracking-tighter mt-1">General Ledger Diagnostics</h1>
        </div>
        <Link
          href={`/workspaces/${shopSlug}/settings`}
          className="border border-black bg-white px-4 py-2 font-bold uppercase hover:bg-black hover:text-white transition-colors no-underline text-black"
        >
          ← Back to Settings
        </Link>
      </div>

      {/* GL STATUS BANNER */}
      <div className={`p-5 border rounded-xl flex items-center justify-between ${
        isGlEnabled 
          ? "border-emerald-200 bg-emerald-50/20 text-emerald-800" 
          : "border-rose-200 bg-rose-50/20 text-rose-800"
      }`}>
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider">General Ledger Posting State</span>
          <p className="font-sans text-sm font-bold normal-case">
            {isGlEnabled 
              ? "Live posting is active. All document adjustments write entries directly to the General Ledger." 
              : "GL posting is paused. You can edit/delete documents without modifying active account ledger data."}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`h-2.5 w-2.5 rounded-full ${isGlEnabled ? "bg-emerald-600 animate-pulse" : "bg-rose-600"}`} />
          <span className="font-bold uppercase tracking-wider">{isGlEnabled ? "Active" : "Paused"}</span>
        </div>
      </div>

      {/* DIAGNOSTICS MAINTENANCE UTILITIES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* RESET & PURGE CARD */}
        <div className="card-modern p-6 bg-white space-y-4 border border-zinc-200/80 rounded-xl shadow-sm">
          <div>
            <h2 className="font-semibold uppercase tracking-wider text-sm text-black font-sans">1. Purge &amp; Pause Ledger</h2>
            <p className="text-[10px] text-zinc-400 uppercase mt-0.5">Archive entries and enter manual edit window</p>
          </div>
          <div className="border-t border-zinc-200 pt-4 space-y-4">
            <p className="font-sans text-zinc-500 normal-case leading-relaxed">
              This action will clear all document-related journal entries, snapshot a full JSON copy of the GL data for safety, and pause live posting (<span className="font-mono">isGlEnabled = false</span>). Use this state to clean up, modify, or delete legacy documents.
            </p>
            {showPurgeConfirm ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePurgeLedger}
                  disabled={purging || !isGlEnabled}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase px-4 py-2.5 border border-rose-600 rounded-none disabled:opacity-50"
                >
                  {purging ? "PURGING..." : "CONFIRM PURGE & PAUSE"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPurgeConfirm(false)}
                  disabled={purging}
                  className="bg-white hover:bg-zinc-100 text-zinc-700 font-bold uppercase px-4 py-2.5 border border-zinc-300 rounded-none disabled:opacity-50"
                >
                  CANCEL
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPurgeConfirm(true)}
                disabled={purging || !isGlEnabled}
                className="btn-primary-modern bg-black text-white hover:bg-zinc-900 border border-black font-bold uppercase px-4 py-2.5 rounded-none disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Reset &amp; Purge GL
              </button>
            )}
          </div>
        </div>

        {/* REBUILD & REACTIVATE CARD */}
        <div className="card-modern p-6 bg-white space-y-4 border border-zinc-200/80 rounded-xl shadow-sm">
          <div>
            <h2 className="font-semibold uppercase tracking-wider text-sm text-black font-sans">2. Rebuild &amp; Re-activate</h2>
            <p className="text-[10px] text-zinc-400 uppercase mt-0.5">Chronologically reconstruct ledger double-entries</p>
          </div>
          <div className="border-t border-zinc-200 pt-4 space-y-4">
            <p className="font-sans text-zinc-500 normal-case leading-relaxed">
              This action heals credit notes, clears active entries, chronologically recreates double-entry postings for all invoices/vouchers, and re-activates live posting (<span className="font-mono">isGlEnabled = true</span>).
            </p>
            {showRebuildConfirm ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRebuildLedger}
                  disabled={repairing}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase px-4 py-2.5 border border-rose-600 rounded-none disabled:opacity-50"
                >
                  {repairing ? "REBUILDING..." : "CONFIRM REBUILD"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRebuildConfirm(false)}
                  disabled={repairing}
                  className="bg-white hover:bg-zinc-100 text-zinc-700 font-bold uppercase px-4 py-2.5 border border-zinc-300 rounded-none disabled:opacity-50"
                >
                  CANCEL
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowRebuildConfirm(true)}
                disabled={repairing}
                className="btn-primary-modern bg-black text-white hover:bg-zinc-900 border border-black font-bold uppercase px-4 py-2.5 rounded-none disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Rebuild &amp; Re-activate GL
              </button>
            )}
          </div>
        </div>

      </div>

      {/* HISTORICAL LEDGER SNAPSHOTS */}
      {ledgerSnapshots.length > 0 && (
        <div className="card-modern p-6 bg-white space-y-4 border border-zinc-200/80 rounded-xl shadow-sm">
          <div>
            <h2 className="font-semibold uppercase tracking-wider text-sm text-black font-sans">Ledger Backups &amp; Snapshots</h2>
            <p className="text-[10px] text-zinc-400 uppercase mt-0.5">Historical database instances saved before rebuild operations</p>
          </div>
          <div className="border-t border-zinc-200/80 pt-4 overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 uppercase font-semibold text-zinc-600">
                  <th className="p-3 border-r border-zinc-200">Backup Date</th>
                  <th className="p-3 border-r border-zinc-200 text-center">Entries Count</th>
                  <th className="p-3 border-r border-zinc-200">Notes</th>
                  <th className="p-3 text-center">Payload Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {ledgerSnapshots.map((snap) => {
                  const isExpanded = expandedSnapshotId === snap.id;
                  return (
                    <tr key={snap.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="p-3 border-r border-zinc-200/80 font-semibold text-zinc-900">
                        {new Date(snap.createdAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
                      </td>
                      <td className="p-3 border-r border-zinc-200/80 text-center text-black font-bold">
                        {snap.entryCount}
                      </td>
                      <td className="p-3 border-r border-zinc-200/80 text-zinc-500 text-[11px]">
                        {snap.notes || "GL Reset Snapshot"}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => setExpandedSnapshotId(isExpanded ? null : snap.id)}
                          className="text-[10px] font-bold uppercase tracking-wider underline hover:no-underline text-zinc-800"
                        >
                          {isExpanded ? "Hide Data" : "Inspect JSON"}
                        </button>
                        
                        {isExpanded && (
                          <div className="mt-2 text-left bg-zinc-900 text-emerald-400 p-3 rounded overflow-x-auto max-h-60 max-w-lg font-mono text-[9px] select-all">
                            <pre>{JSON.stringify(snap.data, null, 2)}</pre>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
