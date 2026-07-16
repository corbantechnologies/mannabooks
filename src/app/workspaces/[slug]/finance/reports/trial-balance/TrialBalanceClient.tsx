"use client";

import { type TrialBalanceRow } from "@/lib/actions/reports";

interface Props {
    shopId: string;
    isGlEnabled: boolean;
    currency: string;
    initialRows: TrialBalanceRow[];
    totalDebits: number;
    totalCredits: number;
    isBalanced: boolean;
}

const TYPE_COLORS: Record<string, string> = {
    ASSET: "text-blue-700",
    LIABILITY: "text-rose-700",
    EQUITY: "text-purple-700",
    REVENUE: "text-emerald-700",
    EXPENSE: "text-amber-700",
};

function fmt(n: number, currency: string) {
    if (n === 0) return "—";
    return `${currency} ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function TrialBalanceClient({ isGlEnabled, currency, initialRows, totalDebits, totalCredits, isBalanced }: Props) {
    function handleCsvExport() {
        const rows = [
            ["TRIAL BALANCE"],
            ["Account Code", "Account Name", "Type", "Debits", "Credits", "Balance"],
            ...initialRows.map(r => [r.code, r.name, r.accountType, r.totalDebits, r.totalCredits, r.balance]),
            [],
            ["TOTALS", "", "", totalDebits, totalCredits, totalDebits - totalCredits],
            ["BALANCED?", isBalanced ? "YES" : "NO"],
        ];
        const csv = rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "TrialBalance.csv"; a.click();
    }

    if (!isGlEnabled) {
        return (
            <div className="text-center py-16 text-zinc-400">
                <p className="font-mono text-sm">General Ledger not activated.</p>
                <p className="text-sm mt-1">Go to <strong>Finance → Chart of Accounts</strong> to activate it.</p>
            </div>
        );
    }

    if (initialRows.length === 0) {
        return (
            <div className="text-center py-16 text-zinc-400">
                <p className="font-mono text-sm">No journal entries found yet.</p>
                <p className="text-sm mt-1">Post transactions or run the GL migration to populate the trial balance.</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Balance Status Banner */}
            <div className={`px-5 py-4 rounded-xl border flex items-center justify-between gap-4 ${isBalanced ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
                <div>
                    <p className={`font-mono text-xs font-bold uppercase ${isBalanced ? "text-emerald-700" : "text-rose-700"}`}>
                        {isBalanced ? "✓ Books are Balanced" : "⚠ Imbalance Detected"}
                    </p>
                    <p className={`text-sm mt-0.5 ${isBalanced ? "text-emerald-700" : "text-rose-700"}`}>
                        {isBalanced
                            ? "Total debits equal total credits. Your books are in order."
                            : `Difference: ${currency} ${Math.abs(totalDebits - totalCredits).toLocaleString("en-KE", { minimumFractionDigits: 2 })}. Review journal entries for missing postings.`}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleCsvExport}
                        className="px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold border border-zinc-200 bg-white hover:border-zinc-400 transition-colors">
                        Export CSV
                    </button>
                    <button onClick={() => window.print()}
                        className="px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold bg-black text-white hover:bg-zinc-800 transition-colors">
                        Print / PDF
                    </button>
                </div>
            </div>

            {/* Trial Balance Table */}
            <div className="border border-zinc-200 rounded-xl overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[80px_1fr_100px_130px_130px_130px] gap-4 px-4 py-2.5 bg-zinc-50 border-b border-zinc-200">
                    <span className="font-mono text-[10px] uppercase text-zinc-400 font-semibold">Code</span>
                    <span className="font-mono text-[10px] uppercase text-zinc-400 font-semibold">Account</span>
                    <span className="font-mono text-[10px] uppercase text-zinc-400 font-semibold">Type</span>
                    <span className="font-mono text-[10px] uppercase text-zinc-400 font-semibold text-right">Debits</span>
                    <span className="font-mono text-[10px] uppercase text-zinc-400 font-semibold text-right">Credits</span>
                    <span className="font-mono text-[10px] uppercase text-zinc-400 font-semibold text-right">Balance</span>
                </div>

                <div className="divide-y divide-zinc-100">
                    {initialRows.map(row => (
                        <div key={row.code} className="grid grid-cols-[80px_1fr_100px_130px_130px_130px] gap-4 px-4 py-3 items-center hover:bg-zinc-50 transition-colors">
                            <span className="font-mono text-sm text-zinc-400 font-bold">{row.code}</span>
                            <span className="text-sm text-black font-medium truncate">{row.name}</span>
                            <span className={`font-mono text-[10px] uppercase font-bold ${TYPE_COLORS[row.accountType] || "text-zinc-500"}`}>{row.accountType}</span>
                            <span className="font-mono text-sm text-right text-black">{fmt(row.totalDebits, currency)}</span>
                            <span className="font-mono text-sm text-right text-black">{fmt(row.totalCredits, currency)}</span>
                            <span className={`font-mono text-sm text-right font-bold ${row.balance >= 0 ? "text-black" : "text-rose-600"}`}>
                                {fmt(Math.abs(row.balance), currency)}{row.balance < 0 ? " Cr" : ""}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Totals Footer */}
                <div className="grid grid-cols-[80px_1fr_100px_130px_130px_130px] gap-4 px-4 py-3.5 bg-zinc-900 border-t border-zinc-200">
                    <span className="font-mono text-xs text-zinc-400"></span>
                    <span className="font-mono text-xs font-bold uppercase text-white col-span-2">TOTALS</span>
                    <span className="font-mono text-sm font-bold text-white text-right">{currency} {totalDebits.toLocaleString("en-KE", { minimumFractionDigits: 2 })}</span>
                    <span className="font-mono text-sm font-bold text-white text-right">{currency} {totalCredits.toLocaleString("en-KE", { minimumFractionDigits: 2 })}</span>
                    <span className={`font-mono text-sm font-bold text-right ${isBalanced ? "text-emerald-400" : "text-rose-400"}`}>
                        {isBalanced ? "✓ 0.00" : `${currency} ${Math.abs(totalDebits - totalCredits).toFixed(2)}`}
                    </span>
                </div>
            </div>
        </div>
    );
}
