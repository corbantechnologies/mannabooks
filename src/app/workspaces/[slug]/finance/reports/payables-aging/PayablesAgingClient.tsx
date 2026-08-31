"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export interface SupplierAgingItem {
  supplierId: string;
  supplierName: string;
  email?: string | null;
  phone?: string | null;
  taxPin?: string | null;
  paymentTerms?: string | null;
  currentAmount: number;     // 0-30 days
  days31to60: number;        // 31-60 days
  days61to90: number;        // 61-90 days
  days90Plus: number;        // 90+ days
  totalPayable: number;
  documentsCount: number;
  documents: Array<{
    id: string;
    docNumber: string;
    type: string;
    issueDate: string;
    dueDate?: string | null;
    grandTotal: string;
    status: string;
    daysOverdue: number;
  }>;
}

interface PayablesAgingClientProps {
  shopSlug: string;
  shopName: string;
  currency: string;
  agingData: SupplierAgingItem[];
}

export function PayablesAgingClient({
  shopSlug,
  shopName,
  currency,
  agingData,
}: PayablesAgingClientProps) {
  const [search, setSearch] = useState("");
  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    if (!search.trim()) return agingData;
    const q = search.toLowerCase().trim();
    return agingData.filter((s) => s.supplierName.toLowerCase().includes(q) || (s.taxPin && s.taxPin.toLowerCase().includes(q)));
  }, [agingData, search]);

  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, s) => ({
        current: acc.current + s.currentAmount,
        days31to60: acc.days31to60 + s.days31to60,
        days61to90: acc.days61to90 + s.days61to90,
        days90Plus: acc.days90Plus + s.days90Plus,
        grandTotal: acc.grandTotal + s.totalPayable,
      }),
      { current: 0, days31to60: 0, days61to90: 0, days90Plus: 0, grandTotal: 0 }
    );
  }, [filteredData]);

  const overdueTotal = totals.days31to60 + totals.days61to90 + totals.days90Plus;

  function handleCsvExport() {
    const rows = [
      ["ACCOUNTS PAYABLE AGING REPORT"],
      ["Company:", shopName],
      ["Date Generated:", new Date().toLocaleDateString("en-KE")],
      ["Currency:", currency],
      [],
      ["Supplier Name", "PIN", "Terms", "Current (0-30d)", "31-60 Days", "61-90 Days", "90+ Days", "Total Payable", "Open Docs"],
      ...filteredData.map((s) => [
        `"${s.supplierName}"`,
        s.taxPin || "N/A",
        s.paymentTerms || "NET_30",
        s.currentAmount.toFixed(2),
        s.days31to60.toFixed(2),
        s.days61to90.toFixed(2),
        s.days90Plus.toFixed(2),
        s.totalPayable.toFixed(2),
        s.documentsCount,
      ]),
      [],
      ["TOTALS", "", "", totals.current.toFixed(2), totals.days31to60.toFixed(2), totals.days61to90.toFixed(2), totals.days90Plus.toFixed(2), totals.grandTotal.toFixed(2), ""],
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Payables_Aging_Report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }

  return (
    <div className="space-y-8 font-mono text-xs selection:bg-black selection:text-white">
      {/* HEADER TOP BAR */}
      <div className="border-b border-zinc-200/80 pb-6 space-y-2 print:hidden">
        <Link
          href={`/workspaces/${shopSlug}/finance/reports/pl`}
          className="font-sans text-xs font-bold text-zinc-400 hover:underline block"
        >
          ← Back to Financial Reports
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">
              Procurement &amp; Payables Intelligence
            </span>
            <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">
              Accounts Payable (AP) Aging Report
            </h1>
            <p className="text-xs text-zinc-500 font-sans mt-0.5">
              Outstanding supplier liabilities categorized into chronological aging buckets.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCsvExport}
              disabled={filteredData.length === 0}
              className="px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold border border-zinc-200 bg-white hover:border-zinc-400 transition-colors disabled:opacity-40"
            >
              Export CSV
            </button>
            <button
              onClick={() => window.print()}
              disabled={filteredData.length === 0}
              className="px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold bg-black text-white hover:bg-zinc-800 transition-colors disabled:opacity-40 shadow-sm"
            >
              Print Report
            </button>
          </div>
        </div>
      </div>

      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        <div className="card-modern p-5 space-y-1 border-l-4 border-black bg-white">
          <p className="text-[10px] text-zinc-400 uppercase font-bold">Total Accounts Payable</p>
          <p className="text-xl font-bold font-mono tracking-tight text-black">
            {formatCurrency(totals.grandTotal, currency)}
          </p>
          <p className="text-[10px] text-zinc-500 font-sans">{filteredData.length} active creditors</p>
        </div>

        <div className="card-modern p-5 space-y-1 border-l-4 border-emerald-500 bg-white">
          <p className="text-[10px] text-zinc-400 uppercase font-bold">Current (0–30 Days)</p>
          <p className="text-xl font-bold font-mono tracking-tight text-emerald-700">
            {formatCurrency(totals.current, currency)}
          </p>
          <p className="text-[10px] text-zinc-500 font-sans">Within standard payment terms</p>
        </div>

        <div className="card-modern p-5 space-y-1 border-l-4 border-amber-500 bg-white">
          <p className="text-[10px] text-zinc-400 uppercase font-bold">31–60 Days Overdue</p>
          <p className="text-xl font-bold font-mono tracking-tight text-amber-800">
            {formatCurrency(totals.days31to60, currency)}
          </p>
          <p className="text-[10px] text-zinc-500 font-sans">1–30 days past standard due</p>
        </div>

        <div className="card-modern p-5 space-y-1 border-l-4 border-rose-500 bg-white">
          <p className="text-[10px] text-zinc-400 uppercase font-bold">Critically Overdue (60d+)</p>
          <p className="text-xl font-bold font-mono tracking-tight text-rose-600">
            {formatCurrency(totals.days61to90 + totals.days90Plus, currency)}
          </p>
          <p className="text-[10px] text-rose-700 font-sans font-semibold">Immediate attention needed</p>
        </div>
      </div>

      {/* FILTER SEARCH BAR */}
      <div className="flex items-center gap-3 print:hidden">
        <input
          type="text"
          placeholder="Filter by supplier name or PIN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono w-full max-w-sm focus:outline-none focus:border-black bg-white"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="text-zinc-400 hover:text-black font-bold uppercase text-[10px]"
          >
            Clear
          </button>
        )}
      </div>

      {/* AGING MATRIX TABLE */}
      <div className="card-modern overflow-x-auto bg-white">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
              <th className="p-4 border-r border-zinc-200">Supplier Entity</th>
              <th className="p-4 border-r border-zinc-200 text-center">Terms</th>
              <th className="p-4 border-r border-zinc-200 text-right">Current (0–30d)</th>
              <th className="p-4 border-r border-zinc-200 text-right">31–60 Days</th>
              <th className="p-4 border-r border-zinc-200 text-right">61–90 Days</th>
              <th className="p-4 border-r border-zinc-200 text-right">90+ Days</th>
              <th className="p-4 border-r border-zinc-200 text-right">Total Payable</th>
              <th className="p-4 text-center">Breakdown</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/80 bg-white">
            {filteredData.map((s) => {
              const isExpanded = expandedSupplierId === s.supplierId;
              return (
                <React.Fragment key={s.supplierId}>
                  <tr className="hover:bg-zinc-50/80 transition-colors">
                    <td className="p-4 border-r border-zinc-200/80">
                      <Link
                        href={`/workspaces/${shopSlug}/suppliers/${s.supplierId}`}
                        className="font-bold text-black font-sans uppercase hover:underline text-sm block"
                      >
                        {s.supplierName} ➔
                      </Link>
                      {s.taxPin && <span className="text-[10px] text-zinc-400 block">PIN: {s.taxPin}</span>}
                    </td>
                    <td className="p-4 border-r border-zinc-200/80 text-center text-zinc-500 uppercase text-[10px]">
                      {s.paymentTerms || "NET_30"}
                    </td>
                    <td className="p-4 border-r border-zinc-200/80 text-right font-semibold text-black">
                      {s.currentAmount > 0 ? formatCurrency(s.currentAmount, currency) : "—"}
                    </td>
                    <td className="p-4 border-r border-zinc-200/80 text-right font-semibold text-amber-800">
                      {s.days31to60 > 0 ? formatCurrency(s.days31to60, currency) : "—"}
                    </td>
                    <td className="p-4 border-r border-zinc-200/80 text-right font-semibold text-rose-600">
                      {s.days61to90 > 0 ? formatCurrency(s.days61to90, currency) : "—"}
                    </td>
                    <td className="p-4 border-r border-zinc-200/80 text-right font-black text-rose-700">
                      {s.days90Plus > 0 ? formatCurrency(s.days90Plus, currency) : "—"}
                    </td>
                    <td className="p-4 border-r border-zinc-200/80 text-right font-bold text-sm text-black">
                      {formatCurrency(s.totalPayable, currency)}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => setExpandedSupplierId(isExpanded ? null : s.supplierId)}
                        className="px-2.5 py-1 border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 rounded text-[10px] uppercase font-bold"
                      >
                        {isExpanded ? "▲ Hide" : `▼ ${s.documentsCount} Docs`}
                      </button>
                    </td>
                  </tr>

                  {/* EXPANDABLE DOCUMENT BREAKDOWN */}
                  {isExpanded && (
                    <tr className="bg-zinc-50/50">
                      <td colSpan={8} className="p-4 pl-8 border-b border-zinc-200">
                        <div className="space-y-2">
                          <p className="text-[10px] text-zinc-500 uppercase font-bold">
                            Open Procurement Invoices &amp; Orders for {s.supplierName}:
                          </p>
                          <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white">
                            <table className="w-full text-left font-mono text-[11px]">
                              <thead>
                                <tr className="bg-zinc-100/70 border-b border-zinc-200 text-zinc-500 uppercase text-[9px]">
                                  <th className="p-2">Doc Serial</th>
                                  <th className="p-2">Type</th>
                                  <th className="p-2">Issue Date</th>
                                  <th className="p-2">Due Date</th>
                                  <th className="p-2">Aging Age</th>
                                  <th className="p-2 text-right">Amount</th>
                                  <th className="p-2 text-center">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-100">
                                {s.documents.map((d) => (
                                  <tr key={d.id} className="hover:bg-zinc-50">
                                    <td className="p-2 font-bold text-black">{d.docNumber}</td>
                                    <td className="p-2 uppercase">{d.type}</td>
                                    <td className="p-2 text-zinc-500">{new Date(d.issueDate).toLocaleDateString()}</td>
                                    <td className="p-2 text-zinc-500">{d.dueDate ? new Date(d.dueDate).toLocaleDateString() : "—"}</td>
                                    <td className="p-2">
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                        d.daysOverdue <= 30 ? "bg-emerald-50 text-emerald-800" :
                                        d.daysOverdue <= 60 ? "bg-amber-50 text-amber-900" : "bg-rose-50 text-rose-700"
                                      }`}>
                                        {d.daysOverdue} Days Old
                                      </span>
                                    </td>
                                    <td className="p-2 text-right font-bold text-black">
                                      {formatCurrency(d.grandTotal, currency)}
                                    </td>
                                    <td className="p-2 text-center">
                                      <Link
                                        href={`/workspaces/${shopSlug}/documents/${d.id}`}
                                        className="text-black font-bold uppercase underline hover:no-underline text-[10px]"
                                      >
                                        View →
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

            {filteredData.length === 0 && (
              <tr>
                <td colSpan={8} className="p-12 text-center text-zinc-400 italic">
                  No outstanding accounts payable detected across suppliers.
                </td>
              </tr>
            )}
          </tbody>
          {filteredData.length > 0 && (
            <tfoot>
              <tr className="bg-zinc-100/80 font-bold border-t-2 border-zinc-300">
                <td className="p-4 uppercase text-black">Total Aggregate Payables</td>
                <td className="p-4 text-center">—</td>
                <td className="p-4 text-right text-black">{formatCurrency(totals.current, currency)}</td>
                <td className="p-4 text-right text-amber-900">{formatCurrency(totals.days31to60, currency)}</td>
                <td className="p-4 text-right text-rose-700">{formatCurrency(totals.days61to90, currency)}</td>
                <td className="p-4 text-right text-rose-900">{formatCurrency(totals.days90Plus, currency)}</td>
                <td className="p-4 text-right text-black text-sm">{formatCurrency(totals.grandTotal, currency)}</td>
                <td className="p-4 text-center">—</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
