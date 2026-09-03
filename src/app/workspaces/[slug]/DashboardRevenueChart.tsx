// src/app/workspaces/[slug]/DashboardRevenueChart.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, FileText } from "lucide-react";

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
  const [mounted, setMounted] = useState(false);
  const brandColor = "var(--brand-primary, #064e3b)";

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const maxVal = Math.max(
    ...weeks.map((w) => Math.max(w.paidAmount, w.issuedAmount)),
    1000
  );

  const totalPaid = weeks.reduce((sum, w) => sum + w.paidAmount, 0);
  const totalIssued = weeks.reduce((sum, w) => sum + w.issuedAmount, 0);

  return (
    <div className="surface p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <p className="text-xs text-zinc-400 font-medium mb-0.5">Cash Flow Dynamics</p>
          <h2 className="text-[15px] font-semibold text-zinc-900">
            30-Day Revenue Trajectory
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Weekly settled collections vs. newly billed commitments
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 text-[11px] font-semibold">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ background: "var(--brand-primary, #064e3b)" }}
            />
            <span className="text-zinc-700">
              Collected{" "}
              <span className="font-mono text-zinc-500">
                ({formatCurrency(totalPaid, currency)})
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold">
            <div className="w-3 h-3 rounded-sm bg-zinc-200 border border-zinc-300" />
            <span className="text-zinc-500">
              Billed{" "}
              <span className="font-mono text-zinc-400">
                ({formatCurrency(totalIssued, currency)})
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative pt-2">
        {/* Y-axis grid lines */}
        <div className="absolute inset-x-0 top-2 h-48 flex flex-col justify-between pointer-events-none">
          {[100, 75, 50, 25, 0].map((pct) => (
            <div
              key={pct}
              className="w-full border-t border-dashed"
              style={{ borderColor: "rgba(0,0,0,0.05)" }}
            />
          ))}
        </div>

        {/* Bars */}
        <div className="grid grid-cols-4 gap-4 sm:gap-8 items-end h-48 relative">
          {weeks.map((w, idx) => {
            const paidPct = Math.min((w.paidAmount / maxVal) * 100, 100);
            const issuedPct = Math.min((w.issuedAmount / maxVal) * 100, 100);
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                className="flex flex-col items-center gap-2 h-full justify-end cursor-pointer relative"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Floating tooltip */}
                {isHovered && (
                  <div
                    className="absolute z-20 whitespace-nowrap pointer-events-none animate-slide-up"
                    style={{
                      bottom: "calc(100% + 8px)",
                      left: "50%",
                      transform: "translateX(-50%)",
                      backgroundColor: "rgba(15, 17, 23, 0.92)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "10px",
                      padding: "8px 12px",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                    }}
                  >
                    <p className="text-[10px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
                      {w.label}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-300">
                        {formatCurrency(w.paidAmount, currency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium mt-0.5">
                      <FileText className="w-3 h-3 text-zinc-500" />
                      <span className="text-zinc-400">
                        {formatCurrency(w.issuedAmount, currency)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Paired bars */}
                <div className="flex items-end justify-center gap-1.5 sm:gap-2 w-full h-full pb-1">
                  {/* Paid / Collected bar */}
                  <div
                    className="w-1/2 max-w-[26px] rounded-t-[4px] transition-all duration-500 ease-out relative overflow-hidden"
                    style={{
                      height: `${Math.max(mounted ? paidPct : 0, mounted ? 3 : 0)}%`,
                      background: `linear-gradient(180deg, var(--brand-primary, #064e3b) 0%, color-mix(in srgb, var(--brand-primary, #064e3b) 70%, #000) 100%)`,
                      boxShadow: isHovered ? `0 0 12px color-mix(in srgb, var(--brand-primary, #064e3b) 50%, transparent)` : "none",
                      transitionDelay: `${idx * 40}ms`,
                    }}
                  />
                  {/* Billed / Issued bar */}
                  <div
                    className="w-1/2 max-w-[26px] rounded-t-[4px] border border-zinc-200 transition-all duration-500 ease-out"
                    style={{
                      height: `${Math.max(mounted ? issuedPct : 0, mounted ? 3 : 0)}%`,
                      backgroundColor: "#e4e4e7",
                      transitionDelay: `${idx * 40 + 80}ms`,
                    }}
                  />
                </div>

                {/* Week label */}
                <div className="text-center space-y-0.5 pb-1">
                  <span className="block text-[10px] font-semibold text-zinc-700 uppercase tracking-wide">
                    {w.label}
                  </span>
                  <span className="block text-[9px] text-zinc-400 font-mono hidden sm:block">
                    {w.startDate}–{w.endDate}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
