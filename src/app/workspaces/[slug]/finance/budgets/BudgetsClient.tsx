"use client";

import { useState, useTransition } from "react";
import { upsertBudget } from "@/lib/actions/budgets";

interface BudgetLine {
    accountId: string;
    accountCode: string;
    accountName: string;
    budgetId: string | null;
    monthlyLimit: number | null;
    actual: number;
    percentUsed: number | null;
    isOverBudget: boolean;
    isWarning: boolean;
}

interface Props {
    shopId: string;
    shopSlug: string;
    isGlEnabled: boolean;
    month: number;
    year: number;
    currency: string;
    lines: BudgetLine[];
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function fmt(n: number, currency: string) {
    return `${currency} ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BudgetsClient({ shopId, shopSlug, isGlEnabled, month, year, currency, lines: initialLines }: Props) {
    const [lines, setLines] = useState<BudgetLine[]>(initialLines);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    function showMsg(type: "success" | "error", text: string) {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    }

    function handleSave(line: BudgetLine) {
        const limit = parseFloat(editValue);
        if (isNaN(limit) || limit < 0) return;

        startTransition(async () => {
            const res = await upsertBudget(shopId, shopSlug, {
                accountId: line.accountId,
                month,
                year,
                monthlyLimit: limit,
            });
            if (res.success) {
                const pct = limit > 0 ? Math.min((line.actual / limit) * 100, 100) : null;
                setLines(prev => prev.map(l => l.accountId === line.accountId
                    ? { ...l, monthlyLimit: limit, percentUsed: pct, isOverBudget: line.actual > limit, isWarning: pct !== null && pct >= 80 && pct < 100 }
                    : l
                ));
                setEditingId(null);
                showMsg("success", `Budget for ${line.accountName} set to ${fmt(limit, currency)}.`);
            } else {
                showMsg("error", (res as any).error || "Failed to save.");
            }
        });
    }

    if (!isGlEnabled) {
        return (
            <div className="text-center py-16 text-zinc-400">
                <p className="font-mono text-sm">General Ledger not activated.</p>
                <p className="text-sm mt-1">Go to <strong>Finance → Chart of Accounts</strong> to activate it.</p>
            </div>
        );
    }

    const overBudgetCount = lines.filter(l => l.isOverBudget).length;
    const warningCount = lines.filter(l => l.isWarning).length;

    return (
        <div className="space-y-5">
            {message && (
                <div className={`px-4 py-3 rounded-lg text-sm font-medium border ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
                    {message.text}
                </div>
            )}

            {/* Summary Banner */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border border-zinc-200 rounded-xl p-4">
                    <p className="font-mono text-[10px] uppercase text-zinc-400 font-semibold">Period</p>
                    <p className="text-lg font-bold text-black mt-1">{MONTH_NAMES[month - 1]} {year}</p>
                </div>
                <div className={`rounded-xl p-4 border ${overBudgetCount > 0 ? "bg-rose-50 border-rose-200" : "bg-white border-zinc-200"}`}>
                    <p className="font-mono text-[10px] uppercase text-zinc-400 font-semibold">Over Budget</p>
                    <p className={`text-lg font-bold mt-1 ${overBudgetCount > 0 ? "text-rose-700" : "text-black"}`}>{overBudgetCount} categories</p>
                </div>
                <div className={`rounded-xl p-4 border ${warningCount > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-zinc-200"}`}>
                    <p className="font-mono text-[10px] uppercase text-zinc-400 font-semibold">Near Limit (≥80%)</p>
                    <p className={`text-lg font-bold mt-1 ${warningCount > 0 ? "text-amber-700" : "text-black"}`}>{warningCount} categories</p>
                </div>
            </div>

            {/* Budget Lines */}
            <div className="space-y-3">
                {lines.map(line => {
                    const isEditing = editingId === line.accountId;
                    const pct = line.percentUsed;
                    const barColor = line.isOverBudget ? "bg-rose-500" : line.isWarning ? "bg-amber-400" : "bg-emerald-500";

                    return (
                        <div key={line.accountId} className={`border rounded-xl p-4 transition-colors ${line.isOverBudget ? "border-rose-200 bg-rose-50/30" : line.isWarning ? "border-amber-200 bg-amber-50/30" : "border-zinc-200 bg-white"}`}>
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs text-zinc-400">{line.accountCode}</span>
                                        <span className="text-sm font-semibold text-black">{line.accountName}</span>
                                        {line.isOverBudget && <span className="font-mono text-[9px] uppercase bg-rose-100 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded-full font-bold">Over Budget</span>}
                                        {line.isWarning && <span className="font-mono text-[9px] uppercase bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-bold">Warning</span>}
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-0.5">
                                        Spent: <strong className="text-black">{fmt(line.actual, currency)}</strong>
                                        {line.monthlyLimit !== null && <> of <strong>{fmt(line.monthlyLimit, currency)}</strong> budget</>}
                                        {line.monthlyLimit === null && <span className="text-zinc-400"> · No budget set</span>}
                                    </p>
                                </div>

                                {isEditing ? (
                                    <div className="flex gap-2 items-center flex-shrink-0">
                                        <input
                                            type="number" value={editValue} onChange={e => setEditValue(e.target.value)}
                                            onKeyDown={e => e.key === "Enter" && handleSave(line)}
                                            placeholder="Monthly limit"
                                            className="border border-zinc-200 rounded-lg px-3 py-1.5 text-sm w-36 focus:outline-none focus:ring-1 focus:ring-black"
                                            autoFocus />
                                        <button onClick={() => handleSave(line)} disabled={isPending}
                                            className="bg-black text-white px-3 py-1.5 rounded-lg font-mono text-xs uppercase font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50">
                                            Save
                                        </button>
                                        <button onClick={() => setEditingId(null)} className="text-xs text-zinc-400 hover:text-black">✕</button>
                                    </div>
                                ) : (
                                    <button onClick={() => { setEditingId(line.accountId); setEditValue(line.monthlyLimit?.toString() || ""); }}
                                        className="flex-shrink-0 font-mono text-xs uppercase text-zinc-400 hover:text-black transition-colors border border-zinc-200 hover:border-zinc-400 px-3 py-1.5 rounded-lg">
                                        {line.monthlyLimit !== null ? "Edit" : "Set Budget"}
                                    </button>
                                )}
                            </div>

                            {/* Progress Bar */}
                            {pct !== null && (
                                <div className="space-y-1">
                                    <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                                        <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-mono text-[10px] text-zinc-400">{pct.toFixed(1)}% used</span>
                                        {line.monthlyLimit !== null && line.actual < line.monthlyLimit && (
                                            <span className="font-mono text-[10px] text-zinc-400">
                                                {fmt(line.monthlyLimit - line.actual, currency)} remaining
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
