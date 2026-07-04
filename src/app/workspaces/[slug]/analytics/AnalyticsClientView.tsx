"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnalyticsData, TimeframeFilter, getWorkspaceAnalyticsData } from "@/lib/actions/analytics";
import { formatCurrency } from "@/lib/utils";

interface AnalyticsClientViewProps {
  shopId: string;
  shopSlug: string;
  initialData: AnalyticsData;
}

export function AnalyticsClientView({ shopId, shopSlug, initialData }: AnalyticsClientViewProps) {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState<TimeframeFilter>(initialData.timeframe);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyticsData>(initialData);

  async function handleTimeframeChange(tf: TimeframeFilter) {
    setTimeframe(tf);
    setLoading(true);
    const res = await getWorkspaceAnalyticsData(shopId, tf);
    setLoading(false);
    if (res.success) {
      setData(res.data);
    }
  }

  const maxTimelineVal = Math.max(
    ...data.monthlyTimeline.map((t) => Math.max(t.inflow, t.outflow)),
    1000
  );

  return (
    <div className="space-y-10 font-mono text-xs selection:bg-black selection:text-white">
      
      {/* TIMEFRAME SELECTOR TABS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black pb-4">
        <div>
          <span className="text-[10px] text-zinc-400 block uppercase font-bold">Scope Horizon</span>
          <p className="font-sans text-xs text-zinc-500">Filter business intelligence metrics across operating timeframes.</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "THIS_MONTH", label: "This Month" },
            { id: "LAST_MONTH", label: "Last Month" },
            { id: "THIS_QUARTER", label: "This Quarter" },
            { id: "THIS_YEAR", label: "This Year" },
            { id: "ALL_TIME", label: "All Time" },
          ].map((tf) => (
            <button
              key={tf.id}
              type="button"
              disabled={loading}
              onClick={() => handleTimeframeChange(tf.id as TimeframeFilter)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase border transition-colors ${
                timeframe === tf.id
                  ? "bg-black text-white border-black"
                  : "bg-white text-zinc-600 border-zinc-300 hover:border-black hover:text-black"
              }`}
            >
              {loading && timeframe === tf.id ? "Loading..." : tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* KRA 20TH STATUTORY VAT RETURN TRACKER ALERT BANNER */}
      <div className="border border-black p-6 bg-zinc-50 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse inline-block" />
              <span className="font-bold text-black uppercase text-sm">
                Statutory KRA eTIMS VAT Return Tracker — {data.kraVatSummary.currentMonthName}
              </span>
            </div>
            <p className="font-sans text-xs text-zinc-500 mt-0.5">
              Kenyan tax law requires VAT return filing &amp; remittance on iTax before the <strong>20th of every month</strong>.
            </p>
          </div>

          <div className="border border-black bg-black text-white px-3 py-1.5 font-bold uppercase text-xs shrink-0">
            ⏰ {data.kraVatSummary.daysRemaining} Days Until 20th Filing Deadline
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          <div className="p-3 border border-zinc-200 bg-white space-y-1">
            <span className="text-[9px] text-zinc-400 uppercase block font-bold">Output VAT Collected (16%)</span>
            <span className="text-lg font-bold text-black block">
              {formatCurrency(data.kraVatSummary.outputVat16, data.currency)}
            </span>
            <span className="text-[9px] text-zinc-500 block">Standard Rate Tax Payable</span>
          </div>

          <div className="p-3 border border-zinc-200 bg-white space-y-1">
            <span className="text-[9px] text-zinc-400 uppercase block font-bold">Taxable Sales Volume</span>
            <span className="text-lg font-bold text-black block">
              {formatCurrency(data.kraVatSummary.taxableSalesVolume, data.currency)}
            </span>
            <span className="text-[9px] text-zinc-500 block">Gross 16% Vatable Revenue</span>
          </div>

          <div className="p-3 border border-zinc-200 bg-white space-y-1">
            <span className="text-[9px] text-zinc-400 uppercase block font-bold">Zero-Rated Volume (0%)</span>
            <span className="text-lg font-bold text-black block">
              {formatCurrency(data.kraVatSummary.zeroRatedVolume, data.currency)}
            </span>
            <span className="text-[9px] text-zinc-500 block">Export / Zero-Rated Sales</span>
          </div>

          <div className="p-3 border border-zinc-200 bg-white space-y-1">
            <span className="text-[9px] text-zinc-400 uppercase block font-bold">Exempt Sales Volume</span>
            <span className="text-lg font-bold text-black block">
              {formatCurrency(data.kraVatSummary.exemptVolume, data.currency)}
            </span>
            <span className="text-[9px] text-zinc-500 block">Non-Taxable Vatable Items</span>
          </div>
        </div>
      </div>

      {/* EXECUTIVE CASH FLOW KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-black divide-y sm:divide-y-0 sm:divide-x divide-black bg-white">
        <div className="p-6 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-bold">Settled Operating Inflow</p>
          <p className="text-2xl font-bold tracking-tight text-black">
            {formatCurrency(data.totalSettledInflow, data.currency)}
          </p>
          <p className="text-[10px] text-emerald-700">Receipts &amp; Paid Customer Invoices</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-bold">Settled Procurement Outflow</p>
          <p className="text-2xl font-bold tracking-tight text-black">
            {formatCurrency(data.totalSettledOutflow, data.currency)}
          </p>
          <p className="text-[10px] text-rose-700">Paid LPOs, POs &amp; Payment Vouchers</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-bold">Net Operating Cash Flow</p>
          <p className={`text-2xl font-bold tracking-tight ${data.netOperatingCashFlow >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
            {formatCurrency(data.netOperatingCashFlow, data.currency)}
          </p>
          <p className="text-[10px] text-zinc-500">Inflow minus Outflow Balance</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-bold">Accounts Receivable (A/R)</p>
          <p className="text-2xl font-bold tracking-tight text-black">
            {formatCurrency(data.pendingReceivables, data.currency)}
          </p>
          <p className="text-[10px] text-amber-700">Uncollected Client Debt</p>
        </div>
      </div>

      {/* CHRONOLOGICAL MONTHLY TIMELINE STREAM */}
      <div className="border border-black bg-white p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-bold uppercase text-sm tracking-wider">&gt; Monthly Cash Flow Timeline Stream</h2>
            <p className="font-sans text-xs text-zinc-500">Visual comparison of monthly Inflows (Sales Receipts) vs Outflows (Procurement).</p>
          </div>
          <div className="flex gap-4 text-[10px] font-bold">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-black inline-block" /> INFLOW (REVENUE)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-zinc-300 border border-black inline-block" /> OUTFLOW (PURCHASES)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2 pt-4 border-b border-black pb-4 items-end h-48">
          {data.monthlyTimeline.map((item, idx) => {
            const inflowHeight = (item.inflow / maxTimelineVal) * 100;
            const outflowHeight = (item.outflow / maxTimelineVal) * 100;

            return (
              <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                <div className="flex items-end justify-center gap-1.5 w-full h-full">
                  {/* Inflow Bar */}
                  <div
                    style={{ height: `${Math.max(inflowHeight, 4)}%` }}
                    className="w-1/2 bg-black transition-all group-hover:opacity-90 relative"
                    title={`Inflow: ${formatCurrency(item.inflow, data.currency)}`}
                  />
                  {/* Outflow Bar */}
                  <div
                    style={{ height: `${Math.max(outflowHeight, 4)}%` }}
                    className="w-1/2 bg-zinc-300 border border-black transition-all relative"
                    title={`Outflow: ${formatCurrency(item.outflow, data.currency)}`}
                  />
                </div>
                <span className="text-[9px] font-bold uppercase text-zinc-500">{item.monthLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ACCOUNTS RECEIVABLE (A/R) AGING MATRIX */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-bold uppercase text-sm tracking-wider">&gt; Accounts Receivable (A/R) Aging Risk Matrix</h2>
          <span className="text-[10px] text-zinc-400 font-bold uppercase">
            Total Outstanding: {formatCurrency(data.arAging.totalAr, data.currency)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-black divide-y sm:divide-y-0 sm:divide-x divide-black bg-white">
          <div className="p-4 space-y-1">
            <span className="text-[9px] text-zinc-400 uppercase block font-bold">0 – 30 Days (Current)</span>
            <span className="text-xl font-bold text-black block">
              {formatCurrency(data.arAging.current0To30, data.currency)}
            </span>
            <span className="text-[9px] text-emerald-700 block">Low Risk Pool</span>
          </div>

          <div className="p-4 space-y-1">
            <span className="text-[9px] text-zinc-400 uppercase block font-bold">31 – 60 Days (Due Soon)</span>
            <span className="text-xl font-bold text-black block">
              {formatCurrency(data.arAging.due31To60, data.currency)}
            </span>
            <span className="text-[9px] text-amber-700 block">Moderate Attention</span>
          </div>

          <div className="p-4 space-y-1">
            <span className="text-[9px] text-zinc-400 uppercase block font-bold">61 – 90 Days (Late)</span>
            <span className="text-xl font-bold text-black block">
              {formatCurrency(data.arAging.late61To90, data.currency)}
            </span>
            <span className="text-[9px] text-orange-700 block">High Collection Priority</span>
          </div>

          <div className="p-4 space-y-1">
            <span className="text-[9px] text-zinc-400 uppercase block font-bold">90+ Days (Critically Overdue)</span>
            <span className="text-xl font-bold text-rose-600 block">
              {formatCurrency(data.arAging.overdue90Plus, data.currency)}
            </span>
            <span className="text-[9px] text-rose-700 block font-bold">High Risk Default Pool</span>
          </div>
        </div>
      </div>

      {/* LEADERBOARDS: TOP PRODUCTS VELOCITY & CLIENT LTV CONCENTRATION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* TOP PRODUCTS VELOCITY */}
        <div className="border border-black bg-white p-6 space-y-4">
          <h2 className="font-bold uppercase text-sm tracking-wider border-b border-black pb-3">
            &gt; Product Sales Velocity (Top Bestsellers)
          </h2>

          <div className="space-y-4">
            {data.topProducts.map((p, idx) => (
              <div key={p.id} className="space-y-1 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-black uppercase">
                    {idx + 1}. {p.name}
                  </span>
                  <span className="font-bold text-black">
                    {formatCurrency(p.revenueGenerated, data.currency)} ({p.quantitySold} units)
                  </span>
                </div>

                <div className="w-full h-2 bg-zinc-100 border border-black">
                  <div
                    style={{ width: `${Math.max(p.revenueSharePercent, 2)}%` }}
                    className="h-full bg-black"
                  />
                </div>
              </div>
            ))}

            {data.topProducts.length === 0 && (
              <p className="text-zinc-400 italic text-center py-6">&gt; NO CATALOG SALES RECORDED IN TIMEFRAME.</p>
            )}
          </div>
        </div>

        {/* CLIENT LTV & CONCENTRATION */}
        <div className="border border-black bg-white p-6 space-y-4">
          <h2 className="font-bold uppercase text-sm tracking-wider border-b border-black pb-3">
            &gt; Client Lifetime Value &amp; Concentration (Top Accounts)
          </h2>

          <div className="space-y-4">
            {data.topClients.map((c, idx) => (
              <div key={c.id} className="space-y-1 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-black uppercase">
                    {idx + 1}. {c.name}
                  </span>
                  <span className="font-bold text-black">
                    {formatCurrency(c.ltv, data.currency)} ({c.revenueSharePercent.toFixed(1)}% Share)
                  </span>
                </div>

                <div className="w-full h-2 bg-zinc-100 border border-black">
                  <div
                    style={{ width: `${Math.max(c.revenueSharePercent, 2)}%` }}
                    className="h-full bg-black"
                  />
                </div>
              </div>
            ))}

            {data.topClients.length === 0 && (
              <p className="text-zinc-400 italic text-center py-6">&gt; NO SETTLED CLIENT TRANSACTIONS IN LEDGER.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
