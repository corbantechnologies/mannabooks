"use client";

import { useState } from "react";
import { AnalyticsData, TimeframeFilter, getWorkspaceAnalyticsData } from "@/lib/actions/analytics";
import { formatCurrency } from "@/lib/utils";

interface AnalyticsClientViewProps {
  shopId: string;
  shopSlug: string;
  initialData: AnalyticsData;
}

export function AnalyticsClientView({ shopId, shopSlug, initialData }: AnalyticsClientViewProps) {
  const [timeframe, setTimeframe] = useState<TimeframeFilter>(initialData.timeframe);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyticsData>(initialData);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

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
    1
  );

  const timeframes: { id: TimeframeFilter; label: string }[] = [
    { id: "THIS_MONTH", label: "This Month" },
    { id: "LAST_MONTH", label: "Last Month" },
    { id: "THIS_QUARTER", label: "This Quarter" },
    { id: "THIS_YEAR", label: "This Year" },
    { id: "ALL_TIME", label: "All Time" },
  ];

  const profitColor = data.netGrossProfit >= 0 ? "text-emerald-700" : "text-rose-600";
  const cashFlowColor = data.netOperatingCashFlow >= 0 ? "text-emerald-700" : "text-rose-600";

  return (
    <div className={`space-y-8 font-mono text-xs selection:bg-black selection:text-white transition-opacity duration-300 ${loading ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
      
      {/* TIMEFRAME SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-200/80 pb-5">
        <div className="flex-1 min-w-0">
          <span className="text-[10px] text-zinc-400 block uppercase font-semibold">Scope Horizon</span>
          <p className="font-sans text-xs text-zinc-500 mt-0.5">Filter business intelligence across operating timeframes.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {timeframes.map((tf) => (
            <button
              key={tf.id}
              type="button"
              disabled={loading}
              onClick={() => handleTimeframeChange(tf.id)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${
                timeframe === tf.id
                  ? "bg-black text-white border border-black shadow-sm"
                  : "bg-white text-zinc-600 border border-zinc-300 hover:border-black hover:text-black"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI METRIC GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Inflow */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-5 space-y-2 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <p className="text-[10px] text-zinc-400 uppercase font-semibold leading-tight">Settled Inflow</p>
            <span className="text-base">💰</span>
          </div>
          <p className="text-xl font-bold tracking-tight text-black font-sans">
            {formatCurrency(data.totalSettledInflow, data.currency)}
          </p>
          <p className="text-[10px] text-emerald-700 font-medium">Receipts &amp; Paid Invoices</p>
        </div>

        {/* Outflow */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-5 space-y-2 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <p className="text-[10px] text-zinc-400 uppercase font-semibold leading-tight">Settled Outflow</p>
            <span className="text-base">📤</span>
          </div>
          <p className="text-xl font-bold tracking-tight text-black font-sans">
            {formatCurrency(data.totalSettledOutflow, data.currency)}
          </p>
          <p className="text-[10px] text-rose-700 font-medium">Paid LPOs &amp; POs</p>
        </div>

        {/* Net Cash Flow */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-5 space-y-2 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <p className="text-[10px] text-zinc-400 uppercase font-semibold leading-tight">Net Cash Flow</p>
            <span className="text-base">{data.netOperatingCashFlow >= 0 ? "📈" : "📉"}</span>
          </div>
          <p className={`text-xl font-bold tracking-tight font-sans ${cashFlowColor}`}>
            {formatCurrency(data.netOperatingCashFlow, data.currency)}
          </p>
          <p className="text-[10px] text-zinc-500 font-medium">Inflow minus Outflow</p>
        </div>

        {/* AR Receivables */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-5 space-y-2 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <p className="text-[10px] text-zinc-400 uppercase font-semibold leading-tight">Accounts Receivable</p>
            <span className="text-base">⏳</span>
          </div>
          <p className="text-xl font-bold tracking-tight text-black font-sans">
            {formatCurrency(data.pendingReceivables, data.currency)}
          </p>
          <p className="text-[10px] text-amber-700 font-medium">Uncollected Client Debt</p>
        </div>
      </div>

      {/* GROSS PROFIT STRIP */}
      <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200/80 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-emerald-200/60">
          <div>
            <h2 className="font-bold uppercase text-sm tracking-wider text-black font-sans flex items-center gap-2">
              📈 COGS &amp; Gross Profit Intelligence
            </h2>
            <p className="font-sans text-xs text-zinc-500 mt-0.5">
              Profitability analysis based on product cost prices vs. selling prices.
            </p>
          </div>
          <div className={`shrink-0 px-4 py-2 text-xs font-bold uppercase rounded-lg font-mono ${
            data.grossProfitMargin >= 0
              ? "bg-emerald-700 text-white"
              : "bg-rose-600 text-white"
          }`}>
            Margin: {data.grossProfitMargin.toFixed(1)}%
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-emerald-200 rounded-lg p-4 space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Total Sales Revenue</span>
            <span className="text-lg font-bold text-black block font-sans">{formatCurrency(data.totalSettledInflow, data.currency)}</span>
            <span className="text-[9px] text-zinc-500 block">Gross receipts &amp; settled sales</span>
          </div>

          <div className="bg-white border border-emerald-200 rounded-lg p-4 space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Total COGS (Cost of Goods)</span>
            <span className="text-lg font-bold text-rose-700 block font-sans">{formatCurrency(data.totalCostOfGoodsSold, data.currency)}</span>
            <span className="text-[9px] text-zinc-500 block">Direct cost of production / purchase</span>
          </div>

          <div className="bg-white border border-emerald-200 rounded-lg p-4 space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Net Gross Operating Profit</span>
            <span className={`text-lg font-bold block font-sans ${profitColor}`}>{formatCurrency(data.netGrossProfit, data.currency)}</span>
            <span className={`text-[9px] font-bold block ${profitColor}`}>
              {data.grossProfitMargin >= 0 ? "Profit (Revenue − COGS)" : "Operating Loss"}
            </span>
          </div>
        </div>

        {/* Gross Margin Progress Bar */}
        <div className="mt-4 pt-4 border-t border-emerald-200/60 space-y-2">
          <div className="flex justify-between text-[10px] font-semibold uppercase">
            <span className="text-zinc-500">Gross Margin Progress</span>
            <span className={profitColor}>{data.grossProfitMargin.toFixed(1)}%</span>
          </div>
          <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${data.grossProfitMargin >= 0 ? "bg-emerald-500" : "bg-rose-500"}`}
              style={{ width: `${Math.min(Math.abs(data.grossProfitMargin), 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* MONTHLY CASH FLOW CHART */}
      <div className="bg-white border border-zinc-200/80 rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold uppercase text-sm tracking-wider text-black font-sans">&gt; Monthly Cash Flow Timeline</h2>
            <p className="font-sans text-xs text-zinc-500 mt-0.5">Visual comparison of monthly inflows vs. outflows (last 6 months).</p>
          </div>
          <div className="flex gap-4 text-[10px] font-semibold shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-black inline-block rounded-sm" /> INFLOW
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-zinc-300 border border-zinc-400 inline-block rounded-sm" /> OUTFLOW
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="relative">
          <div className="flex gap-2 sm:gap-3 items-end h-52 pt-4">
            {data.monthlyTimeline.map((item, idx) => {
              const inflowH = (item.inflow / maxTimelineVal) * 100;
              const outflowH = (item.outflow / maxTimelineVal) * 100;
              const isHovered = hoveredBar === idx;

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-default"
                  onMouseEnter={() => setHoveredBar(idx)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-3 py-2 rounded-lg shadow-lg whitespace-nowrap z-10 pointer-events-none">
                      <div className="font-bold mb-1">{item.monthLabel}</div>
                      <div className="text-emerald-400">↑ {formatCurrency(item.inflow, data.currency)}</div>
                      <div className="text-zinc-300">↓ {formatCurrency(item.outflow, data.currency)}</div>
                    </div>
                  )}

                  {/* Bars */}
                  <div className="flex items-end justify-center gap-1 w-full h-full relative">
                    <div
                      style={{ height: `${Math.max(inflowH, 3)}%` }}
                      className={`w-[45%] transition-all duration-300 rounded-t-md ${isHovered ? "bg-zinc-700" : "bg-black"}`}
                      title={`Inflow: ${formatCurrency(item.inflow, data.currency)}`}
                    />
                    <div
                      style={{ height: `${Math.max(outflowH, 3)}%` }}
                      className={`w-[45%] transition-all duration-300 rounded-t-md ${isHovered ? "bg-zinc-400" : "bg-zinc-300"} border border-zinc-400`}
                      title={`Outflow: ${formatCurrency(item.outflow, data.currency)}`}
                    />
                  </div>
                  <span className="text-[9px] font-bold uppercase text-zinc-400 group-hover:text-black transition-colors">{item.monthLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* KRA VAT RETURN TRACKER */}
      <div className="bg-white border border-zinc-200/80 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse inline-block" />
              <span className="font-bold text-black uppercase text-xs font-sans">
                KRA eTIMS VAT Return Tracker — {data.kraVatSummary.currentMonthName}
              </span>
            </div>
            <p className="font-sans text-xs text-zinc-500 mt-0.5">
              VAT return must be filed &amp; remitted on iTax before the <strong>20th of every month</strong>.
            </p>
          </div>

          <div className={`shrink-0 px-3 py-1.5 font-bold uppercase text-xs rounded-lg font-mono ${
            data.kraVatSummary.daysRemaining <= 5 ? "bg-rose-600 text-white" :
            data.kraVatSummary.daysRemaining <= 10 ? "bg-amber-500 text-white" :
            "bg-black text-white"
          }`}>
            ⏰ {data.kraVatSummary.daysRemaining} Days to Filing
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Output VAT (16%)", value: data.kraVatSummary.outputVat16, sub: "Standard Rate Tax Payable", color: "text-black" },
            { label: "Taxable Sales Volume", value: data.kraVatSummary.taxableSalesVolume, sub: "Gross 16% Vatable Revenue", color: "text-black" },
            { label: "Zero-Rated Volume (0%)", value: data.kraVatSummary.zeroRatedVolume, sub: "Export / Zero-Rated Sales", color: "text-black" },
            { label: "Exempt Sales Volume", value: data.kraVatSummary.exemptVolume, sub: "Non-Taxable Vatable Items", color: "text-black" },
          ].map((item) => (
            <div key={item.label} className="p-3 border border-zinc-200/80 bg-zinc-50/50 space-y-1 rounded-lg">
              <span className="text-[9px] text-zinc-400 uppercase block font-semibold">{item.label}</span>
              <span className={`text-base font-bold block font-sans ${item.color}`}>{formatCurrency(item.value, data.currency)}</span>
              <span className="text-[9px] text-zinc-500 block">{item.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* A/R AGING MATRIX */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-bold uppercase text-sm tracking-wider text-black font-sans">&gt; Accounts Receivable Aging Risk Matrix</h2>
          <span className="text-[10px] text-zinc-400 font-semibold uppercase font-mono shrink-0">
            Total A/R: {formatCurrency(data.arAging.totalAr, data.currency)}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "0–30 Days (Current)", value: data.arAging.current0To30, risk: "Low Risk", riskColor: "text-emerald-700", border: "border-emerald-200", bg: "bg-emerald-50/30" },
            { label: "31–60 Days (Due Soon)", value: data.arAging.due31To60, risk: "Moderate Attention", riskColor: "text-amber-700", border: "border-amber-200", bg: "bg-amber-50/30" },
            { label: "61–90 Days (Late)", value: data.arAging.late61To90, risk: "High Collection Priority", riskColor: "text-orange-700", border: "border-orange-200", bg: "bg-orange-50/30" },
            { label: "90+ Days (Overdue)", value: data.arAging.overdue90Plus, risk: "High Default Risk", riskColor: "text-rose-700", border: "border-rose-200", bg: "bg-rose-50/30" },
          ].map((bucket) => (
            <div key={bucket.label} className={`p-4 bg-white border ${bucket.border} rounded-xl space-y-1 shadow-sm`}>
              <span className="text-[9px] text-zinc-400 uppercase block font-semibold">{bucket.label}</span>
              <span className="text-lg font-bold text-black block font-sans">{formatCurrency(bucket.value, data.currency)}</span>
              <span className={`text-[9px] font-bold block ${bucket.riskColor}`}>{bucket.risk}</span>
              {data.arAging.totalAr > 0 && (
                <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full ${bucket.border.replace("border-", "bg-").replace("/200", "/400")} rounded-full`}
                    style={{ width: `${(bucket.value / data.arAging.totalAr) * 100}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* LEADERBOARDS: TOP PRODUCTS & CLIENT LTV */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TOP PRODUCTS */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="border-b border-zinc-200/80 pb-3">
            <h2 className="font-bold uppercase text-sm tracking-wider text-black font-sans">&gt; Product Sales Velocity</h2>
            <p className="font-sans text-[10px] text-zinc-400 mt-0.5">Top bestselling products by revenue share.</p>
          </div>

          <div className="space-y-4">
            {data.topProducts.map((p, idx) => (
              <div key={p.id} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 ${
                      idx === 0 ? "bg-black text-white" : "bg-zinc-100 text-zinc-600"
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-black uppercase truncate text-xs">{p.name}</span>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="font-bold text-black text-xs block">{formatCurrency(p.revenueGenerated, data.currency)}</span>
                    <span className="text-[9px] text-zinc-400">{p.quantitySold} units · {p.revenueSharePercent.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.max(p.revenueSharePercent, 2)}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${idx === 0 ? "bg-black" : "bg-zinc-400"}`}
                  />
                </div>
              </div>
            ))}

            {data.topProducts.length === 0 && (
              <div className="py-10 text-center text-zinc-400 italic font-sans text-xs">
                No catalog sales recorded in selected timeframe.
              </div>
            )}
          </div>
        </div>

        {/* CLIENT LTV */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="border-b border-zinc-200/80 pb-3">
            <h2 className="font-bold uppercase text-sm tracking-wider text-black font-sans">&gt; Client Lifetime Value (LTV)</h2>
            <p className="font-sans text-[10px] text-zinc-400 mt-0.5">Top client accounts ranked by revenue contribution.</p>
          </div>

          <div className="space-y-4">
            {data.topClients.map((c, idx) => (
              <div key={c.id} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 ${
                      idx === 0 ? "bg-black text-white" : "bg-zinc-100 text-zinc-600"
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-black uppercase truncate text-xs">{c.name}</span>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="font-bold text-black text-xs block">{formatCurrency(c.ltv, data.currency)}</span>
                    <span className="text-[9px] text-zinc-400">{c.revenueSharePercent.toFixed(1)}% Revenue Share</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.max(c.revenueSharePercent, 2)}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${idx === 0 ? "bg-black" : "bg-zinc-400"}`}
                  />
                </div>
              </div>
            ))}

            {data.topClients.length === 0 && (
              <div className="py-10 text-center text-zinc-400 italic font-sans text-xs">
                No settled client transactions recorded.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
