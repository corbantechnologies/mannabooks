// src/app/workspaces/[slug]/settings/diagnostics/DiagnosticsClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { purgeLedgerAction, repairLedgerAction } from "@/lib/actions/documents";
import { exportWorkspaceDataAction, cleanSlateWorkspaceAction, CleanSlateMode } from "@/lib/actions/reset-workspace";
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
  shopCode?: string | null;
  shopName?: string;
  initialIsGlEnabled: boolean;
  ledgerSnapshots: LedgerSnapshot[];
}

export function DiagnosticsClient({
  shopId,
  shopSlug,
  shopCode = "CONFIRM",
  shopName = "Workspace",
  initialIsGlEnabled,
  ledgerSnapshots = [],
}: DiagnosticsClientProps) {
  const router = useRouter();
  const [isGlEnabled, setIsGlEnabled] = useState(initialIsGlEnabled);
  const [purging, setPurging] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [showRebuildConfirm, setShowRebuildConfirm] = useState(false);
  const [showCleanSlateModal, setShowCleanSlateModal] = useState(false);
  const [cleanSlateMode, setCleanSlateMode] = useState<CleanSlateMode>("ACCOUNTING_ONLY");
  const [confirmationInput, setConfirmationInput] = useState("");
  const [expandedSnapshotId, setExpandedSnapshotId] = useState<string | null>(null);

  const expectedCode = (shopCode || shopSlug).trim().toUpperCase();

  async function handleCleanSlate() {
    if (confirmationInput.trim().toUpperCase() !== expectedCode && confirmationInput.trim().toUpperCase() !== "CONFIRM RESET") {
      toast.error(`Please type "${expectedCode}" to confirm.`);
      return;
    }

    setResetting(true);
    const toastId = toast.loading("1/2: Generating and downloading workspace backup...");
    try {
      // Step 1: Export backup data
      const exportRes = await exportWorkspaceDataAction(shopId);
      if (!exportRes.success || !exportRes.exportData) {
        toast.error(exportRes.error || "Failed to generate backup.", { id: toastId });
        setResetting(false);
        return;
      }

      // Trigger automatic client-side download
      try {
        const jsonStr = JSON.stringify(exportRes.exportData, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = exportRes.filename || `manna_backup_${shopSlug}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (downloadErr) {
        console.warn("Auto-download prompt failed:", downloadErr);
      }

      // Step 2: Execute Clean Slate wipe
      toast.loading("2/2: Executing database clean slate...", { id: toastId });
      const resetRes = await cleanSlateWorkspaceAction(shopId, shopSlug, cleanSlateMode, confirmationInput);

      if (resetRes.success) {
        toast.success("Workspace successfully reset! Backup downloaded.", { id: toastId });
        setShowCleanSlateModal(false);
        setIsGlEnabled(false);
        router.refresh();
        setTimeout(() => window.location.reload(), 1200);
      } else {
        toast.error(resetRes.error || "Reset failed.", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.", { id: toastId });
    } finally {
      setResetting(false);
    }
  }

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
          <span className="text-xs text-zinc-400 font-medium">Ledger Maintenance</span>
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
                className="btn-primary-modern px-3.5 py-2 text-xs font-semibold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
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
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold uppercase px-3.5 py-2 text-xs rounded-md disabled:opacity-50"
                >
                  {repairing ? "REBUILDING..." : "CONFIRM REBUILD"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRebuildConfirm(false)}
                  disabled={repairing}
                  className="btn-secondary-modern px-3.5 py-2 text-xs font-semibold uppercase tracking-wider disabled:opacity-50"
                >
                  CANCEL
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowRebuildConfirm(true)}
                disabled={repairing}
                className="btn-primary-modern px-3.5 py-2 text-xs font-semibold uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Rebuild &amp; Re-activate GL
              </button>
            )}
          </div>
        </div>

      </div>

      {/* 3. CLEAN SLATE & FACTORY RESET SECTION */}
      <div className="card-modern p-6 bg-rose-50/30 border border-rose-200 rounded-xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <h2 className="font-semibold uppercase tracking-wider text-sm text-rose-900 font-sans">
                3. Clean Slate &amp; Factory Reset
              </h2>
            </div>
            <p className="text-[11px] text-rose-700 font-sans mt-1">
              Need to start completely from scratch? Automatically download all documents and business data as a secure JSON archive, then wipe your accounting ledger or workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setConfirmationInput("");
              setShowCleanSlateModal(true);
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase px-5 py-2.5 rounded text-xs shrink-0 tracking-wider shadow-sm transition-colors"
          >
            Start Clean Slate Reset →
          </button>
        </div>
      </div>

      {/* CLEAN SLATE MODAL DIALOG */}
      {showCleanSlateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="space-y-1 border-b border-zinc-100 pb-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase font-bold text-rose-600 tracking-wider">
                  ⚠️ Destructive Operation
                </span>
                <button
                  onClick={() => setShowCleanSlateModal(false)}
                  disabled={resetting}
                  className="text-zinc-400 hover:text-black font-mono text-xs uppercase"
                >
                  ✕ Close
                </button>
              </div>
              <h2 className="text-xl font-bold font-sans text-black tracking-tight">
                Workspace Clean Slate Reset
              </h2>
              <p className="text-xs text-zinc-500 font-sans">
                Choose your reset tier. A complete data archive will be automatically downloaded to your browser before the database wipe is executed.
              </p>
            </div>

            {/* RESET TIER CHOOSER */}
            <div className="space-y-3 font-sans">
              <label className="font-mono text-xs uppercase font-bold text-zinc-600 block">
                Select Reset Tier:
              </label>

              {/* Option A */}
              <div
                onClick={() => setCleanSlateMode("ACCOUNTING_ONLY")}
                className={`p-4 border rounded-xl cursor-pointer transition-all ${
                  cleanSlateMode === "ACCOUNTING_ONLY"
                    ? "border-black bg-zinc-50 ring-1 ring-black"
                    : "border-zinc-200 hover:border-zinc-300 bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="cleanSlateMode"
                    checked={cleanSlateMode === "ACCOUNTING_ONLY"}
                    onChange={() => setCleanSlateMode("ACCOUNTING_ONLY")}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-black">
                        Option A: Fresh Accounting Reset (Recommended)
                      </span>
                      <span className="font-mono text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold uppercase">
                        Preserves Contacts &amp; Catalog
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      Wipes all invoices, receipts, credit notes, quotes, POs, expenses, incomes, payroll runs, journal entries, periods, and budgets. Resets document numbering (e.g. INV-0001).
                    </p>
                    <p className="text-[11px] text-zinc-500 font-medium">
                      ✓ <strong>Keeps untouched:</strong> Products/Services Catalog, Client List, Supplier Directory, Payment Methods, and Workspace Profile.
                    </p>
                  </div>
                </div>
              </div>

              {/* Option B */}
              <div
                onClick={() => setCleanSlateMode("FULL_FACTORY")}
                className={`p-4 border rounded-xl cursor-pointer transition-all ${
                  cleanSlateMode === "FULL_FACTORY"
                    ? "border-rose-600 bg-rose-50/40 ring-1 ring-rose-600"
                    : "border-zinc-200 hover:border-zinc-300 bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="cleanSlateMode"
                    checked={cleanSlateMode === "FULL_FACTORY"}
                    onChange={() => setCleanSlateMode("FULL_FACTORY")}
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-rose-950">
                        Option B: Full Factory Reset (Complete Wipeout)
                      </span>
                      <span className="font-mono text-[9px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold uppercase">
                        Total Wipe
                      </span>
                    </div>
                    <p className="text-xs text-rose-800 leading-relaxed">
                      Wipes all transaction data PLUS all Product/Service items, Clients, Suppliers, and Team invitations.
                    </p>
                    <p className="text-[11px] text-rose-700 font-medium">
                      ✓ <strong>Keeps only:</strong> The Workspace Shop profile and the Owner user account.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* AUTOMATIC BACKUP BANNER */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2 font-sans">
              <span className="text-base">💾</span>
              <span>
                <strong>Automated Pre-Purge Export:</strong> A full JSON backup file (<code className="font-mono text-[10px]">manna_backup_{shopSlug}_*.json</code>) will be generated and saved to your device automatically before data is wiped.
              </span>
            </div>

            {/* CONFIRMATION INPUT */}
            <div className="space-y-2 font-sans border-t border-zinc-200 pt-4">
              <label className="font-mono text-xs uppercase font-bold text-zinc-700 block">
                Type workspace code <span className="underline font-bold text-black">{expectedCode}</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder={`Type "${expectedCode}"`}
                disabled={resetting}
                className="w-full border border-zinc-300 rounded-lg px-3.5 py-2.5 font-mono text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-black bg-white"
              />
            </div>

            {/* MODAL ACTIONS */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-zinc-200 pt-4 font-sans">
              <button
                type="button"
                onClick={() => setShowCleanSlateModal(false)}
                disabled={resetting}
                className="px-4 py-2.5 border border-zinc-300 text-zinc-700 hover:bg-zinc-50 rounded-lg font-bold text-xs uppercase tracking-wider disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCleanSlate}
                disabled={
                  resetting ||
                  (confirmationInput.trim().toUpperCase() !== expectedCode &&
                    confirmationInput.trim().toUpperCase() !== "CONFIRM RESET")
                }
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-2.5 rounded-lg text-xs uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {resetting ? (
                  <>
                    <Spinner className="w-4 h-4 text-white" />
                    <span>Processing Reset...</span>
                  </>
                ) : (
                  <span>Download Backup &amp; Wipe Workspace</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
                <tr className="bg-zinc-50 border-b border-zinc-100 uppercase font-semibold text-zinc-600">
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
                      <td className="p-3 border-r border-zinc-100 font-semibold text-zinc-900">
                        {new Date(snap.createdAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
                      </td>
                      <td className="p-3 border-r border-zinc-100 text-center text-black font-bold">
                        {snap.entryCount}
                      </td>
                      <td className="p-3 border-r border-zinc-100 text-zinc-500 text-[11px]">
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
