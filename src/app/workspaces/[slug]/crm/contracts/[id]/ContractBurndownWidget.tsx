"use client";

import { Clock, TrendingDown, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BurndownLog {
  id: string;
  hoursUsed: string;
  description: string;
  logDate: string;
}

interface ContractBurndownWidgetProps {
  allocated: number;
  usedThisMonth: number;
  remaining: number;
  overrun: number;
  pctUsed: number;
  billingMonth: string;
  logs: BurndownLog[];
  currency: string;
  hourlyRate: number;
}

export function ContractBurndownWidget({
  allocated,
  usedThisMonth,
  remaining,
  overrun,
  pctUsed,
  billingMonth,
  currency,
  hourlyRate,
}: ContractBurndownWidgetProps) {
  const [year, month] = billingMonth.split("-");
  const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString("en-US", { month: "long", year: "numeric" });

  const barColor = pctUsed >= 100 ? "#ef4444" : pctUsed >= 80 ? "#f59e0b" : "#10b981";
  const overrunCost = overrun * hourlyRate;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-900">Hours Burn-Down — {monthName}</h3>
        {overrun > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-red-500 font-medium">
            <AlertTriangle className="w-3 h-3" /> Overrun
          </span>
        )}
      </div>

      {/* Big numbers */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 rounded-lg bg-gray-50 border border-gray-100">
          <p className="text-xl font-bold text-gray-900">{allocated}h</p>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5">Allocated</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-gray-50 border border-gray-100">
          <p className="text-xl font-bold" style={{ color: barColor }}>{usedThisMonth.toFixed(1)}h</p>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5">Used</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-gray-50 border border-gray-100">
          {overrun > 0 ? (
            <>
              <p className="text-xl font-bold text-red-500">+{overrun.toFixed(1)}h</p>
              <p className="text-[10px] text-gray-500 font-medium mt-0.5">Overrun</p>
            </>
          ) : (
            <>
              <p className="text-xl font-bold text-emerald-600">{remaining.toFixed(1)}h</p>
              <p className="text-[10px] text-gray-500 font-medium mt-0.5">Remaining</p>
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5 mb-3">
        <div className="flex justify-between text-xs text-gray-500 font-medium">
          <span>Usage</span>
          <span>{pctUsed}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(pctUsed, 100)}%`, backgroundColor: barColor }}
          />
        </div>
      </div>

      {/* Overrun cost callout */}
      {overrun > 0 && hourlyRate > 0 && (
        <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-700">
            Overrun cost: <strong>{formatCurrency(overrunCost, currency)}</strong> ({overrun.toFixed(1)}h × {formatCurrency(hourlyRate, currency)}/h)
          </p>
        </div>
      )}
    </div>
  );
}
