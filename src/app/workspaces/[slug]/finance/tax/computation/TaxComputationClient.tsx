"use client";

import { useState, useTransition } from "react";
import { getTaxComputation, type TaxComputationData } from "@/lib/actions/tax";

interface Props {
    shopId: string;
    year: number;
    currency: string;
    initialData: TaxComputationData | null;
}

function fmt(amount: number, currency: string) {
    const abs = Math.abs(amount);
    const str = `${currency} ${abs.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return amount < 0 ? `(${str})` : str;
}

function TaxRow({ label, amount, currency, bold, indent, negative, positive }: {
    label: string; amount: number; currency: string; bold?: boolean; indent?: boolean;
    negative?: boolean; positive?: boolean;
}) {
    const isNeg = amount < 0;
    const color = positive ? "text-emerald-700" : negative ? "text-rose-700" : isNeg ? "text-rose-700" : "text-black";
    return (
        <div className={`flex justify-between items-center py-2.5 ${bold ? "font-bold border-t border-zinc-300 mt-2 pt-3" : ""} ${indent ? "pl-6" : ""}`}>
            <span className={`text-sm ${bold ? "text-black font-bold" : "text-zinc-600"}`}>{label}</span>
            <span className={`font-mono text-sm ${bold ? "font-bold" : ""} ${color}`}>{fmt(amount, currency)}</span>
        </div>
    );
}

export default function TaxComputationClient({ shopId, year: initialYear, currency, initialData }: Props) {
    const [data, setData] = useState<TaxComputationData | null>(initialData);
    const [year, setYear] = useState(initialYear);
    const [isPending, startTransition] = useTransition();

    function loadYear(y: number) {
        setYear(y);
        startTransition(async () => {
            const res = await getTaxComputation(shopId, y);
            if (res.success) setData(res.data);
        });
    }

    return (
        <div className="space-y-6">
            {/* Year Selector */}
            <div className="flex gap-2 items-center">
                {[initialYear - 1, initialYear, initialYear + 1].map(y => (
                    <button key={y} onClick={() => loadYear(y)}
                        className={`px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold border transition-colors ${year === y ? "badge-emerald" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"}`}>
                        Year {y}
                    </button>
                ))}
                <button onClick={() => window.print()} disabled={!data}
                    className="ml-auto px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold bg-black text-white hover:bg-zinc-800 transition-colors disabled:opacity-40">
                    Print Computation
                </button>
            </div>

            {isPending && <div className="text-center py-8 text-zinc-400 font-mono text-xs uppercase animate-pulse">Computing...</div>}

            {!isPending && data && (
                <div className="border border-zinc-200 rounded-2xl overflow-hidden print:border-0 bg-white">
                    {/* Header */}
                    <div className="bg-black text-white px-6 py-5">
                        <p className="font-mono text-xs uppercase text-zinc-400">Income Tax Computation Sheet</p>
                        <h2 className="text-2xl font-bold font-sans mt-1">Fiscal Year {year}</h2>
                        <p className="text-zinc-400 text-sm mt-0.5">Assessed using Corporate Income Tax rules</p>
                    </div>

                    <div className="divide-y divide-zinc-100 px-6">
                        {/* Book Profit */}
                        <div className="py-4">
                            <TaxRow label="Net Income (per P&L Statement)" amount={data.netIncome} currency={currency} bold positive={data.netIncome >= 0} negative={data.netIncome < 0} />
                        </div>

                        {/* Adjustments */}
                        <div className="py-4">
                            <p className="font-mono text-[10px] text-zinc-400 uppercase font-bold mb-2">Tax Adjustments</p>
                            <TaxRow label="Add: Non-deductible expenses (Fines, Private etc.)" amount={data.nonDeductibleExpenses} currency={currency} positive indent />
                            <TaxRow label="Less: Capital Allowances (Wear & Tear deduction)" amount={-data.capitalAllowances} currency={currency} negative indent />
                        </div>

                        {/* Taxable Profit */}
                        <div className="py-4">
                            <TaxRow label="Taxable Net Income" amount={data.taxableIncome} currency={currency} bold positive />
                            <div className="flex justify-between py-1 pl-6">
                                <span className="text-xs text-zinc-500">Corporate Income Tax Rate</span>
                                <span className="font-mono text-xs font-bold text-black">{data.citRate.toFixed(1)}%</span>
                            </div>
                        </div>

                        {/* Liabilities & Credits */}
                        <div className="py-4">
                            <TaxRow label="Gross Tax Liability" amount={data.grossTaxLiability} currency={currency} bold negative />
                            {data.instalmentsPaid > 0 && (
                                <TaxRow label="Less: CIT Instalments already paid (Asset Account 2310)" amount={-data.instalmentsPaid} currency={currency} positive indent />
                            )}
                        </div>
                    </div>

                    {/* Bottom Line Balance Due */}
                    <div className={`mx-6 mb-6 rounded-xl px-6 py-4 ${data.netTaxDue >= 0 ? "bg-rose-50 border border-rose-200" : "bg-emerald-50 border border-emerald-200"}`}>
                        <div className="flex justify-between items-center">
                            <span className={`font-mono text-xs uppercase font-bold ${data.netTaxDue >= 0 ? "text-rose-700" : "text-emerald-700"}`}>
                                {data.netTaxDue >= 0 ? "Income Tax Due to KRA" : "Tax Overpayment / Refund Due"}
                            </span>
                            <span className={`text-2xl font-black font-sans ${data.netTaxDue >= 0 ? "text-rose-700" : "text-emerald-700"}`}>
                                {fmt(data.netTaxDue, currency)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
