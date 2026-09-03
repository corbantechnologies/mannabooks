"use client";

import { useState, useTransition, useRef } from "react";
import { getPLStatement, type PLStatement, type ReportPeriod } from "@/lib/actions/reports";

interface Props {
    shopId: string;
    shopSlug: string;
    initialData: PLStatement | null;
    currency: string;
}

const PERIODS: { value: ReportPeriod; label: string }[] = [
    { value: "THIS_MONTH",  label: "This Month" },
    { value: "LAST_MONTH",  label: "Last Month" },
    { value: "THIS_QUARTER", label: "This Quarter" },
    { value: "THIS_YEAR",   label: "This Fiscal Year" },
];

function fmt(amount: number, currency: string) {
    return `${currency} ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function PLRow({ label, amount, currency, bold, indent, positive, negative }: {
    label: string; amount: number; currency: string; bold?: boolean; indent?: boolean;
    positive?: boolean; negative?: boolean;
}) {
    const isNeg = amount < 0;
    const colorClass = positive ? "text-emerald-700" : negative ? "text-rose-700" : isNeg ? "text-rose-700" : "text-black";
    return (
        <div className={`flex justify-between items-center py-2 ${bold ? "font-bold border-t border-zinc-300 mt-1 pt-3" : ""} ${indent ? "pl-6" : ""}`}>
            <span className={`text-sm ${bold ? "text-black font-bold" : "text-zinc-600"}`}>{label}</span>
            <span className={`font-mono text-sm ${bold ? "font-bold" : ""} ${colorClass}`}>{fmt(amount, currency)}</span>
        </div>
    );
}

export default function PLStatementClient({ shopId, initialData, currency }: Props) {
    const [data, setData] = useState<PLStatement | null>(initialData);
    const [period, setPeriod] = useState<ReportPeriod>("THIS_MONTH");
    const [isPending, startTransition] = useTransition();
    const printRef = useRef<HTMLDivElement>(null);

    function loadPeriod(p: ReportPeriod) {
        setPeriod(p);
        startTransition(async () => {
            const res = await getPLStatement(shopId, p);
            if (res.success) setData(res.data);
        });
    }

    function handleCsvExport() {
        if (!data) return;
        const rows = [
            ["PROFIT & LOSS STATEMENT", data.period],
            [],
            ["REVENUE"],
            ["Sales Revenue", data.salesRevenue],
            ["Non-Operating Income", data.nonOperatingIncome],
            ["Total Revenue", data.totalRevenue],
            [],
            ["COST OF GOODS SOLD"],
            ["COGS", data.cogs],
            ["Gross Profit", data.grossProfit],
            [`Gross Margin`, `${data.grossProfitMargin.toFixed(1)}%`],
            [],
            ["OPERATING EXPENSES"],
            ...data.expenseLines.map(e => [e.label, e.amount]),
            ["Total Operating Expenses", data.totalOperatingExpenses],
            [],
            ["Net Operating Profit", data.netOperatingProfit],
            ["Add: Other Income", data.nonOperatingIncome],
            ["NET INCOME", data.netIncome],
        ];
        const csv = rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `PL_${data.period.replace(/\s/g, "_")}.csv`;
        a.click();
    }

    function handlePrint() {
        window.print();
    }

    return (
        <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex flex-wrap gap-2 items-center">
                {PERIODS.map(p => (
                    <button key={p.value} onClick={() => loadPeriod(p.value)}
                        className={`px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold border transition-colors ${period === p.value ? "badge-emerald" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"}`}>
                        {p.label}
                    </button>
                ))}
                <div className="ml-auto flex gap-2">
                    <button onClick={handleCsvExport} disabled={!data}
                        className="px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold border border-zinc-200 hover:border-zinc-400 transition-colors disabled:opacity-40">
                        Export CSV
                    </button>
                    <button onClick={handlePrint} disabled={!data}
                        className="px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold bg-black text-white hover:bg-zinc-800 transition-colors disabled:opacity-40">
                        Print / PDF
                    </button>
                </div>
            </div>

            {isPending && <div className="text-center py-8 text-zinc-400 font-mono text-xs uppercase animate-pulse">Loading...</div>}

            {!isPending && data && (
                <div ref={printRef} className="border border-zinc-200 rounded-2xl overflow-hidden print:border-0">
                    {/* Report Header */}
                    <div className="bg-black text-white px-6 py-5">
                        <p className="font-mono text-xs uppercase text-zinc-400">Profit & Loss Statement</p>
                        <h2 className="text-2xl font-bold font-sans mt-1">{data.period}</h2>
                        <p className="text-zinc-400 text-sm mt-0.5">Currency: {data.currency}</p>
                    </div>

                    <div className="divide-y divide-zinc-100 px-6">
                        {/* REVENUE */}
                        <div className="py-4">
                            <p className="font-mono text-[10px] text-zinc-400 uppercase font-bold mb-2">Revenue</p>
                            <PLRow label="Sales Revenue (Invoices & Receipts)" amount={data.salesRevenue} currency={data.currency} positive />
                            {data.nonOperatingIncome > 0 && <PLRow label="Non-Operating Income" amount={data.nonOperatingIncome} currency={data.currency} positive indent />}
                            <PLRow label="Total Revenue" amount={data.totalRevenue} currency={data.currency} bold positive />
                        </div>

                        {/* COGS */}
                        <div className="py-4">
                            <p className="font-mono text-[10px] text-zinc-400 uppercase font-bold mb-2">Cost of Goods Sold</p>
                            <PLRow label="Cost of Goods Sold (COGS)" amount={data.cogs} currency={data.currency} negative />
                            <PLRow label="Gross Profit" amount={data.grossProfit} currency={data.currency} bold positive={data.grossProfit >= 0} negative={data.grossProfit < 0} />
                            <div className="flex justify-between py-1 pl-6">
                                <span className="text-xs text-zinc-400">Gross Profit Margin</span>
                                <span className={`font-mono text-xs font-bold ${data.grossProfitMargin >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{data.grossProfitMargin.toFixed(1)}%</span>
                            </div>
                        </div>

                        {/* OPERATING EXPENSES */}
                        <div className="py-4">
                            <p className="font-mono text-[10px] text-zinc-400 uppercase font-bold mb-2">Operating Expenses</p>
                            {data.expenseLines.length === 0 && <p className="text-sm text-zinc-400 pl-4 py-2 italic">No expenses recorded for this period.</p>}
                            {data.expenseLines.map(line => (
                                <PLRow key={line.label} label={line.label} amount={line.amount} currency={data.currency} indent />
                            ))}
                            <PLRow label="Total Operating Expenses" amount={data.totalOperatingExpenses} currency={data.currency} bold negative />
                        </div>

                        {/* BOTTOM LINE */}
                        <div className="py-4">
                            <PLRow label="Net Operating Profit" amount={data.netOperatingProfit} currency={data.currency} bold positive={data.netOperatingProfit >= 0} negative={data.netOperatingProfit < 0} />
                            {data.nonOperatingIncome > 0 && <PLRow label="Add: Non-Operating Income" amount={data.nonOperatingIncome} currency={data.currency} positive indent />}
                        </div>
                    </div>

                    {/* Net Income Banner */}
                    <div className={`mx-6 mb-6 rounded-xl px-6 py-4 ${data.netIncome >= 0 ? "bg-emerald-50 border border-emerald-200" : "bg-rose-50 border border-rose-200"}`}>
                        <div className="flex justify-between items-center">
                            <span className={`font-mono text-xs uppercase font-bold ${data.netIncome >= 0 ? "text-emerald-700" : "text-rose-700"}`}>Net Income (Bottom Line)</span>
                            <span className={`text-2xl font-black font-sans ${data.netIncome >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                                {fmt(data.netIncome, data.currency)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
