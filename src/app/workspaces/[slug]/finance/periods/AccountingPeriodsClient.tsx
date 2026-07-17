"use client";

import { useState, useTransition } from "react";
import { closePeriod, reopenPeriod } from "@/lib/actions/gl";

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

export default function AccountingPeriodsClient({ shopId, shopSlug, isGlEnabled, glOnboardingMode, periods: initialPeriods }: Props) {
    const [periods, setPeriods] = useState<Period[]>(initialPeriods);
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [confirmClose, setConfirmClose] = useState<string | null>(null);

    function showMsg(type: "success" | "error", text: string) {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
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
                    
                    <div className="border border-zinc-200 rounded-xl overflow-hidden">
                        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-4 py-2.5 bg-zinc-50 border-b border-zinc-200">
                            <span className="font-mono text-[10px] uppercase text-zinc-400 font-semibold">Period</span>
                            <span className="font-mono text-[10px] uppercase text-zinc-400 font-semibold">Date Range</span>
                            <span className="font-mono text-[10px] uppercase text-zinc-400 font-semibold">Closed By</span>
                            <span className="font-mono text-[10px] uppercase text-zinc-400 font-semibold">Status</span>
                        </div>
                        <div className="divide-y divide-zinc-100">
                            {fyPeriods.map(period => (
                                <div key={period.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-4 py-3.5 items-center hover:bg-zinc-50 transition-colors">
                                    <span className="text-sm font-semibold text-black">{period.periodName}</span>
                                    <span className="text-xs text-zinc-500 font-mono">
                                        {period.startDate} → {period.endDate}
                                    </span>
                                    <span className="text-xs text-zinc-500">
                                        {period.closedAt
                                            ? `${period.closedByName || "Unknown"} · ${new Date(period.closedAt).toLocaleDateString("en-KE")}`
                                            : "—"
                                        }
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className={`font-mono text-[10px] uppercase px-2 py-1 rounded-full border font-bold ${period.status === "OPEN" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-zinc-100 text-zinc-500 border-zinc-200"}`}>
                                            {period.status}
                                        </span>
                                        {period.status === "OPEN" ? (
                                            <button onClick={() => setConfirmClose(period.id)} disabled={isPending}
                                                className="font-mono text-[10px] uppercase text-zinc-500 hover:text-rose-600 transition-colors disabled:opacity-40">
                                                Close
                                            </button>
                                        ) : (
                                            <button onClick={() => handleReopen(period.id)} disabled={isPending}
                                                className="font-mono text-[10px] uppercase text-zinc-500 hover:text-emerald-600 transition-colors disabled:opacity-40">
                                                Reopen
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
