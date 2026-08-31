"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

export interface WeekRevenueBucket {
  label: string;
  startDate: string;
  endDate: string;
  paidAmount: number;
  issuedAmount: number;
}

interface DashboardRevenueChartProps {
  weeks: WeekRevenueBucket[];
  currency: string;
}

export function DashboardRevenueChart({ weeks, currency }: DashboardRevenueChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxVal = Math.max(
    ...weeks.map((w) => Math.max(w.paidAmount, w.issuedAmount)),
    1000
  );

  const totalPaid = weeks.reduce((sum, w) => sum + w.paidAmount, 0);
  const totalIssued = weeks.reduce((sum, w) => sum + w.issuedAmount, 0);

  return (
    <div className="card-modern p-5 sm:p-6 bg-white space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200/80 pb-4">
        <div>
          <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Cash Flow Dynamics</span>
          <h2 className="text-sm font-bold uppercase tracking-tight text-black font-sans mt-0.5">
            30-Day Revenue &amp; Billing Trajectory
          </h2>
          <p className="font-sans text-xs text-zinc-500 mt-0.5">
            Weekly breakdown of settled collections vs. newly billed invoice commitments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono font-bold">
          <span className="flex items-center gap-1.5 text-zinc-800">
            <span className="w-3 h-3 bg-black inline-block rounded-xs" />
            <span>COLLECTED ({formatCurrency(totalPaid, currency)})</span>
          </span>
          <span className="flex items-center gap-1.5 text-zinc-500">
            <span className="w-3 h-3 bg-zinc-300 inline-block rounded-xs" />
            <span>BILLED ({formatCurrency(totalIssued, currency)})</span>
          </span>
        </div>
      </div>

      {/* Chart visualization */}
      <div className="relative pt-6">
        <div className="grid grid-cols-4 gap-3 sm:gap-6 items-end h-48">
          {weeks.map((w, idx) => {
            const paidPct = Math.min((w.paidAmount / maxVal) * 100, 100);
            const issuedPct = Math.min((w.issuedAmount / maxVal) * 100, 100);
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                className="flex flex-col items-center gap-2 h-full justify-end group cursor-pointer relative"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Floating Tooltip */}
                {isHovered && (
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-mono px-3 py-1.5 rounded-lg shadow-xl z-20 whitespace-nowrap pointer-events-none border border-zinc-700 animate-in fade-in zoom-in-95">
                    <div className="font-bold text-zinc-300 mb-0.5">{w.label}</div>
                    <div className="text-emerald-400">✓ Collected: {formatCurrency(w.paidAmount, currency)}</div>
                    <div className="text-zinc-300">📄 Billed: {formatCurrency(w.issuedAmount, currency)}</div>
                  </div>
                )}

                {/* Paired Bars */}
                <div className="flex items-end justify-center gap-1.5 sm:gap-2.5 w-full h-full pb-1 border-b border-zinc-200">
                  {/* Paid Bar */}
                  <div
                    className="w-1/2 max-w-[28px] bg-black rounded-t-sm transition-all duration-300 hover:opacity-80 relative group"
                    style={{ height: `${Math.max(paidPct, 4)}%` }}
                  />
                  {/* Issued Bar */}
                  <div
                    className="w-1/2 max-w-[28px] bg-zinc-200 border border-zinc-300 rounded-t-sm transition-all duration-300 hover:bg-zinc-300 relative group"
                    style={{ height: `${Math.max(issuedPct, 4)}%` }}
                  />
                </div>

                {/* Week Label */}
                <div className="text-center font-mono">
                  <span className="block text-[10px] font-bold text-black uppercase">{w.label}</span>
                  <span className="block text-[9px] text-zinc-400 font-sans hidden sm:block">{w.startDate} - {w.endDate}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
