"use client";

import { useState, useTransition } from "react";
import { getTurnoverTaxQuarterly, type TurnoverTaxQuarter } from "@/lib/actions/tax";

interface Props {
    shopId: string;
    year: number;
    quarters: TurnoverTaxQuarter[];
    currency: string;
}

function fmt(amount: number, currency: string) {
    return `${currency} ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function TurnoverTaxClient({ shopId, year: initialYear, quarters: initialQuarters, currency }: Props) {
    const [quarters, setQuarters] = useState<TurnoverTaxQuarter[]>(initialQuarters);
    const [year, setYear] = useState(initialYear);
    const [isPending, startTransition] = useTransition();

    function loadYear(y: number) {
        setYear(y);
        startTransition(async () => {
            const res = await getTurnoverTaxQuarterly(shopId, y);
            if (res.success) setQuarters(res.quarters);
        });
    }

    const totalTurnover = quarters.reduce((s, q) => s + q.grossSales, 0);
    const totalTax = quarters.reduce((s, q) => s + q.taxLiability, 0);

    return (
        <div className="space-y-6">
            {/* Year Selector */}
            <div className="flex gap-2 items-center">
                {[initialYear - 1, initialYear, initialYear + 1].map(y => (
                    <button key={y} onClick={() => loadYear(y)}
                        className={`px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold border transition-colors ${year === y ? "bg-black text-white border-black" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"}`}>
                        Year {y}
                    </button>
                ))}
                <button onClick={() => window.print()}
                    className="ml-auto px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold bg-black text-white hover:bg-zinc-800 transition-colors">
                    Print Schedule
                </button>
            </div>

            {isPending && <div className="text-center py-8 text-zinc-400 font-mono text-xs uppercase animate-pulse">Calculating...</div>}

            {!isPending && quarters.length > 0 && (
                <div className="space-y-6 bg-white">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5">
                            <p className="font-mono text-[10px] uppercase text-zinc-400 font-semibold">Total Gross Turnover (Year {year})</p>
                            <p className="text-xl font-bold text-black mt-1 font-mono">{fmt(totalTurnover, currency)}</p>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                            <p className="font-mono text-[10px] uppercase text-amber-800 font-semibold">Total TOT Liability (1.5%)</p>
                            <p className="text-xl font-bold text-amber-800 mt-1 font-mono">{fmt(totalTax, currency)}</p>
                        </div>
                    </div>

                    {/* Quarter Breakdown */}
                    <div className="border border-zinc-200 rounded-xl overflow-hidden">
                        <div className="grid grid-cols-[80px_2fr_1.5fr_1.5fr] gap-4 px-4 py-2.5 bg-zinc-50 border-b border-zinc-200">
                            <span className="font-mono text-[9px] uppercase text-zinc-400 font-semibold">Quarter</span>
                            <span className="font-mono text-[9px] uppercase text-zinc-400 font-semibold">Period</span>
                            <span className="font-mono text-[9px] uppercase text-zinc-400 font-semibold text-right">Gross Sales</span>
                            <span className="font-mono text-[9px] uppercase text-zinc-400 font-semibold text-right">TOT Liability (1.5%)</span>
                        </div>

                        <div className="divide-y divide-zinc-100">
                            {quarters.map(q => (
                                <div key={q.quarter} className="grid grid-cols-[80px_2fr_1.5fr_1.5fr] gap-4 px-4 py-3.5 items-center hover:bg-zinc-50/50 transition-colors">
                                    <span className="text-sm font-bold text-black">Q{q.quarter}</span>
                                    <span className="text-xs text-zinc-500 font-mono">
                                        {new Date(q.startDate).toLocaleDateString("en-KE", { month: "short", year: "numeric" })}
                                        {" – "}
                                        {new Date(q.endDate).toLocaleDateString("en-KE", { month: "short", year: "numeric" })}
                                    </span>
                                    <span className="text-xs font-mono text-right text-black">{fmt(q.grossSales, currency)}</span>
                                    <span className="text-xs font-mono text-right text-amber-700 font-bold">{fmt(q.taxLiability, currency)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
