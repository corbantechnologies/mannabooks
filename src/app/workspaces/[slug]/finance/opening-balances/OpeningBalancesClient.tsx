"use client";

import { useState, useTransition } from "react";
import { postOpeningBalances } from "@/lib/actions/gl";

type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

interface Account {
    id: string;
    code: string;
    name: string;
    accountType: AccountType;
}

interface Props {
    shopId: string;
    shopSlug: string;
    accounts: Account[];
}

interface BalanceLine {
    accountId: string;
    debitAmount: string;
    creditAmount: string;
}

const TYPE_ORDER: AccountType[] = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"];

// Standard convention hints per type
const TYPE_HINT: Record<AccountType, string> = {
    ASSET: "Positive balance → Debit (DR)",
    LIABILITY: "Positive balance → Credit (CR)",
    EQUITY: "Positive balance → Credit (CR)",
    REVENUE: "Positive balance → Credit (CR)",
    EXPENSE: "Positive balance → Debit (DR)",
};

const TYPE_DEFAULT: Record<AccountType, "debit" | "credit"> = {
    ASSET: "debit",
    LIABILITY: "credit",
    EQUITY: "credit",
    REVENUE: "credit",
    EXPENSE: "debit",
};

function fmt(n: number) {
    return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function OpeningBalancesClient({ shopId, shopSlug, accounts }: Props) {
    const [asOfDate, setAsOfDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 1); // default: yesterday
        return d.toISOString().split("T")[0];
    });
    const [balances, setBalances] = useState<Record<string, BalanceLine>>(
        Object.fromEntries(accounts.map(a => [a.id, { accountId: a.id, debitAmount: "", creditAmount: "" }]))
    );
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    function setField(accountId: string, field: "debitAmount" | "creditAmount", value: string) {
        setBalances(prev => ({ ...prev, [accountId]: { ...prev[accountId], [field]: value } }));
    }

    function clearOpposite(accountId: string, field: "debitAmount" | "creditAmount") {
        const opposite = field === "debitAmount" ? "creditAmount" : "debitAmount";
        setBalances(prev => ({ ...prev, [accountId]: { ...prev[accountId], [opposite]: "" } }));
    }

    // Summary totals
    const totalDebits = Object.values(balances).reduce((s, l) => s + (parseFloat(l.debitAmount) || 0), 0);
    const totalCredits = Object.values(balances).reduce((s, l) => s + (parseFloat(l.creditAmount) || 0), 0);
    const difference = Math.abs(totalDebits - totalCredits);
    const isBalanced = difference < 0.01;
    const hasAnyEntry = Object.values(balances).some(l => parseFloat(l.debitAmount) > 0 || parseFloat(l.creditAmount) > 0);

    function handleSubmit() {
        if (!asOfDate) { setMessage({ type: "error", text: "Please select an 'As of' date." }); return; }

        const lines = Object.values(balances)
            .filter(l => parseFloat(l.debitAmount) > 0 || parseFloat(l.creditAmount) > 0)
            .map(l => ({
                accountId: l.accountId,
                accountCode: accounts.find(a => a.id === l.accountId)?.code || "",
                debitAmount: parseFloat(l.debitAmount) || 0,
                creditAmount: parseFloat(l.creditAmount) || 0,
            }));

        if (lines.length === 0) { setMessage({ type: "error", text: "Enter at least one balance." }); return; }

        startTransition(async () => {
            const res = await postOpeningBalances(shopId, shopSlug, new Date(asOfDate + "T00:00:00"), lines);
            if (res.success) {
                setMessage({ type: "success", text: `✓ ${res.posted} opening balance entries posted successfully.` });
                // Reset
                setBalances(Object.fromEntries(accounts.map(a => [a.id, { accountId: a.id, debitAmount: "", creditAmount: "" }])));
            } else {
                setMessage({ type: "error", text: res.error });
            }
        });
    }

    return (
        <div className="space-y-6">
            {message && (
                <div className={`px-4 py-3 rounded-lg text-sm font-medium border ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
                    {message.text}
                </div>
            )}

            {/* As-of Date */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 border border-zinc-200 rounded-xl p-5">
                <div className="flex-1">
                    <label className="font-mono text-xs uppercase text-zinc-400 font-semibold block mb-1">Balances As Of Date</label>
                    <p className="text-xs text-zinc-500">This is the date your balances were last confirmed — typically the last day of the prior accounting period.</p>
                </div>
                <input
                    type="date"
                    value={asOfDate}
                    onChange={e => setAsOfDate(e.target.value)}
                    className="border border-zinc-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black font-mono"
                />
            </div>

            {/* Balance Table */}
            {TYPE_ORDER.map(type => {
                const group = accounts.filter(a => a.accountType === type);
                if (group.length === 0) return null;
                return (
                    <div key={type} className="border border-zinc-200 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50 border-b border-zinc-200">
                            <span className="font-mono text-xs font-bold uppercase text-zinc-600">{type} Accounts</span>
                            <span className="text-xs text-zinc-400">{TYPE_HINT[type]}</span>
                        </div>
                        <div className="overflow-x-auto">
                            <div className="min-w-[650px] divide-y divide-zinc-100">
                                {/* Column Headers */}
                                <div className="grid grid-cols-[80px_1fr_160px_160px] gap-4 px-4 py-2 bg-zinc-50/50">
                                    <span className="font-mono text-[9px] uppercase text-zinc-400">Code</span>
                                    <span className="font-mono text-[9px] uppercase text-zinc-400">Account</span>
                                    <span className="font-mono text-[9px] uppercase text-zinc-400 text-right">Debit (DR)</span>
                                    <span className="font-mono text-[9px] uppercase text-zinc-400 text-right">Credit (CR)</span>
                                </div>
                                {group.map(account => {
                                    const bal = balances[account.id];
                                    const defaultSide = TYPE_DEFAULT[type];
                                    return (
                                        <div key={account.id} className="grid grid-cols-[80px_1fr_160px_160px] gap-4 px-4 py-2.5 items-center hover:bg-zinc-50">
                                            <span className="font-mono text-xs text-zinc-400 font-bold">{account.code}</span>
                                            <span className="text-sm text-black">{account.name}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder={defaultSide === "debit" ? "e.g. 240000" : "—"}
                                                value={bal.debitAmount}
                                                onChange={e => { setField(account.id, "debitAmount", e.target.value); if (e.target.value) clearOpposite(account.id, "debitAmount"); }}
                                                className="border border-zinc-200 rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-black font-mono"
                                            />
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder={defaultSide === "credit" ? "e.g. 150000" : "—"}
                                                value={bal.creditAmount}
                                                onChange={e => { setField(account.id, "creditAmount", e.target.value); if (e.target.value) clearOpposite(account.id, "creditAmount"); }}
                                                className="border border-zinc-200 rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-black font-mono"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Totals & Submit */}
            <div className="border border-zinc-200 rounded-xl p-5 space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="font-mono text-[10px] uppercase text-zinc-400">Total Debits</p>
                        <p className="text-lg font-bold text-black mt-1 font-mono">{fmt(totalDebits)}</p>
                    </div>
                    <div>
                        <p className="font-mono text-[10px] uppercase text-zinc-400">Total Credits</p>
                        <p className="text-lg font-bold text-black mt-1 font-mono">{fmt(totalCredits)}</p>
                    </div>
                    <div>
                        <p className="font-mono text-[10px] uppercase text-zinc-400">Difference</p>
                        <p className={`text-lg font-bold mt-1 font-mono ${isBalanced ? "text-emerald-600" : "text-rose-600"}`}>
                            {isBalanced ? "✓ Balanced" : fmt(difference)}
                        </p>
                    </div>
                </div>

                {!isBalanced && hasAnyEntry && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        ⚠ Your debits and credits don't balance. You can still post — the difference will sit in the Opening Balances account (3200) and can be corrected later.
                    </p>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={isPending || !hasAnyEntry}
                    className="w-full bg-black text-white py-3 rounded-xl font-mono text-xs uppercase tracking-wider font-bold hover:bg-zinc-800 transition-colors disabled:opacity-40">
                    {isPending ? "Posting Entries..." : "Post Opening Balances"}
                </button>
            </div>
        </div>
    );
}
