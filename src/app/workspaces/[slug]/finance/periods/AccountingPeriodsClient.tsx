"use client";

import { useState, useTransition } from "react";
import { closePeriod, reopenPeriod, getPeriodDetails } from "@/lib/actions/gl";
import { Spinner } from "@/components/Spinner";

interface Period {
    id: string;
    periodName: string;
    startDate: string;
    endDate: string;
    status: "OPEN" | "CLOSED";
    closedAt: string | null;
    closedByName: string | null;
    fiscalYearLabel: string;
}

interface Props {
    shopId: string;
    shopSlug: string;
    isGlEnabled: boolean;
    glOnboardingMode: boolean;
    periods: Period[];
}

function fmt(n: number) {
    return n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AccountingPeriodsClient({ shopId, shopSlug, isGlEnabled, glOnboardingMode, periods: initialPeriods }: Props) {
    const [periods, setPeriods] = useState<Period[]>(initialPeriods);
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [confirmClose, setConfirmClose] = useState<string | null>(null);
    const [inspectPeriodId, setInspectPeriodId] = useState<string | null>(null);
    const [periodDetails, setPeriodDetails] = useState<any | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [entrySearch, setEntrySearch] = useState("");

    function showMsg(type: "success" | "error", text: string) {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    }

    async function handleInspect(periodId: string) {
        setInspectPeriodId(periodId);
        setLoadingDetails(true);
        setPeriodDetails(null);
        try {
            const res = await getPeriodDetails(shopId, periodId);
            if (res.success) {
                setPeriodDetails(res.data);
            } else {
                showMsg("error", res.error || "Failed to load period details.");
                setInspectPeriodId(null);
            }
        } catch (err: any) {
            showMsg("error", err.message || "Failed to load period details.");
            setInspectPeriodId(null);
        } finally {
            setLoadingDetails(false);
        }
    }

    function handleClose(periodId: string) {
        startTransition(async () => {
            const res = await closePeriod(shopId, shopSlug, periodId);
            if (res.success) {
                setPeriods(prev => prev.map(p => p.id === periodId ? { ...p, status: "CLOSED" as const, closedAt: new Date().toISOString() } : p));
                showMsg("success", "Period closed. No new entries can be posted to this period.");
                setConfirmClose(null);
            } else {
                showMsg("error", res.error);
            }
        });
    }

    function handleReopen(periodId: string) {
        startTransition(async () => {
            const res = await reopenPeriod(shopId, shopSlug, periodId);
            if (res.success) {
                setPeriods(prev => prev.map(p => p.id === periodId ? { ...p, status: "OPEN" as const, closedAt: null } : p));
                showMsg("success", "Period reopened. Entries can be posted again.");
            } else {
                showMsg("error", res.error);
            }
        });
    }

    if (!isGlEnabled) {
        return (
            <div className="text-center py-16 text-zinc-400">
                <p className="font-mono text-sm">General Ledger is not activated yet.</p>
                <p className="text-sm mt-1">Go to <strong>Finance → Chart of Accounts</strong> to activate it.</p>
            </div>
        );
    }

    if (periods.length === 0) {
        return (
            <div className="text-center py-16 text-zinc-400">
                <p className="font-mono text-sm">No accounting periods found.</p>
                <p className="text-sm mt-1">Periods are auto-created when GL is activated and when a Fiscal Year is declared.</p>
            </div>
        );
    }

    // Group periods by their parent fiscal year label
    const groupedPeriods: Record<string, Period[]> = {};
    periods.forEach(p => {
        const label = p.fiscalYearLabel || "Unassigned / Historical";
        if (!groupedPeriods[label]) groupedPeriods[label] = [];
        groupedPeriods[label].push(p);
    });

    const filteredEntries = periodDetails?.entries?.filter((e: any) => {
        if (!entrySearch.trim()) return true;
        const q = entrySearch.toLowerCase();
        return (
            e.description.toLowerCase().includes(q) ||
            e.debitAccountName.toLowerCase().includes(q) ||
            e.creditAccountName.toLowerCase().includes(q) ||
            e.debitAccountCode.includes(q) ||
            e.creditAccountCode.includes(q)
        );
    }) || [];

    return (
        <div className="space-y-6">
            {message && (
                <div className={`px-4 py-3 rounded-lg text-sm font-medium border ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
                    {message.text}
                </div>
            )}

            {glOnboardingMode && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
                    ⚠ <strong>Onboarding Mode:</strong> Period close rules are suspended. All entries can be backdated freely.
                </div>
            )}

            {/* Confirmation Dialog */}
            {confirmClose && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <p className="font-mono text-xs font-bold text-rose-700 uppercase">Confirm Period Close</p>
                        <p className="text-rose-700 text-sm mt-0.5">This will lock all entries for this period. A month-end snapshot will be recorded. Are you sure?</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => handleClose(confirmClose)} disabled={isPending}
                            className="bg-rose-600 text-white px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold hover:bg-rose-700 transition-colors disabled:opacity-50">
                            {isPending ? "Closing..." : "Yes, Close Period"}
                        </button>
                        <button onClick={() => setConfirmClose(null)}
                            className="bg-white border border-rose-200 text-rose-700 px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold hover:bg-rose-50 transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Periods Grouped Tables */}
            {Object.entries(groupedPeriods).map(([fyLabel, fyPeriods]) => (
                <div key={fyLabel} className="space-y-3">
                    <h3 className="font-mono text-xs uppercase font-bold text-zinc-500 tracking-wider pl-1">{fyLabel}</h3>
                    
                    <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <div className="min-w-[700px]">
                                <div className="grid grid-cols-[1.2fr_1.4fr_1.4fr_auto] gap-4 px-4 py-2.5 bg-zinc-50 border-b border-zinc-100">
                                    <span className="font-mono text-[10px] uppercase text-zinc-400 font-semibold">Period</span>
                                    <span className="font-mono text-[10px] uppercase text-zinc-400 font-semibold">Date Range</span>
                                    <span className="font-mono text-[10px] uppercase text-zinc-400 font-semibold">Closed By</span>
                                    <span className="font-mono text-[10px] uppercase text-zinc-400 font-semibold text-right">Actions</span>
                                </div>
                                <div className="divide-y divide-zinc-100">
                                    {fyPeriods.map(period => (
                                        <div key={period.id} className="grid grid-cols-[1.2fr_1.4fr_1.4fr_auto] gap-4 px-4 py-3.5 items-center hover:bg-zinc-50/60 transition-colors">
                                            <div>
                                                <button
                                                    onClick={() => handleInspect(period.id)}
                                                    className="text-sm font-semibold text-black hover:underline text-left block"
                                                >
                                                    {period.periodName}
                                                </button>
                                                <span className="text-[10px] font-mono text-zinc-400">Click to view details</span>
                                            </div>
                                            <span className="text-xs text-zinc-500 font-mono">
                                                {period.startDate} → {period.endDate}
                                            </span>
                                            <span className="text-xs text-zinc-500">
                                                {period.closedAt
                                                    ? `${period.closedByName || "Unknown"} · ${new Date(period.closedAt).toLocaleDateString("en-KE")}`
                                                    : "—"
                                                }
                                            </span>
                                            <div className="flex items-center gap-2 justify-end">
                                                <button
                                                    onClick={() => handleInspect(period.id)}
                                                    className="font-mono text-[10px] uppercase px-2.5 py-1 rounded border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-bold transition-colors"
                                                >
                                                    Inspect
                                                </button>

                                                <span className={`font-mono text-[10px] uppercase px-2 py-1 rounded-full border font-bold ${period.status === "OPEN" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-zinc-100 text-zinc-500 border-zinc-200"}`}>
                                                    {period.status}
                                                </span>
                                                {period.status === "OPEN" ? (
                                                    <button onClick={() => setConfirmClose(period.id)} disabled={isPending}
                                                        className="font-mono text-[10px] uppercase text-zinc-500 hover:text-rose-600 transition-colors disabled:opacity-40 ml-1">
                                                        Close
                                                    </button>
                                                ) : (
                                                    <button onClick={() => handleReopen(period.id)} disabled={isPending}
                                                        className="font-mono text-[10px] uppercase text-zinc-500 hover:text-emerald-600 transition-colors disabled:opacity-40 ml-1">
                                                        Reopen
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* PERIOD DETAILS INSPECTION MODAL */}
            {inspectPeriodId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white border border-zinc-200 rounded-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                        {loadingDetails ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-3">
                                <Spinner className="w-6 h-6 text-black" />
                                <p className="font-mono text-xs text-zinc-500 uppercase font-bold">Loading Period Financials...</p>
                            </div>
                        ) : periodDetails ? (
                            <>
                                <div className="flex items-start justify-between border-b border-zinc-100 pb-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-xl font-bold font-sans text-black">
                                                {periodDetails.period.periodName}
                                            </h2>
                                            <span className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded-full border font-bold ${periodDetails.period.status === "OPEN" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-zinc-100 text-zinc-500 border-zinc-200"}`}>
                                                {periodDetails.period.status}
                                            </span>
                                        </div>
                                        <p className="text-xs font-mono text-zinc-500 mt-1">
                                            {periodDetails.period.fiscalYearLabel} · {periodDetails.period.startDate} → {periodDetails.period.endDate}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setInspectPeriodId(null)}
                                        className="text-zinc-400 hover:text-black font-mono text-xs uppercase font-bold px-2 py-1"
                                    >
                                        ✕ Close
                                    </button>
                                </div>

                                {/* KPI METRICS */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="p-3 border border-zinc-200 rounded-xl bg-zinc-50/50">
                                        <span className="font-mono text-[10px] uppercase text-zinc-400 font-bold block">Gross Revenue</span>
                                        <span className="font-mono text-sm font-bold text-black mt-1 block">
                                            KES {fmt(periodDetails.kpis.totalRevenue)}
                                        </span>
                                    </div>
                                    <div className="p-3 border border-zinc-200 rounded-xl bg-zinc-50/50">
                                        <span className="font-mono text-[10px] uppercase text-zinc-400 font-bold block">Operating Expenses</span>
                                        <span className="font-mono text-sm font-bold text-rose-600 mt-1 block">
                                            KES {fmt(periodDetails.kpis.totalExpenses)}
                                        </span>
                                    </div>
                                    <div className="p-3 border border-zinc-200 rounded-xl bg-zinc-50/50">
                                        <span className="font-mono text-[10px] uppercase text-zinc-400 font-bold block">Net Income</span>
                                        <span className={`font-mono text-sm font-bold mt-1 block ${periodDetails.kpis.netIncome >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                                            KES {fmt(periodDetails.kpis.netIncome)}
                                        </span>
                                    </div>
                                    <div className="p-3 border border-zinc-200 rounded-xl bg-zinc-50/50">
                                        <span className="font-mono text-[10px] uppercase text-zinc-400 font-bold block">Ledger Balance</span>
                                        <span className="font-mono text-xs font-bold text-emerald-800 mt-1 block">
                                            {periodDetails.kpis.isBalanced ? "✓ Balanced (0.00 Diff)" : "⚠ Imbalanced"}
                                        </span>
                                        <span className="font-mono text-[9px] text-zinc-400">
                                            {periodDetails.kpis.entryCount} journal entries
                                        </span>
                                    </div>
                                </div>

                                {/* JOURNAL TRANSACTIONS STREAM */}
                                <div className="space-y-3">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                        <h3 className="font-mono text-xs uppercase font-bold text-zinc-700">
                                            Monthly Journal Entries ({filteredEntries.length})
                                        </h3>
                                        <input
                                            type="text"
                                            value={entrySearch}
                                            onChange={(e) => setEntrySearch(e.target.value)}
                                            placeholder="Search description or account..."
                                            className="border border-zinc-200 rounded-lg px-3 py-1.5 font-sans text-xs w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-black"
                                        />
                                    </div>

                                    <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
                                        <div className="overflow-x-auto max-h-72">
                                            <table className="w-full text-left font-mono text-xs border-collapse">
                                                <thead className="sticky top-0 bg-zinc-50 border-b border-zinc-100 uppercase text-[10px] text-zinc-500 font-semibold">
                                                    <tr>
                                                        <th className="p-2.5">Date</th>
                                                        <th className="p-2.5">Description</th>
                                                        <th className="p-2.5">Debit (DR)</th>
                                                        <th className="p-2.5">Credit (CR)</th>
                                                        <th className="p-2.5 text-right">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-100">
                                                    {filteredEntries.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={5} className="p-8 text-center text-zinc-400">
                                                                No journal entries recorded for this period.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        filteredEntries.map((e: any) => (
                                                            <tr key={e.id} className="hover:bg-zinc-50/50">
                                                                <td className="p-2.5 text-zinc-500 whitespace-nowrap">{e.entryDate}</td>
                                                                <td className="p-2.5 font-sans text-xs text-black">{e.description}</td>
                                                                <td className="p-2.5">
                                                                    <span className="font-bold text-zinc-800">{e.debitAccountCode}</span>
                                                                    <span className="text-zinc-500 text-[10px] block">{e.debitAccountName}</span>
                                                                </td>
                                                                <td className="p-2.5">
                                                                    <span className="font-bold text-zinc-800">{e.creditAccountCode}</span>
                                                                    <span className="text-zinc-500 text-[10px] block">{e.creditAccountName}</span>
                                                                </td>
                                                                <td className="p-2.5 text-right font-bold text-black whitespace-nowrap">
                                                                    KES {fmt(e.amount)}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}
