"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { formatCurrency, isFiscalDocType } from "@/lib/utils";
import toast from "react-hot-toast";
import { bulkDispatchDocumentEmails } from "@/lib/actions/email";
import { bulkUpdateDocumentStatusAction } from "@/lib/actions/documents";

export interface ParentDocSummary {
  id: string;
  docNumber: string;
  type: string;
  status: string;
  grandTotal: string;
  issueDate: string;
}

export interface StreamDocument {
  id: string;
  docNumber: string;
  type: string;
  status: string;
  grandTotal: string;
  issueDate: string;
  parentDocumentId?: string | null;
  parentDocument?: ParentDocSummary | null;
  requiresEtims?: boolean;
  kraCuInvoiceNumber?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentSize?: number | null;
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
  // Default to GROUPED when viewing ALL documents, or FLAT when on specific type tabs
  const [viewMode, setViewMode] = useState<"GROUPED" | "FLAT">(
    activeType === "ALL" ? "GROUPED" : "FLAT"
  );
  const [expandedChains, setExpandedChains] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEmailing, setIsBulkEmailing] = useState(false);
  const [isBulkZipping, setIsBulkZipping] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Fast lookup by ID
  const docMap = useMemo(() => {
    const map = new Map<string, StreamDocument>();
    for (const d of documents) {
      map.set(d.id, d);
    }
    return map;
  }, [documents]);

  // Set of all document IDs that have been referenced as a parent
  // If an ID is in this set, a child document exists for it
  const parentIdSet = useMemo(() => {
    const set = new Set<string>();
    for (const d of documents) {
      if (d.parentDocumentId) {
        set.add(d.parentDocumentId);
      }
    }
    return set;
  }, [documents]);

  // Map each parent doc ID to its child documents (for forward conversion references)
  const childMap = useMemo(() => {
    const map = new Map<string, StreamDocument[]>();
    for (const d of documents) {
      if (d.parentDocumentId) {
        const list = map.get(d.parentDocumentId) || [];
        list.push(d);
        map.set(d.parentDocumentId, list);
      }
    }
    return map;
  }, [documents]);

  // Helper to retrieve full chronological ancestor chain for any document
  // Returns [oldestAncestor, ..., immediateParent]
  const getDocAncestors = (doc: StreamDocument): (StreamDocument | ParentDocSummary)[] => {
    const ancestors: (StreamDocument | ParentDocSummary)[] = [];
    const visited = new Set<string>([doc.id]);
    let currParentId = doc.parentDocumentId;
    let immediateParentSnapshot = doc.parentDocument;

    while (currParentId) {
      if (visited.has(currParentId)) break; // cycle protection
      visited.add(currParentId);

      const parentInDataset = docMap.get(currParentId);
      if (parentInDataset) {
        ancestors.unshift(parentInDataset);
        currParentId = parentInDataset.parentDocumentId;
      } else if (immediateParentSnapshot && immediateParentSnapshot.id === currParentId) {
        ancestors.unshift(immediateParentSnapshot);
        break;
      } else {
        break;
      }
    }
    return ancestors;
  };

  // Filter visible documents based on viewMode
  // In GROUPED mode (when in "ALL"), we only show terminal documents (docs not superseded by a child)
  const visibleDocs = useMemo(() => {
    if (viewMode === "GROUPED" && activeType === "ALL") {
      return documents.filter((doc) => !parentIdSet.has(doc.id));
    }
    return documents;
  }, [documents, viewMode, activeType, parentIdSet]);

  // Count of terminal / chain docs
  const terminalDocsCount = useMemo(() => {
    return documents.filter((doc) => !parentIdSet.has(doc.id)).length;
  }, [documents, parentIdSet]);

  // Toggle single accordion chain
  function toggleChain(docId: string) {
    const next = new Set(expandedChains);
    if (next.has(docId)) {
      next.delete(docId);
    } else {
      next.add(docId);
    }
    setExpandedChains(next);
  }

  // Find which visible docs have ancestors for "Expand All"
  const docsWithAncestors = useMemo(() => {
    return visibleDocs.filter((d) => Boolean(d.parentDocumentId || d.parentDocument));
  }, [visibleDocs]);

  const isAllExpanded =
    docsWithAncestors.length > 0 &&
    docsWithAncestors.every((d) => expandedChains.has(d.id));

  function toggleAllChains() {
    if (isAllExpanded) {
      setExpandedChains(new Set());
    } else {
      setExpandedChains(new Set(docsWithAncestors.map((d) => d.id)));
    }
  }

  // Bulk Selection Logic on currently visible docs
  const visibleDocIds = useMemo(() => visibleDocs.map((d) => d.id), [visibleDocs]);
  const isAllSelected = visibleDocs.length > 0 && selectedIds.size === visibleDocs.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < visibleDocs.length;

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleDocIds));
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
        toast.success(
          `Successfully sent ${res.sent} document emails!${res.failed > 0 ? ` (${res.failed} skipped/no email)` : ""}`,
          { id: toastId }
        );
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

      {/* VIEW MODE & CHAIN CONTROLS TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {activeType === "ALL" ? (
            <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode("GROUPED")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-xs transition-all ${
                  viewMode === "GROUPED"
                    ? "bg-white text-zinc-950 shadow-xs font-semibold"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <span>🗂️</span>
                <span>Grouped (Chains)</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    viewMode === "GROUPED"
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-200 text-zinc-700"
                  }`}
                >
                  {terminalDocsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("FLAT")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-xs transition-all ${
                  viewMode === "FLAT"
                    ? "bg-white text-zinc-950 shadow-xs font-semibold"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <span>📄</span>
                <span>Flat List</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    viewMode === "FLAT"
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-200 text-zinc-700"
                  }`}
                >
                  {documents.length}
                </span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-zinc-500 font-sans text-xs">
              <span className="font-semibold text-zinc-900">
                {documents.length} {docTypeTabs.find((t) => t.key === activeType)?.label || activeType}s
              </span>
              <span>• Lineage indicators enabled</span>
            </div>
          )}

          {viewMode === "GROUPED" && activeType === "ALL" && (
            <span className="hidden sm:inline-block text-[11px] text-zinc-500 font-sans">
              Showing terminal documents in active chains. Parent quotes & invoices are nested in expandable drawers.
            </span>
          )}
        </div>

        {viewMode === "GROUPED" && activeType === "ALL" && docsWithAncestors.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleAllChains}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition-colors shadow-2xs font-sans"
            >
              {isAllExpanded ? "Collapse All Chains" : "Expand All Chains"}
            </button>
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="surface overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-2xs">
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
              <th className="px-4 py-3 border-r border-zinc-100">Serial No & Lineage</th>
              <th className="px-4 py-3 border-r border-zinc-100">Type</th>
              <th className="px-4 py-3 border-r border-zinc-100">Client / Party</th>
              <th className="px-4 py-3 border-r border-zinc-100">Date Issued</th>
              <th className="px-4 py-3 border-r border-zinc-100 text-right">Total</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-zinc-100/80">
            {visibleDocs.map((doc) => {
              const isSelected = selectedIds.has(doc.id);
              const ancestors = getDocAncestors(doc);
              const hasAncestors = ancestors.length > 0;
              const isExpanded = expandedChains.has(doc.id);
              const childDocs = childMap.get(doc.id) || [];

              return (
                <React.Fragment key={doc.id}>
                  <tr
                    className={`hover:bg-zinc-50 transition-colors ${
                      isSelected ? "bg-zinc-50/80" : ""
                    } ${isExpanded ? "bg-zinc-50/50" : ""}`}
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-4 w-10 text-center border-r border-zinc-100">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(doc.id)}
                        className="rounded border-zinc-300 text-black focus:ring-black cursor-pointer"
                      />
                    </td>

                    {/* Serial No & Lineage Controls */}
                    <td className="p-4 border-r border-zinc-100 font-semibold text-black tracking-wider">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {hasAncestors && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleChain(doc.id);
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-medium flex items-center gap-1 transition-colors border cursor-pointer ${
                                isExpanded
                                  ? "bg-zinc-900 text-white border-zinc-900 shadow-2xs"
                                  : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200"
                              }`}
                              title={
                                isExpanded
                                  ? "Collapse parent lineage drawer"
                                  : `Click to view ${ancestors.length} parent document(s)`
                              }
                            >
                              <span
                                className={`inline-block text-[8px] transition-transform duration-150 ${
                                  isExpanded ? "rotate-90" : ""
                                }`}
                              >
                                ▶
                              </span>
                              <span>
                                {ancestors.length} {ancestors.length === 1 ? "parent" : "parents"}
                              </span>
                            </button>
                          )}

                          <Link
                            href={`/workspaces/${slug}/documents/${doc.id}`}
                            className="hover:underline text-zinc-900 font-bold"
                          >
                            {doc.docNumber}
                          </Link>
                          {doc.attachmentUrl && (
                            <a
                              href={doc.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-700 hover:text-emerald-900 text-xs px-1 hover:bg-emerald-50 rounded no-underline ml-1"
                              title={`Attached Receipt / Document: ${doc.attachmentName || 'View'}`}
                            >
                              📎
                            </a>
                          )}
                        </div>

                        {/* Lineage Summary Hints */}
                        {hasAncestors && !isExpanded && (
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-sans">
                            <span className="text-zinc-400">Originated from:</span>
                            <span className="font-mono text-zinc-700 font-medium bg-zinc-100 px-1 py-0.2 rounded border border-zinc-200">
                              {ancestors[ancestors.length - 1].docNumber} ({ancestors[ancestors.length - 1].type})
                            </span>
                          </div>
                        )}

                        {/* Flat View Forward Conversion Hint */}
                        {childDocs.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-emerald-700 font-sans">
                            <span>↳ Progressed to:</span>
                            {childDocs.map((cd) => (
                              <Link
                                key={cd.id}
                                href={`/workspaces/${slug}/documents/${cd.id}`}
                                className="font-mono font-semibold underline hover:text-emerald-950 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200"
                              >
                                {cd.docNumber} ({cd.type})
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td className="p-4 border-r border-zinc-100">
                      <span className="badge-zinc">{doc.type}</span>
                    </td>

                    {/* Client / Party */}
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

                    {/* Date Issued */}
                    <td className="px-4 py-3 border-r border-zinc-100 text-zinc-500">
                      {new Date(doc.issueDate).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                    </td>

                    {/* Grand Total */}
                    <td className="px-4 py-3 border-r border-zinc-100 font-semibold text-sm text-zinc-900 text-right">
                      {formatCurrency(doc.grandTotal, currency)}
                    </td>

                    {/* Status */}
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

                  {/* EXPANDABLE ACCORDION DRAWER FOR PARENT DOCUMENTS */}
                  {isExpanded && hasAncestors && (
                    <tr className="bg-zinc-50/80 border-b border-zinc-200">
                      <td colSpan={7} className="p-0">
                        <div className="p-4 pl-10 pr-6 space-y-3 bg-gradient-to-r from-zinc-50/90 via-zinc-50/40 to-white border-l-4 border-l-zinc-900 animate-in fade-in duration-150">
                          {/* Trail Breadcrumb Header */}
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex flex-wrap items-center gap-2 font-sans font-semibold text-zinc-800">
                              <span className="text-zinc-500 text-xs">Lineage Trail:</span>
                              <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                                {ancestors.map((anc) => (
                                  <React.Fragment key={anc.id}>
                                    <Link
                                      href={`/workspaces/${slug}/documents/${anc.id}`}
                                      className="px-2 py-0.5 rounded bg-white border border-zinc-200 hover:border-black hover:text-black text-zinc-700 transition-colors font-semibold shadow-2xs"
                                    >
                                      {anc.docNumber}{" "}
                                      <span className="text-[10px] font-normal text-zinc-500">
                                        ({anc.type})
                                      </span>
                                    </Link>
                                    <span className="text-zinc-400">➔</span>
                                  </React.Fragment>
                                ))}
                                <span className="px-2 py-0.5 rounded bg-zinc-900 text-white font-semibold shadow-2xs">
                                  {doc.docNumber}{" "}
                                  <span className="text-[10px] font-normal text-zinc-300">
                                    ({doc.type} • Current Terminal)
                                  </span>
                                </span>
                              </div>
                            </div>
                            <span className="text-[11px] text-zinc-500 font-sans">
                              {ancestors.length} prior {ancestors.length === 1 ? "document" : "documents"} in this transaction cycle
                            </span>
                          </div>

                          {/* Nested Sub-Table of Ancestor Documents */}
                          <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-2xs">
                            <table className="w-full text-left font-mono text-[11px]">
                              <thead>
                                <tr className="border-b border-zinc-100 bg-zinc-50/80 text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                                  <th className="px-3 py-2">Role In Deal</th>
                                  <th className="px-3 py-2">Document #</th>
                                  <th className="px-3 py-2">Type</th>
                                  <th className="px-3 py-2">Date Issued</th>
                                  <th className="px-3 py-2 text-right">Amount</th>
                                  <th className="px-3 py-2 text-center">Status</th>
                                  <th className="px-3 py-2 text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-100 font-sans">
                                {ancestors.map((anc, idx) => (
                                  <tr key={anc.id} className="hover:bg-zinc-50/60 transition-colors">
                                    <td className="px-3 py-2 text-zinc-600 font-medium text-[11px]">
                                      {idx === 0 ? "🌱 Originating Document" : `↳ Milestone Step ${idx + 1}`}
                                    </td>
                                    <td className="px-3 py-2 font-mono font-semibold text-zinc-900">
                                      <Link
                                        href={`/workspaces/${slug}/documents/${anc.id}`}
                                        className="hover:underline flex items-center gap-1"
                                      >
                                        <span>{anc.docNumber}</span>
                                        <span className="text-zinc-400 text-[10px]">↗</span>
                                      </Link>
                                    </td>
                                    <td className="px-3 py-2 font-mono">
                                      <span className="badge-zinc text-[10px]">{anc.type}</span>
                                    </td>
                                    <td className="px-3 py-2 text-zinc-500">
                                      {new Date(anc.issueDate).toLocaleDateString("en-KE", {
                                        dateStyle: "medium",
                                      })}
                                    </td>
                                    <td className="px-3 py-2 font-mono font-semibold text-right text-zinc-900">
                                      {formatCurrency(anc.grandTotal, currency)}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <span
                                        className={`border px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase rounded ${
                                          anc.status === "PAID"
                                            ? "badge-emerald"
                                            : anc.status === "ISSUED"
                                            ? "badge-zinc"
                                            : anc.status === "OVERDUE"
                                            ? "badge-rose"
                                            : "badge-zinc"
                                        }`}
                                      >
                                        {anc.status}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      <Link
                                        href={`/workspaces/${slug}/documents/${anc.id}`}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-zinc-200 hover:border-black hover:bg-zinc-900 hover:text-white text-zinc-700 text-[11px] font-medium transition-colors font-sans"
                                      >
                                        <span>Open</span>
                                        <span>➔</span>
                                      </Link>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {visibleDocs.length === 0 && (
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
