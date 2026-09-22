"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { formatCurrency, isFiscalDocType } from "@/lib/utils";
import toast from "react-hot-toast";
import { bulkDispatchDocumentEmails } from "@/lib/actions/email";
import { bulkUpdateDocumentStatusAction } from "@/lib/actions/documents";

export interface StreamDocument {
  id: string;
  docNumber: string;
  type: string;
  status: string;
  grandTotal: string;
  issueDate: string;
  requiresEtims?: boolean;
  kraCuInvoiceNumber?: string | null;
  client?: { id: string; name: string; email?: string | null; phone?: string | null; taxPin?: string | null } | null;
  supplier?: { id: string; name: string; email?: string | null; phone?: string | null; taxPin?: string | null } | null;
}

interface DocumentsTableClientProps {
  slug: string;
  currency: string;
  activeType: string;
  documents: StreamDocument[];
  docTypeTabs: Array<{ key: string; label: string }>;
}

export function DocumentsTableClient({
  slug,
  currency,
  activeType,
  documents,
  docTypeTabs,
}: DocumentsTableClientProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEmailing, setIsBulkEmailing] = useState(false);
  const [isBulkZipping, setIsBulkZipping] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const allIds = useMemo(() => documents.map((d) => d.id), [documents]);
  const isAllSelected = documents.length > 0 && selectedIds.size === documents.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < documents.length;

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  }

  // Action 1: Bulk Email
  async function handleBulkEmail() {
    if (selectedIds.size === 0) return;
    setIsBulkEmailing(true);
    const toastId = toast.loading(`Dispatching emails for ${selectedIds.size} documents...`);

    try {
      const res = await bulkDispatchDocumentEmails(Array.from(selectedIds));
      if (res.sent > 0) {
        toast.success(`Successfully sent ${res.sent} document emails!${res.failed > 0 ? ` (${res.failed} skipped/no email)` : ""}`, { id: toastId });
      } else {
        toast.error(`Email delivery failed: ${res.errors[0] || "No valid recipient email"}`, { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch bulk emails", { id: toastId });
    } finally {
      setIsBulkEmailing(false);
    }
  }

  // Action 2: Bulk PDF ZIP Download
  async function handleBulkZip() {
    if (selectedIds.size === 0) return;
    setIsBulkZipping(true);
    const toastId = toast.loading(`Generating ZIP archive for ${selectedIds.size} vector PDFs...`);

    try {
      const res = await fetch(`/api/workspaces/${slug}/documents/bulk-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIds: Array.from(selectedIds) }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to compile bulk PDF archive.");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `MannaBooks_${slug}_Batch_${new Date().toISOString().split("T")[0]}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`Downloaded archive of ${selectedIds.size} PDFs!`, { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to download ZIP.", { id: toastId });
    } finally {
      setIsBulkZipping(false);
    }
  }

  // Action 3: Batch Payment / Payout Run Manifest (Bank EFT / M-Pesa CSV)
  function handleGeneratePaymentManifest() {
    if (selectedIds.size === 0) return;

    const selectedDocs = documents.filter((d) => selectedIds.has(d.id));
    const totalPayout = selectedDocs.reduce((acc, d) => acc + parseFloat(d.grandTotal || "0"), 0);

    const rows = [
      ["BATCH PAYMENT / DISBURSEMENT RUN MANIFEST"],
      ["Workspace:", slug],
      ["Date Generated:", new Date().toLocaleDateString("en-KE", { dateStyle: "long" })],
      ["Disbursement Count:", selectedDocs.length.toString()],
      ["Total Value:", `${currency} ${totalPayout.toFixed(2)}`],
      [],
      [
        "Beneficiary Name",
        "Document Number",
        "Document Type",
        "Beneficiary Phone / Account",
        "Tax PIN",
        "Currency",
        "Amount Due",
        "Status",
        "Disbursement Channel",
        "Notes / Remarks",
      ],
      ...selectedDocs.map((d) => {
        const party = d.supplier?.name || d.client?.name || "Direct Vendor";
        const phoneOrAcc = d.supplier?.phone || d.client?.phone || "N/A";
        const taxPin = d.supplier?.taxPin || d.client?.taxPin || "N/A";

        return [
          `"${party.replace(/"/g, '""')}"`,
          d.docNumber,
          d.type,
          phoneOrAcc,
          taxPin,
          currency,
          parseFloat(d.grandTotal || "0").toFixed(2),
          d.status,
          "BANK_EFT / MPESA_B2B",
          `Payment for ${d.docNumber}`,
        ];
      }),
      [],
      ["TOTAL DISBURSEMENT", "", "", "", "", currency, totalPayout.toFixed(2), "", "", ""],
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Batch_Payment_Run_${slug}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Generated batch payment manifest for ${selectedDocs.length} payees!`);
  }

  // Action 4: Bulk Status Update
  async function handleBulkStatus(newStatus: "DRAFT" | "ISSUED" | "PAID" | "CANCELLED") {
    if (selectedIds.size === 0) return;
    if (!confirm(`Mark ${selectedIds.size} selected documents as ${newStatus}?`)) return;

    setIsBulkUpdating(true);
    const toastId = toast.loading(`Updating ${selectedIds.size} documents...`);

    try {
      const res = await bulkUpdateDocumentStatusAction({
        documentIds: Array.from(selectedIds),
        newStatus,
        shopSlug: slug,
      });

      if (!res.success) {
        toast.error(res.error || "Bulk update failed", { id: toastId });
      } else {
        toast.success(`Updated ${res.updatedCount} documents to ${newStatus}!`, { id: toastId });
        setSelectedIds(new Set());
      }
    } catch (err: any) {
      toast.error(err.message || "Bulk update failed", { id: toastId });
    } finally {
      setIsBulkUpdating(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* FLOATING BULK ACTIONS BAR */}
      {selectedIds.size > 0 && (
        <div className="sticky top-2 z-30 flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-950 text-white rounded-xl shadow-2xl border border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-black font-mono font-bold text-xs flex items-center justify-center">
              {selectedIds.size}
            </span>
            <span className="text-xs font-semibold">
              {selectedIds.size === 1 ? "1 document selected" : `${selectedIds.size} documents selected`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Email */}
            <button
              onClick={handleBulkEmail}
              disabled={isBulkEmailing}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>📧</span>
              <span>{isBulkEmailing ? "Sending..." : "Bulk Email"}</span>
            </button>

            {/* ZIP Download */}
            <button
              onClick={handleBulkZip}
              disabled={isBulkZipping}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>📦</span>
              <span>{isBulkZipping ? "Zipping..." : "Export ZIP"}</span>
            </button>

            {/* Batch Payment Manifest */}
            <button
              onClick={handleGeneratePaymentManifest}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium transition-colors flex items-center gap-1.5"
              title="Export Bank EFT / M-Pesa B2B Payout CSV"
            >
              <span>💳</span>
              <span>Payment Run (CSV)</span>
            </button>

            {/* Status Dropdown */}
            <div className="flex items-center gap-1 border-l border-zinc-800 pl-2">
              <button
                onClick={() => handleBulkStatus("PAID")}
                disabled={isBulkUpdating}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-semibold transition-colors disabled:opacity-50"
              >
                Mark Paid
              </button>
              <button
                onClick={() => handleBulkStatus("CANCELLED")}
                disabled={isBulkUpdating}
                className="px-2.5 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 font-semibold transition-colors disabled:opacity-50"
              >
                Void
              </button>
            </div>

            {/* Clear Selection */}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-2 py-1.5 text-zinc-400 hover:text-white transition-colors text-xs"
              title="Clear selection"
            >
              ✕ Clear
            </button>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="surface overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-wide font-semibold text-zinc-400 bg-zinc-50/60">
              <th className="px-3 py-3 w-10 text-center border-r border-zinc-100">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isSomeSelected;
                  }}
                  onChange={toggleSelectAll}
                  className="rounded border-zinc-300 text-black focus:ring-black cursor-pointer"
                  title="Select All"
                />
              </th>
              <th className="px-4 py-3 border-r border-zinc-100">Serial No</th>
              <th className="px-4 py-3 border-r border-zinc-100">Type</th>
              <th className="px-4 py-3 border-r border-zinc-100">Client / Party</th>
              <th className="px-4 py-3 border-r border-zinc-100">Date Issued</th>
              <th className="px-4 py-3 border-r border-zinc-100 text-right">Total</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {documents.map((doc) => {
              const isSelected = selectedIds.has(doc.id);
              return (
                <tr
                  key={doc.id}
                  className={`hover:bg-zinc-50 transition-colors border-b border-zinc-100/80 last:border-0 ${
                    isSelected ? "bg-zinc-50/80" : ""
                  }`}
                >
                  <td className="px-3 py-4 w-10 text-center border-r border-zinc-100">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(doc.id)}
                      className="rounded border-zinc-300 text-black focus:ring-black cursor-pointer"
                    />
                  </td>

                  <td className="p-4 border-r border-zinc-100 font-semibold text-black tracking-wider">
                    <Link href={`/workspaces/${slug}/documents/${doc.id}`} className="hover:underline">
                      {doc.docNumber}
                    </Link>
                  </td>

                  <td className="p-4 border-r border-zinc-100">
                    <span className="badge-zinc">{doc.type}</span>
                  </td>

                  <td className="px-4 py-3 border-r border-zinc-100 font-sans text-sm font-semibold text-zinc-900">
                    {doc.client ? (
                      <Link
                        href={`/workspaces/${slug}/clients/${doc.client.id}`}
                        className="hover:underline text-black font-semibold"
                      >
                        {doc.client.name} ➔
                      </Link>
                    ) : doc.supplier ? (
                      <Link
                        href={`/workspaces/${slug}/suppliers/${doc.supplier.id}`}
                        className="hover:underline text-zinc-700"
                      >
                        {doc.supplier.name} ➔
                      </Link>
                    ) : doc.type === "PAYROLL_VOUCHER" ? (
                      "Staff Payroll"
                    ) : (
                      "Walk-in Customer"
                    )}
                  </td>

                  <td className="px-4 py-3 border-r border-zinc-100 text-zinc-400">
                    {new Date(doc.issueDate).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                  </td>

                  <td className="px-4 py-3 border-r border-zinc-100 font-semibold text-sm text-zinc-900 text-right">
                    {formatCurrency(doc.grandTotal, currency)}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col gap-1 items-center">
                      <span
                        className={`border px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded ${
                          doc.status === "PAID"
                            ? "badge-emerald"
                            : doc.status === "ISSUED"
                            ? "badge-zinc"
                            : doc.status === "OVERDUE"
                            ? "badge-rose"
                            : "badge-zinc"
                        }`}
                      >
                        {doc.status}
                      </span>
                      {isFiscalDocType(doc.type) && doc.requiresEtims && !doc.kraCuInvoiceNumber && (
                        <span className="border border-amber-300 bg-amber-50 text-amber-900 px-1.5 py-0.5 text-[9px] font-semibold tracking-tight uppercase whitespace-nowrap rounded">
                          ⚠️ eTIMS CU Pending
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {documents.length === 0 && (
              <tr>
                <td colSpan={7} className="p-16 text-center">
                  <div className="space-y-3">
                    <p className="font-bold text-zinc-800 text-sm font-sans">
                      {activeType !== "ALL"
                        ? `No ${docTypeTabs.find((t) => t.key === activeType)?.label || activeType}s found`
                        : "No documents yet"}
                    </p>
                    <p className="text-zinc-400 text-xs font-sans max-w-xs mx-auto leading-relaxed">
                      {activeType === "QUOTATION"
                        ? "Create your first quote and convert it to an invoice in one click."
                        : activeType === "INVOICE"
                        ? "Generate your first invoice or convert an existing quotation."
                        : "Start by generating a document for your workspace."}
                    </p>
                    <Link
                      href={`/workspaces/${slug}/documents/new`}
                      className="btn-primary-modern px-4 py-2 text-xs font-semibold uppercase inline-block mt-2"
                    >
                      + Generate Document
                    </Link>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
