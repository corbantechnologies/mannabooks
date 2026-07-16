"use client";

import { useState, useTransition } from "react";
import { getCashFlowStatement, type CashFlowStatement, type ReportPeriod } from "@/lib/actions/reports";

interface Props { shopId: string; initialData: CashFlowStatement | null; currency: string; }

const PERIODS: { value: ReportPeriod; label: string }[] = [
    { value: "THIS_MONTH", label: "This Month" },
    { value: "LAST_MONTH", label: "Last Month" },
    { value: "THIS_QUARTER", label: "This Quarter" },
    { value: "THIS_YEAR", label: "This Fiscal Year" },
];

function fmt(n: number, currency: string) {
    const abs = Math.abs(n);
    const str = `${currency} ${abs.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
    return n < 0 ? `(${str})` : str;
}

function CashRow({ label, amount, currency, bold, indent, isInflow }: { label: string; amount: number; currency: string; bold?: boolean; indent?: boolean; isInflow?: boolean }) {
    const color = isInflow === undefined ? (amount >= 0 ? "text-emerald-700" : "text-rose-700") : isInflow ? "text-emerald-700" : "text-rose-700";
    return (
        <div className={`flex justify-between py-2 ${bold ? "border-t border-zinc-200 font-bold mt-1 pt-3" : ""} ${indent ? "pl-6" : ""}`}>
            <span className={`text-sm ${bold ? "font-bold text-black" : "text-zinc-600"}`}>{label}</span>
            <span className={`font-mono text-sm ${bold ? "font-bold" : ""} ${color}`}>{fmt(amount, currency)}</span>
        </div>
    );
}

export default function CashFlowClient({ shopId, initialData, currency }: Props) {
    const [data, setData] = useState<CashFlowStatement | null>(initialData);
    const [period, setPeriod] = useState<ReportPeriod>("THIS_MONTH");
    const [isPending, startTransition] = useTransition();

    function loadPeriod(p: ReportPeriod) {
        setPeriod(p);
        startTransition(async () => {
            const res = await getCashFlowStatement(shopId, p);
            if (res.success) setData(res.data);
        });
    }

    function handleCsvExport() {
        if (!data) return;
        const rows = [
            ["CASH FLOW STATEMENT", data.period], [],
            ["OPERATING ACTIVITIES"],
            ["Receipts from Clients", data.operating.receiptsFromClients],
            ["Payments to Suppliers", -data.operating.paymentsToSuppliers],
            ["Payroll Paid", -data.operating.payrollPaid],
            ["Operating Expenses", -data.operating.operatingExpensesPaid],
            ["Net Cash from Operations", data.operating.netOperating], [],
            ["INVESTING ACTIVITIES"],
            ["Asset Sales", data.investing.assetSales],
            ["Net Cash from Investing", data.investing.netInvesting], [],
            ["NET CASH FLOW", data.netCashFlow],
        ];
        const csv = rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `CashFlow_${data.period.replace(/\s/g, "_")}.csv`; a.click();
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2 items-center">
                {PERIODS.map(p => (
                    <button key={p.value} onClick={() => loadPeriod(p.value)}
                        className={`px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold border transition-colors ${period === p.value ? "bg-black text-white border-black" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"}`}>
                        {p.label}
                    </button>
                ))}
                <div className="ml-auto flex gap-2">
                    <button onClick={handleCsvExport} disabled={!data} className="px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold border border-zinc-200 hover:border-zinc-400 transition-colors disabled:opacity-40">Export CSV</button>
                    <button onClick={() => window.print()} disabled={!data} className="px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold bg-black text-white hover:bg-zinc-800 transition-colors disabled:opacity-40">Print / PDF</button>
                </div>
            </div>

            {isPending && <div className="text-center py-8 text-zinc-400 font-mono text-xs uppercase animate-pulse">Loading...</div>}

            {!isPending && data && (
                <div className="border border-zinc-200 rounded-2xl overflow-hidden">
                    <div className="bg-black text-white px-6 py-5">
                        <p className="font-mono text-xs uppercase text-zinc-400">Cash Flow Statement</p>
                        <h2 className="text-2xl font-bold font-sans mt-1">{data.period}</h2>
                    </div>

                    <div className="divide-y divide-zinc-100 px-6">
                        <div className="py-4">
                            <p className="font-mono text-[10px] text-zinc-400 uppercase font-bold mb-2">Operating Activities</p>
                            <CashRow label="Receipts from Clients" amount={data.operating.receiptsFromClients} currency={data.currency} isInflow={true} indent />
                            <CashRow label="Payments to Suppliers" amount={-data.operating.paymentsToSuppliers} currency={data.currency} isInflow={false} indent />
                            <CashRow label="Payroll Disbursements" amount={-data.operating.payrollPaid} currency={data.currency} isInflow={false} indent />
                            <CashRow label="Operating Expenses Paid" amount={-data.operating.operatingExpensesPaid} currency={data.currency} isInflow={false} indent />
                            <CashRow label="Net Cash from Operations" amount={data.operating.netOperating} currency={data.currency} bold />
                        </div>

                        {data.investing.assetSales > 0 && (
                            <div className="py-4">
                                <p className="font-mono text-[10px] text-zinc-400 uppercase font-bold mb-2">Investing Activities</p>
                                <CashRow label="Proceeds from Asset Sales" amount={data.investing.assetSales} currency={data.currency} isInflow={true} indent />
                                <CashRow label="Net Cash from Investing" amount={data.investing.netInvesting} currency={data.currency} bold />
                            </div>
                        )}
                    </div>

                    <div className={`mx-6 mb-6 rounded-xl px-6 py-4 ${data.netCashFlow >= 0 ? "bg-emerald-50 border border-emerald-200" : "bg-rose-50 border border-rose-200"}`}>
                        <div className="flex justify-between items-center">
                            <span className={`font-mono text-xs uppercase font-bold ${data.netCashFlow >= 0 ? "text-emerald-700" : "text-rose-700"}`}>Net Cash Flow</span>
                            <span className={`text-2xl font-black font-sans ${data.netCashFlow >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                                {fmt(data.netCashFlow, data.currency)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
