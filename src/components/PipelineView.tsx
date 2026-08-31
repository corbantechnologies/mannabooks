"use client";

import { useState } from "react";
import Link from "next/link";

interface PipelineDoc {
  id: string;
  docNumber: string;
  type: string;
  status: string;
  grandTotal: string;
  issueDate: string;
  clientName?: string;
  slug: string;
}

interface PipelineViewProps {
  docs: PipelineDoc[];
  currency: string;
}

const STATUS_COLUMNS = [
  { key: "DRAFT", label: "Draft", color: "bg-zinc-100 border-zinc-200", dot: "bg-zinc-400" },
  { key: "ISSUED", label: "Issued", color: "bg-blue-50 border-blue-200", dot: "bg-blue-500" },
  { key: "OVERDUE", label: "Overdue", color: "bg-rose-50 border-rose-200", dot: "bg-rose-500" },
  { key: "PARTIALLY_PAID", label: "Partial", color: "bg-amber-50 border-amber-200", dot: "bg-amber-500" },
  { key: "PAID", label: "Paid", color: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  { key: "CANCELLED", label: "Cancelled", color: "bg-zinc-100 border-zinc-200", dot: "bg-zinc-300" },
];

function formatK(val: string | number): string {
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toFixed(0);
}

export function PipelineView({ docs, currency }: PipelineViewProps) {
  return (
    <div className="overflow-x-auto -mx-4 px-4 pb-4">
      <div className="flex gap-3 min-w-max">
        {STATUS_COLUMNS.map((col) => {
          const colDocs = docs.filter((d) => d.status === col.key);
          const total = colDocs.reduce((acc, d) => acc + parseFloat(d.grandTotal || "0"), 0);

          return (
            <div key={col.key} className={`flex flex-col gap-2 rounded-xl border ${col.color} p-3 w-56 min-h-[200px]`}>
              {/* Column header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-700">
                    {col.label}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-zinc-400 font-bold">
                  {colDocs.length}
                </span>
              </div>

              {/* Total value */}
              {total > 0 && (
                <div className="font-mono text-[11px] text-zinc-600 font-bold border-b border-zinc-200/60 pb-2 mb-1">
                  {currency} {formatK(total)}
                </div>
              )}

              {/* Cards */}
              <div className="flex flex-col gap-2 flex-1">
                {colDocs.length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-[10px] text-zinc-400 italic font-sans">
                    No documents
                  </div>
                )}
                {colDocs.map((d) => (
                  <Link
                    key={d.id}
                    href={`/workspaces/${d.slug}/documents/${d.id}`}
                    className="block bg-white border border-zinc-200 hover:border-zinc-400 rounded-lg p-2.5 no-underline transition-all hover:shadow-sm group"
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="font-mono text-[10px] font-black text-black group-hover:underline">
                        {d.docNumber}
                      </span>
                      <span className="font-mono text-[9px] text-zinc-400 border border-zinc-200 px-1 rounded bg-zinc-50 whitespace-nowrap">
                        {d.type}
                      </span>
                    </div>
                    {d.clientName && (
                      <p className="font-sans text-[10px] text-zinc-600 mt-1 truncate">{d.clientName}</p>
                    )}
                    <p className="font-mono text-[11px] font-bold text-black mt-1">
                      {currency} {formatK(d.grandTotal)}
                    </p>
                    <p className="font-sans text-[9px] text-zinc-400 mt-0.5">
                      {new Date(d.issueDate).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
