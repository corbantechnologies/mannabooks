"use client";

import { useState } from "react";
import { AnalyticsData, TimeframeFilter, getWorkspaceAnalyticsData } from "@/lib/actions/analytics";
import { formatCurrency } from "@/lib/utils";
import { getFiscalYearRange } from "@/lib/fiscalYear";

interface AnalyticsClientViewProps {
  shopId: string;
  shopSlug: string;
  fiscalYearStartMonth: number;
  initialData: AnalyticsData;
}

export function AnalyticsClientView({ shopId, shopSlug, fiscalYearStartMonth, initialData }: AnalyticsClientViewProps) {
  const [timeframe, setTimeframe] = useState<TimeframeFilter>(initialData.timeframe);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyticsData>(initialData);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [showArDetails, setShowArDetails] = useState(false);
  const [timelineHorizon, setTimelineHorizon] = useState<"6M" | "12M">("12M");

  async function handleTimeframeChange(tf: TimeframeFilter) {
    setTimeframe(tf);
    setLoading(true);
    const res = await getWorkspaceAnalyticsData(shopId, tf);
    setLoading(false);
    if (res.success) {
      setData(res.data);
    }
  }

  const activeTimeline = timelineHorizon === "12M" && data.twelveMonthTimeline && data.twelveMonthTimeline.length > 0
    ? data.twelveMonthTimeline
    : data.monthlyTimeline;

  const maxTimelineVal = Math.max(
    ...activeTimeline.map((t) => Math.max(t.inflow, t.outflow)),
    1
  );

  const fyLabel = getFiscalYearRange(fiscalYearStartMonth).label;

  const timeframes: { id: TimeframeFilter; label: string }[] = [
    { id: "THIS_MONTH", label: "This Month" },
    { id: "LAST_MONTH", label: "Last Month" },
    { id: "THIS_QUARTER", label: "This Quarter" },
    { id: "THIS_YEAR", label: fyLabel },
    { id: "ALL_TIME", label: "All Time" },
  ];

  const profitColor = data.netGrossProfit >= 0 ? "text-emerald-700" : "text-rose-600";
  const cashFlowColor = data.netOperatingCashFlow >= 0 ? "text-emerald-700" : "text-rose-600";

  return (
    <div className={`space-y-8 font-mono text-xs selection:bg-black selection:text-white transition-opacity duration-300 ${loading ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
      
      {/* TIMEFRAME SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-100 pb-5">
        <div className="flex-1 min-w-0">
          <span className="text-[10px] text-zinc-400 block uppercase font-semibold">Date Range</span>
          <p className="font-sans text-xs text-zinc-500 mt-0.5">Select a timeframe to filter your reports.</p>
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
            <p className="text-[10px] text-zinc-400 uppercase font-semibold leading-tight">Total Money In</p>
            <span className="text-base">💰</span>
          </div>
          <p className="text-xl font-bold tracking-tight text-black font-sans">
            {formatCurrency(data.totalSettledInflow, data.currency)}
          </p>
          <p className="text-[10px] text-emerald-700 font-medium">Receipts &amp; paid invoices</p>
        </div>

        {/* Outflow */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-5 space-y-2 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <p className="text-[10px] text-zinc-400 uppercase font-semibold leading-tight">Total Money Out</p>
            <span className="text-base">📤</span>
          </div>
          <p className="text-xl font-bold tracking-tight text-black font-sans">
            {formatCurrency(data.totalSettledOutflow, data.currency)}
          </p>
          <p className="text-[10px] text-rose-700 font-medium">Supplier bills &amp; expenses</p>
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
          <p className="text-[10px] text-zinc-500 font-medium">Money in minus money out</p>
        </div>

        {/* AR Receivables */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-5 space-y-2 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <p className="text-[10px] text-zinc-400 uppercase font-semibold leading-tight">Unpaid Invoices</p>
            <span className="text-base">⏳</span>
          </div>
          <p className="text-xl font-bold tracking-tight text-black font-sans">
            {formatCurrency(data.pendingReceivables, data.currency)}
          </p>
          <p className="text-[10px] text-amber-700 font-medium">Pending client payments</p>
        </div>
      </div>

      {/* GROSS PROFIT STRIP */}
      <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-200/80 rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-emerald-200/60">
          <div>
            <h2 className="font-bold uppercase text-sm tracking-wider text-black font-sans flex items-center gap-2">
              📈 Profit &amp; Loss Summary
            </h2>
            <p className="font-sans text-xs text-zinc-500 mt-0.5">
              Breakdown of your revenue, product costs, operating expenses, and net profit.
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white/80 border border-emerald-100 rounded-lg space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Total Revenue</span>
            <span className="text-lg font-bold text-black font-sans block">{formatCurrency(data.totalSettledInflow, data.currency)}</span>
            <span className="text-[10px] text-zinc-500 block">Gross sales</span>
          </div>

          <div className="p-4 bg-white/80 border border-emerald-100 rounded-lg space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Cost of Goods (COGS)</span>
            <span className="text-lg font-bold text-rose-700 font-sans block">-{formatCurrency(data.totalCostOfGoodsSold, data.currency)}</span>
            <span className="text-[10px] text-zinc-500 block">Product purchase costs</span>
          </div>

          <div className="p-4 bg-white/80 border border-emerald-100 rounded-lg space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Operating Expenses</span>
            <span className="text-lg font-bold text-rose-700 font-sans block">-{formatCurrency(data.totalOperatingExpenses, data.currency)}</span>
            <span className="text-[10px] text-zinc-500 block">Rent, utilities, staff, etc.</span>
          </div>

          <div className="p-4 bg-white/80 border border-emerald-100 rounded-lg space-y-1">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Estimated Net Profit</span>
            <span className={`text-lg font-bold font-sans block ${data.netIncome >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              {formatCurrency(data.netIncome, data.currency)}
            </span>
            <span className="text-[10px] text-zinc-500 block">
              {data.netIncome >= 0 ? "Net business gain" : "Net operating loss"}
            </span>
          </div>
        </div>

        {/* Profit margin bar */}
        <div className="mt-4 pt-4 border-t border-emerald-200/40">
          <div className="flex justify-between items-center text-[10px] font-semibold uppercase text-zinc-500 mb-1.5">
            <span>Profit Realization Rate</span>
            <span>{data.grossProfitMargin.toFixed(1)}% Gross Margin</span>
          </div>
          <div className="w-full h-2.5 bg-zinc-200/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${data.grossProfitMargin >= 0 ? "bg-emerald-600" : "bg-rose-500"}`}
              style={{ width: `${Math.min(Math.abs(data.grossProfitMargin), 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* MONTHLY CASH FLOW CHART (6M / 12M HORIZON) */}
      <div className="bg-white border border-zinc-200/80 rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold uppercase text-sm tracking-wider text-black font-sans">Rolling Cash Flow</h2>
            <p className="font-sans text-xs text-zinc-500 mt-0.5">
              Monthly cash in versus cash out over the last {timelineHorizon === "12M" ? "12 months" : "6 months"}.
            </p>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-semibold shrink-0">
            {/* Horizon switch */}
            <div className="flex border border-zinc-200 rounded-lg overflow-hidden p-0.5 bg-zinc-50">
              <button
                type="button"
                onClick={() => setTimelineHorizon("6M")}
                className={`px-2 py-1 rounded text-[10px] uppercase font-bold transition-all ${
                  timelineHorizon === "6M" ? "bg-black text-white" : "text-zinc-500 hover:text-black"
                }`}
              >
                6M
              </button>
              <button
                type="button"
                onClick={() => setTimelineHorizon("12M")}
                className={`px-2 py-1 rounded text-[10px] uppercase font-bold transition-all ${
                  timelineHorizon === "12M" ? "bg-black text-white" : "text-zinc-500 hover:text-black"
                }`}
              >
                12M
              </button>
            </div>

            <div className="flex gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-black inline-block rounded-sm" /> MONEY IN
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-zinc-300 border border-zinc-400 inline-block rounded-sm" /> MONEY OUT
              </span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="relative">
          <div className="flex gap-1.5 sm:gap-2.5 items-end h-52 pt-4">
            {activeTimeline.map((item, idx) => {
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
                      <div className="text-emerald-400">↑ Inflow: {formatCurrency(item.inflow, data.currency)}</div>
                      <div className="text-zinc-300">↓ Outflow: {formatCurrency(item.outflow, data.currency)}</div>
                      {"netProfit" in item && typeof (item as any).netProfit === "number" && (
                        <div className={`mt-1 font-bold pt-1 border-t border-zinc-700 ${(item as any).netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          Net: {formatCurrency((item as any).netProfit as number, data.currency)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bars */}
                  <div className="flex items-end justify-center gap-0.5 sm:gap-1 w-full h-full relative">
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
                  <span className="text-[8px] sm:text-[9px] font-bold uppercase text-zinc-400 group-hover:text-black transition-colors truncate">
                    {item.monthLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* KRA VAT RETURN TRACKER */}
      <div className="bg-white border border-zinc-200/80 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse inline-block" />
              <span className="font-bold text-black uppercase text-xs font-sans">
                KRA eTIMS VAT Return Summary — {data.kraVatSummary.currentMonthName}
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
          <h2 className="font-bold uppercase text-sm tracking-wider text-black font-sans">Unpaid Invoices by Age (A/R Aging)</h2>
          <div className="flex items-center gap-4 shrink-0 font-mono text-[10px]">
            {data.outstandingInvoices && data.outstandingInvoices.length > 0 && (
              <button
                type="button"
                onClick={() => setShowArDetails(!showArDetails)}
                className="font-bold uppercase underline hover:no-underline text-zinc-600 cursor-pointer"
              >
                {showArDetails ? "Hide Invoices" : "View Invoices"}
              </button>
            )}
            <span className="text-zinc-400 font-semibold uppercase">
              Total Unpaid: {formatCurrency(data.arAging.totalAr, data.currency)}
            </span>
          </div>
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

        {/* Expandable Outstanding Invoices List */}
        {showArDetails && data.outstandingInvoices && data.outstandingInvoices.length > 0 && (
          <div className="border border-zinc-200 bg-white rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-100 flex justify-between items-center">
              <span className="font-bold uppercase text-[10px] text-zinc-500">Unpaid Invoices Breakdown</span>
              <span className="text-[9px] text-zinc-400 uppercase font-semibold">{data.outstandingInvoices.length} outstanding invoice(s)</span>
            </div>
            <div className="overflow-x-auto max-h-[350px]">
              <table className="w-full text-left font-mono text-[11px] border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 uppercase tracking-wider">
                    <th className="p-3 border-r border-zinc-200">Doc Number</th>
                    <th className="p-3 border-r border-zinc-200">Client / Customer</th>
                    <th className="p-3 border-r border-zinc-200">Issue Date</th>
                    <th className="p-3 border-r border-zinc-200 text-center">Age (Days)</th>
                    <th className="p-3 text-right">Outstanding Valuation</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {data.outstandingInvoices.map((inv: any) => {
                    let ageColor = "text-emerald-700 font-semibold";
                    if (inv.ageInDays > 90) ageColor = "text-rose-700 font-bold";
                    else if (inv.ageInDays > 60) ageColor = "text-orange-700 font-bold";
                    else if (inv.ageInDays > 30) ageColor = "text-amber-700 font-bold";

                    return (
                      <tr key={inv.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="p-3 border-r border-zinc-100 font-bold">
                          <a
                            href={`/workspaces/${shopSlug}/documents/${inv.id}`}
                            className="underline hover:no-underline text-black"
                          >
                            {inv.docNumber} ➔
                          </a>
                        </td>
                        <td className="p-3 border-r border-zinc-100 font-sans font-semibold uppercase text-zinc-800">
                          {inv.clientName}
                        </td>
                        <td className="p-3 border-r border-zinc-100 text-zinc-500">
                          {new Date(inv.issueDate).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                        </td>
                        <td className={`p-3 border-r border-zinc-100 text-center ${ageColor}`}>
                          {inv.ageInDays} d
                        </td>
                        <td className="p-3 text-right font-bold text-black font-sans">
                          {formatCurrency(inv.amount, data.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* PIPELINE CONVERSION FUNNEL & PRODUCT/SERVICE REVENUE SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* QUOTATION CONVERSION FUNNEL */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h2 className="font-bold uppercase text-sm tracking-wider text-black font-sans flex items-center gap-2">
                <span>🎯</span>
                <span>Quotes &amp; Conversions</span>
              </h2>
              <p className="font-sans text-[10px] text-zinc-400 mt-0.5">
                How many quotes turned into accepted and paid invoices.
              </p>
            </div>
            {data.quotationConversion && (
              <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-lg font-mono ${
                data.quotationConversion.conversionRatePercent >= 50
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-zinc-100 text-zinc-700 border border-zinc-200"
              }`}>
                {data.quotationConversion.conversionRatePercent.toFixed(1)}% Conversion
              </span>
            )}
          </div>

          {data.quotationConversion ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Total Quotes Issued</span>
                  <span className="text-xl font-bold text-black font-mono block">{data.quotationConversion.totalQuotesIssued}</span>
                  <span className="text-[10px] text-zinc-500 block">{formatCurrency(data.quotationConversion.totalQuotedValue, data.currency)} quoted</span>
                </div>
                <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-1">
                  <span className="text-[10px] text-emerald-800 uppercase font-semibold block">Converted / Accepted</span>
                  <span className="text-xl font-bold text-emerald-900 font-mono block">{data.quotationConversion.totalQuotesAcceptedOrConverted}</span>
                  <span className="text-[10px] text-emerald-700 block">{formatCurrency(data.quotationConversion.totalConvertedValue, data.currency)} closed</span>
                </div>
              </div>

              {/* Visual Funnel Bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[10px] font-semibold uppercase text-zinc-500">
                  <span>Conversion Rate</span>
                  <span>{data.quotationConversion.conversionRatePercent.toFixed(1)}%</span>
                </div>
                <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(Math.max(data.quotationConversion.conversionRatePercent, 2), 100)}%` }}
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-zinc-400 italic text-xs font-sans">
              No quotation activity recorded.
            </div>
          )}
        </div>

        {/* PRODUCT VS SERVICE REVENUE SPLIT */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="border-b border-zinc-100 pb-3">
            <h2 className="font-bold uppercase text-sm tracking-wider text-black font-sans flex items-center gap-2">
              <span>⚖️</span>
              <span>Products vs. Services</span>
            </h2>
            <p className="font-sans text-[10px] text-zinc-400 mt-0.5">
              Sales breakdown between physical items and billable services.
            </p>
          </div>

          {data.productServiceSplit ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-black" />
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Physical Products</span>
                  </div>
                  <span className="text-xl font-bold text-black font-mono block">{data.productServiceSplit.productPercent}%</span>
                  <span className="text-[10px] text-zinc-500 block">{formatCurrency(data.productServiceSplit.productRevenue, data.currency)}</span>
                </div>

                <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span className="text-[10px] text-blue-900 uppercase font-semibold">Billable Services</span>
                  </div>
                  <span className="text-xl font-bold text-blue-950 font-mono block">{data.productServiceSplit.servicePercent}%</span>
                  <span className="text-[10px] text-blue-700 block">{formatCurrency(data.productServiceSplit.serviceRevenue, data.currency)}</span>
                </div>
              </div>

              {/* Segmented Progress Bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[10px] font-semibold uppercase text-zinc-500">
                  <span>Product ({data.productServiceSplit.productPercent}%)</span>
                  <span>Service ({data.productServiceSplit.servicePercent}%)</span>
                </div>
                <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${data.productServiceSplit.productPercent}%` }}
                    className="h-full bg-black transition-all duration-500"
                  />
                  <div
                    style={{ width: `${data.productServiceSplit.servicePercent}%` }}
                    className="h-full bg-blue-600 transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-zinc-400 italic text-xs font-sans">
              No sales item data recorded.
            </div>
          )}
        </div>

      </div>

      {/* LEADERBOARDS: TOP 10 CLIENTS & BESTSELLING PRODUCTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TOP 10 CLIENTS BY REVENUE */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="border-b border-zinc-100 pb-3 flex justify-between items-center">
            <div>
              <h2 className="font-bold uppercase text-sm tracking-wider text-black font-sans">Top 10 Clients by Revenue</h2>
              <p className="font-sans text-[10px] text-zinc-400 mt-0.5">Clients ranked by total revenue contribution.</p>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 uppercase font-semibold">
              {(data.topTenClients || data.topClients).length} Ranked
            </span>
          </div>

          <div className="space-y-3.5">
            {(data.topTenClients || data.topClients).map((c, idx) => (
              <div key={c.id} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 ${
                      idx === 0 ? "bg-black text-white" : idx < 3 ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-600"
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-black uppercase truncate text-xs">{c.name}</span>
                    {"invoiceCount" in c && (c as any).invoiceCount > 0 && (
                      <span className="text-[9px] text-zinc-400 font-mono shrink-0">
                        ({(c as any).invoiceCount} {(c as any).invoiceCount === 1 ? "inv" : "invs"})
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="font-bold text-black text-xs block">{formatCurrency(c.ltv, data.currency)}</span>
                    <span className="text-[9px] text-zinc-400">{c.revenueSharePercent.toFixed(1)}% Share</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.max(c.revenueSharePercent, 2)}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${idx === 0 ? "bg-black" : idx < 3 ? "bg-zinc-700" : "bg-zinc-400"}`}
                  />
                </div>
              </div>
            ))}

            {(data.topTenClients || data.topClients).length === 0 && (
              <div className="py-10 text-center text-zinc-400 italic font-sans text-xs">
                No settled client transactions recorded.
              </div>
            )}
          </div>
        </div>

        {/* TOP PRODUCTS */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="border-b border-zinc-100 pb-3">
            <h2 className="font-bold uppercase text-sm tracking-wider text-black font-sans">Top Selling Products</h2>
            <p className="font-sans text-[10px] text-zinc-400 mt-0.5">Bestselling catalog items by revenue share.</p>
          </div>

          <div className="space-y-3.5">
            {data.topProducts.map((p, idx) => (
              <div key={p.id} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 ${
                      idx === 0 ? "bg-black text-white" : idx < 3 ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-600"
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
                    className={`h-full rounded-full transition-all duration-500 ${idx === 0 ? "bg-black" : idx < 3 ? "bg-zinc-700" : "bg-zinc-400"}`}
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

      </div>

    </div>
  );
}
