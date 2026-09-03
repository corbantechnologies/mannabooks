"use client";

import { useState, useTransition } from "react";
import { postManualJournalEntry } from "@/lib/actions/gl";

interface Account { id: string; code: string; name: string; accountType: string; }
interface JournalEntry {
    id: string; entryDate: string; description: string;
    debitAccountCode: string; debitAccountName: string;
    creditAccountCode: string; creditAccountName: string;
    amount: string; sourceType: string; periodName: string | null;
    isBackdated: boolean; backdatedReason: string | null; createdByName: string | null;
}

interface Props {
    shopId: string; shopSlug: string; glOnboardingMode: boolean;
    accounts: Account[]; entries: JournalEntry[];
}

const SOURCE_LABELS: Record<string, string> = {
    document: "Document", expense: "Expense", income: "Income",
    payroll: "Payroll", manual: "Manual", migrated: "Migration",
};
const SOURCE_COLORS: Record<string, string> = {
    document: "bg-blue-50 text-blue-700 border-blue-200",
    expense: "bg-amber-50 text-amber-700 border-amber-200",
    income: "bg-emerald-50 text-emerald-700 border-emerald-200",
    payroll: "bg-purple-50 text-purple-700 border-purple-200",
    manual: "bg-zinc-100 text-zinc-600 border-zinc-200",
    migrated: "bg-slate-50 text-slate-600 border-slate-200",
};

function fmt(n: string | number) {
    const v = typeof n === "string" ? parseFloat(n) : n;
    return `KES ${v.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function GeneralLedgerClient({ shopId, shopSlug, glOnboardingMode, accounts, entries: initialEntries }: Props) {
    const [entries, setEntries] = useState<JournalEntry[]>(initialEntries);
    const [showForm, setShowForm] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [filterSource, setFilterSource] = useState<string>("ALL");
    const [searchTerm, setSearchTerm] = useState("");

    // Form state
    const [form, setForm] = useState({
        entryDate: new Date().toISOString().split("T")[0],
        description: "",
        debitAccountId: "",
        creditAccountId: "",
        amount: "",
        backdatedReason: "",
    });

    function showMsg(type: "success" | "error", text: string) {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    }

    function handlePost() {
        if (!form.description || !form.debitAccountId || !form.creditAccountId || !form.amount) {
            showMsg("error", "All fields are required."); return;
        }
        const amount = parseFloat(form.amount);
        if (isNaN(amount) || amount <= 0) { showMsg("error", "Enter a valid positive amount."); return; }

        startTransition(async () => {
            const res = await postManualJournalEntry(shopId, shopSlug, {
                entryDate: new Date(form.entryDate + "T00:00:00"),
                description: form.description,
                debitAccountId: form.debitAccountId,
                creditAccountId: form.creditAccountId,
                amount,
                backdatedReason: form.backdatedReason || undefined,
            });
            if (res.success) {
                showMsg("success", "Journal entry posted.");
                // Add to local list optimistically
                const debit = accounts.find(a => a.id === form.debitAccountId)!;
                const credit = accounts.find(a => a.id === form.creditAccountId)!;
                const newEntry: JournalEntry = {
                    id: crypto.randomUUID(),
                    entryDate: new Date(form.entryDate).toISOString(),
                    description: form.description,
                    debitAccountCode: debit.code, debitAccountName: debit.name,
                    creditAccountCode: credit.code, creditAccountName: credit.name,
                    amount: amount.toFixed(2),
                    sourceType: "manual", periodName: null,
                    isBackdated: new Date(form.entryDate) < new Date(),
                    backdatedReason: form.backdatedReason || null,
                    createdByName: "You",
                };
                setEntries(prev => [newEntry, ...prev]);
                setForm({ entryDate: new Date().toISOString().split("T")[0], description: "", debitAccountId: "", creditAccountId: "", amount: "", backdatedReason: "" });
                setShowForm(false);
            } else {
                showMsg("error", res.error);
            }
        });
    }

    // Filtering
    const filtered = entries.filter(e => {
        if (filterSource !== "ALL" && e.sourceType !== filterSource) return false;
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            return e.description.toLowerCase().includes(s) || e.debitAccountName.toLowerCase().includes(s) || e.creditAccountName.toLowerCase().includes(s);
        }
        return true;
    });

    const totalAmount = filtered.reduce((s, e) => s + parseFloat(e.amount || "0"), 0);

    function handleCsvExport() {
        const rows = [
            ["GENERAL LEDGER JOURNAL ENTRIES"],
            ["Shop:", shopSlug],
            ["Export Date:", new Date().toLocaleDateString("en-KE", { dateStyle: "long" })],
            [],
            ["Date", "Description", "Debit Account Code", "Debit Account Name", "Credit Account Code", "Credit Account Name", "Amount (KES)", "Source Type", "Backdated?", "Created By"],
            ...filtered.map(e => [
                new Date(e.entryDate).toLocaleDateString("en-KE", { dateStyle: "medium" }),
                `"${e.description.replace(/"/g, '""')}"`,
                e.debitAccountCode,
                `"${e.debitAccountName}"`,
                e.creditAccountCode,
                `"${e.creditAccountName}"`,
                e.amount,
                e.sourceType,
                e.isBackdated ? "YES" : "NO",
                `"${e.createdByName || "System"}"`,
            ]),
            [],
            ["TOTAL VALUATION", "", "", "", "", "", totalAmount.toFixed(2), "", "", ""],
        ];
        const csv = rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `GeneralLedger_${shopSlug}_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
    }

    return (
        <div className="space-y-5">
            {message && (
                <div className={`px-4 py-3 rounded-lg text-sm font-medium border ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
                    {message.text}
                </div>
            )}

            {/* Controls */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex flex-wrap gap-2">
                    {["ALL", "document", "expense", "income", "payroll", "manual", "migrated"].map(s => (
                        <button key={s} onClick={() => setFilterSource(s)}
                            className={`px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase font-bold border transition-colors ${filterSource === s ? "badge-emerald" : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400"}`}>
                            {s === "ALL" ? "All" : SOURCE_LABELS[s]}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search entries..."
                        className="border border-zinc-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-black w-48" />
                    <button onClick={handleCsvExport}
                        className="px-3.5 py-2 rounded-lg font-mono text-xs uppercase font-bold border border-zinc-200 bg-white hover:border-zinc-400 transition-colors">
                        Export CSV
                    </button>
                    <button onClick={() => setShowForm(v => !v)}
                        className="bg-black text-white px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold hover:bg-zinc-800 transition-colors">
                        + Manual Entry
                    </button>
                </div>
            </div>

            {/* Manual Entry Form */}
            {showForm && (
                <div className="border border-zinc-300 rounded-xl p-5 space-y-4 bg-zinc-50">
                    <div className="flex items-center justify-between">
                        <h3 className="font-mono text-xs uppercase font-bold text-zinc-700">Post Manual Journal Entry</h3>
                        {glOnboardingMode && (
                            <span className="font-mono text-[9px] uppercase bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">Onboarding Mode — Backdating Allowed</span>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="font-mono text-[10px] uppercase text-zinc-400 block mb-1">Date</label>
                            <input type="date" value={form.entryDate} onChange={e => setForm(p => ({ ...p, entryDate: e.target.value }))}
                                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white" />
                        </div>
                        <div>
                            <label className="font-mono text-[10px] uppercase text-zinc-400 block mb-1">Amount (KES)</label>
                            <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                                placeholder="e.g. 3200"
                                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white font-mono" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="font-mono text-[10px] uppercase text-zinc-400 block mb-1">Description</label>
                            <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                placeholder="e.g. Railway subscription — November 2025"
                                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white" />
                        </div>
                        <div>
                            <label className="font-mono text-[10px] uppercase text-zinc-400 block mb-1">Debit Account (DR) — money flows to</label>
                            <select value={form.debitAccountId} onChange={e => setForm(p => ({ ...p, debitAccountId: e.target.value }))}
                                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white">
                                <option value="">Select debit account...</option>
                                {accounts.map(a => (
                                    <option key={a.id} value={a.id}>{a.code} — {a.name} ({a.accountType})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="font-mono text-[10px] uppercase text-zinc-400 block mb-1">Credit Account (CR) — money flows from</label>
                            <select value={form.creditAccountId} onChange={e => setForm(p => ({ ...p, creditAccountId: e.target.value }))}
                                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white">
                                <option value="">Select credit account...</option>
                                {accounts.map(a => (
                                    <option key={a.id} value={a.id}>{a.code} — {a.name} ({a.accountType})</option>
                                ))}
                            </select>
                        </div>
                        {new Date(form.entryDate) < new Date(new Date().setHours(0,0,0,0)) && (
                            <div className="sm:col-span-2">
                                <label className="font-mono text-[10px] uppercase text-zinc-400 block mb-1">Backdating Reason</label>
                                <input type="text" value={form.backdatedReason} onChange={e => setForm(p => ({ ...p, backdatedReason: e.target.value }))}
                                    placeholder="e.g. Railway subscription paid October 2025 — recording for completeness"
                                    className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white" />
                            </div>
                        )}
                    </div>

                    {/* Example hint */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
                        <strong>Example — Google Cloud Nov 2025:</strong> Date: 01/11/2025 · Amount: KES 4,800 · Description: "Google Cloud subscription — November 2025" · DR: 6600 Office Supplies · CR: 1200 Cash & Bank
                    </div>

                    <div className="flex gap-2">
                        <button onClick={handlePost} disabled={isPending}
                            className="bg-black text-white px-6 py-2.5 rounded-lg font-mono text-xs uppercase font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50">
                            {isPending ? "Posting..." : "Post Entry"}
                        </button>
                        <button onClick={() => setShowForm(false)} className="text-sm text-zinc-400 hover:text-black px-4">Cancel</button>
                    </div>
                </div>
            )}

            {/* Summary Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm">
                <span className="text-zinc-500">{filtered.length} entries</span>
                <span className="font-mono text-sm font-bold text-black">{fmt(totalAmount)} total</span>
            </div>

            {/* Ledger Table */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 text-zinc-400">
                    <p className="font-mono text-sm">No journal entries yet.</p>
                    <p className="text-sm mt-1">Activate GL and run the migration, or post manual entries above.</p>
                </div>
            ) : (
                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-[110px_1fr_200px_120px_80px] gap-3 px-4 py-2.5 bg-zinc-50 border-b border-zinc-100">
                        <span className="font-mono text-[9px] uppercase text-zinc-400 font-semibold">Date</span>
                        <span className="font-mono text-[9px] uppercase text-zinc-400 font-semibold">Description</span>
                        <span className="font-mono text-[9px] uppercase text-zinc-400 font-semibold">DR / CR Accounts</span>
                        <span className="font-mono text-[9px] uppercase text-zinc-400 font-semibold text-right">Amount</span>
                        <span className="font-mono text-[9px] uppercase text-zinc-400 font-semibold">Source</span>
                    </div>
                    <div className="divide-y divide-zinc-100 max-h-[600px] overflow-y-auto">
                        {filtered.map(entry => (
                            <div key={entry.id} className="grid grid-cols-[110px_1fr_200px_120px_80px] gap-3 px-4 py-3 items-start hover:bg-zinc-50 transition-colors">
                                <div>
                                    <span className="font-mono text-xs text-zinc-500">
                                        {new Date(entry.entryDate).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })}
                                    </span>
                                    {entry.isBackdated && (
                                        <span className="block font-mono text-[9px] text-amber-600 mt-0.5">Backdated</span>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm text-black truncate">{entry.description}</p>
                                    {entry.periodName && <p className="font-mono text-[9px] text-zinc-400 mt-0.5">{entry.periodName}</p>}
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-xs"><span className="font-mono text-emerald-600 font-bold">DR</span> <span className="text-zinc-600">{entry.debitAccountCode} {entry.debitAccountName}</span></p>
                                    <p className="text-xs"><span className="font-mono text-rose-600 font-bold">CR</span> <span className="text-zinc-600">{entry.creditAccountCode} {entry.creditAccountName}</span></p>
                                </div>
                                <span className="font-mono text-sm font-bold text-black text-right">{fmt(entry.amount)}</span>
                                <span className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded border font-bold inline-block ${SOURCE_COLORS[entry.sourceType] || SOURCE_COLORS.manual}`}>
                                    {SOURCE_LABELS[entry.sourceType] || entry.sourceType}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
