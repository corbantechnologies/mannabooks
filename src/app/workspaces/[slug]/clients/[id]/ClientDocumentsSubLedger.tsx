// src/app/workspaces/[slug]/clients/[id]/ClientDocumentsSubLedger.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface ClientDocumentItem {
  id: string;
  docNumber: string;
  type: string;
  issueDate: string | Date;
  grandTotal: string;
  status: string;
  notes?: string | null;
}

interface ClientDocumentsSubLedgerProps {
  documents: ClientDocumentItem[];
  slug: string;
  currency: string;
}

export function ClientDocumentsSubLedger({
  documents,
  slug,
  currency,
}: ClientDocumentsSubLedgerProps) {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const filteredDocs = useMemo(() => {
    let result = documents;

    if (selectedType !== "ALL") {
      result = result.filter((d) => d.type === selectedType);
    }

    if (selectedStatus !== "ALL") {
      result = result.filter((d) => d.status === selectedStatus);
    }

    if (search.trim() !== "") {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (d) =>
          d.docNumber.toLowerCase().includes(q) ||
          (d.notes && d.notes.toLowerCase().includes(q))
      );
    }

    return result;
  }, [documents, search, selectedType, selectedStatus]);

  const hasActiveFilters = search.trim() !== "" || selectedType !== "ALL" || selectedStatus !== "ALL";

  function handleClearFilters() {
    setSearch("");
    setSelectedType("ALL");
    setSelectedStatus("ALL");
  }

  return (
    <div className="space-y-4">
      {/* FILTER CONTROLS */}
      <div className="card-modern p-4 space-y-3 bg-white">
        <div className="flex justify-between items-center border-b border-zinc-200/80 pb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold uppercase tracking-tight text-xs text-black font-sans">
              Filter Client Documents
            </span>
            <span className="badge-zinc text-[9px]">
              {filteredDocs.length} of {documents.length}
            </span>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-[10px] font-semibold text-rose-600 uppercase underline hover:no-underline cursor-pointer"
            >
              Clear Filters ✕
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          {/* TEXT SEARCH */}
          <div className="sm:col-span-6 space-y-1">
            <label className="text-zinc-400 text-[10px] uppercase block font-semibold">
              Search Doc # / Notes
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Instant search by doc number or notes..."
              className="input-modern w-full px-3 py-1.5 text-xs"
            />
          </div>

          {/* TYPE FILTER */}
          <div className="sm:col-span-3 space-y-1">
            <label className="text-zinc-400 text-[10px] uppercase block font-semibold">
              Document Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input-modern w-full px-2 py-1.5 text-xs font-semibold"
            >
              <option value="ALL">All Types</option>
              <option value="INVOICE">Invoices</option>
              <option value="RECEIPT">Receipts</option>
              <option value="QUOTATION">Quotations</option>
              <option value="DELIVERY_NOTE">Delivery Notes</option>
              <option value="CREDIT_NOTE">Credit Notes</option>
              <option value="DEBIT_NOTE">Debit Notes</option>
              <option value="LPO">Purchase Orders (LPO)</option>
            </select>
          </div>

          {/* STATUS FILTER */}
          <div className="sm:col-span-3 space-y-1">
            <label className="text-zinc-400 text-[10px] uppercase block font-semibold">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-modern w-full px-2 py-1.5 text-xs font-semibold"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="ISSUED">Issued</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="RECEIVED">Received</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* INSTANTLY FILTERED DOCUMENTS TABLE */}
      <div className="card-modern overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
              <th className="p-4 border-r border-zinc-200">Document #</th>
              <th className="p-4 border-r border-zinc-200">Type</th>
              <th className="p-4 border-r border-zinc-200">Date</th>
              <th className="p-4 border-r border-zinc-200 text-right">Total Amount</th>
              <th className="p-4 border-r border-zinc-200 text-center">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/80 bg-white">
            {filteredDocs.map((doc) => (
              <tr key={doc.id} className="hover:bg-zinc-50/80 transition-colors">
                <td className="p-4 border-r border-zinc-200/80 font-semibold text-black tracking-wider">
                  <Link
                    href={`/workspaces/${slug}/documents/${doc.id}`}
                    className="hover:underline underline-offset-2"
                  >
                    {doc.docNumber}
                  </Link>
                </td>
                <td className="p-4 border-r border-zinc-200/80">
                  <span className="badge-zinc">
                    {doc.type}
                  </span>
                </td>
                <td className="p-4 border-r border-zinc-200/80 text-zinc-500 font-sans">
                  {new Date(doc.issueDate).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                </td>
                <td className="p-4 border-r border-zinc-200/80 font-semibold text-sm text-black text-right font-mono">
                  {formatCurrency(doc.grandTotal, currency)}
                </td>
                <td className="p-4 border-r border-zinc-200/80 text-center">
                  <span
                    className={
                      doc.status === "PAID"
                        ? "badge-emerald"
                        : doc.status === "ISSUED"
                        ? "badge-zinc"
                        : doc.status === "OVERDUE"
                        ? "badge-rose"
                        : doc.status === "DRAFT"
                        ? "badge-amber"
                        : "badge-zinc text-zinc-400"
                    }
                  >
                    {doc.status}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <Link
                    href={`/workspaces/${slug}/documents/${doc.id}`}
                    className="btn-secondary-modern px-2.5 py-1 text-[10px] font-semibold uppercase inline-block"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}

            {filteredDocs.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-zinc-400 italic font-sans text-xs">
                  {hasActiveFilters
                    ? "No documents match the current filter criteria."
                    : "No documents found for this client."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
