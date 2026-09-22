"use client";

import { useState, useTransition } from "react";
import { postManualJournalEntry, postCompoundJournalEntry, CompoundJournalLine } from "@/lib/actions/gl";
import { Plus, Trash2, Sparkles, Scale } from "lucide-react";

interface Account { id: string; code: string; name: string; accountType: string; }
interface JournalEntry {
    id: string; entryDate: string; description: string;
    debitAccountCode: string; debitAccountName: string;
    creditAccountCode: string; creditAccountName: string;
    amount: string; sourceType: string; periodName: string | null;
    isBackdated: boolean; backdatedReason: string | null; createdByName: string | null;
    costCenterCode?: string | null; costCenterName?: string | null;
}

interface Props {
    shopId: string; shopSlug: string; glOnboardingMode: boolean;
    accounts: Account[]; entries: JournalEntry[];
    costCenters?: Array<{ id: string; code: string; name: string }>;
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

export default function GeneralLedgerClient({ shopId, shopSlug, glOnboardingMode, accounts, entries: initialEntries, costCenters = [] }: Props) {
    const [entries, setEntries] = useState<JournalEntry[]>(initialEntries);
    const [showForm, setShowForm] = useState(false);
    const [entryMode, setEntryMode] = useState<"COMPOUND" | "SIMPLE">("COMPOUND");
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [filterSource, setFilterSource] = useState<string>("ALL");
    const [searchTerm, setSearchTerm] = useState("");

    // Form state (Simple)
    const [form, setForm] = useState({
        entryDate: new Date().toISOString().split("T")[0],
        description: "",
        debitAccountId: "",
        creditAccountId: "",
        amount: "",
        backdatedReason: "",
    });

    // Form state (Compound Multi-Line)
    const [referenceNumber, setReferenceNumber] = useState("");
    const [selectedCostCenterId, setSelectedCostCenterId] = useState("");
    const [compoundRows, setCompoundRows] = useState<Array<{
        id: string;
        accountId: string;
        lineDescription: string;
        debit: string;
        credit: string;
    }>>([
        { id: "1", accountId: "", lineDescription: "", debit: "", credit: "" },
        { id: "2", accountId: "", lineDescription: "", debit: "", credit: "" },
    ]);

    const totalCompoundDebits = compoundRows.reduce((sum, r) => sum + (parseFloat(r.debit) || 0), 0);
    const totalCompoundCredits = compoundRows.reduce((sum, r) => sum + (parseFloat(r.credit) || 0), 0);
    const compoundImbalance = Math.round((totalCompoundDebits - totalCompoundCredits) * 100) / 100;
    const isCompoundBalanced = Math.abs(compoundImbalance) < 0.01 && totalCompoundDebits > 0;

    function handleAddRow() {
        setCompoundRows(prev => [
            ...prev,
            { id: Math.random().toString(), accountId: "", lineDescription: "", debit: "", credit: "" }
        ]);
    }

    function handleRemoveRow(id: string) {
        if (compoundRows.length <= 2) {
            showMsg("error", "A compound journal entry must contain at least two lines.");
            return;
        }
        setCompoundRows(prev => prev.filter(r => r.id !== id));
    }

    function handleRowChange(id: string, field: string, val: string) {
        setCompoundRows(prev => prev.map(r => {
            if (r.id !== id) return r;
            if (field === "debit" && val) {
                return { ...r, debit: val, credit: "" };
            }
            if (field === "credit" && val) {
                return { ...r, credit: val, debit: "" };
            }
            return { ...r, [field]: val };
        }));
    }

    function handleAutoBalance(id: string) {
        const diff = totalCompoundDebits - totalCompoundCredits;
        setCompoundRows(prev => prev.map(r => {
            if (r.id !== id) return r;
            if (diff > 0) {
                const currentCr = parseFloat(r.credit) || 0;
                return { ...r, credit: (currentCr + diff).toFixed(2), debit: "" };
            } else if (diff < 0) {
                const currentDr = parseFloat(r.debit) || 0;
                return { ...r, debit: (currentDr + Math.abs(diff)).toFixed(2), credit: "" };
            }
            return r;
        }));
    }

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

    function handlePostCompound() {
        if (!form.description.trim()) {
            showMsg("error", "Master narrative description is required.");
            return;
        }
        if (!isCompoundBalanced) {
            showMsg("error", `Journal is out of balance. Imbalance: KES ${Math.abs(compoundImbalance).toFixed(2)}`);
            return;
        }
        const valid = compoundRows.filter(r => r.accountId && ((parseFloat(r.debit) || 0) > 0 || (parseFloat(r.credit) || 0) > 0));
        if (valid.length < 2) {
            showMsg("error", "Please select accounts and amounts for at least two rows.");
            return;
        }

        startTransition(async () => {
            const res = await postCompoundJournalEntry(shopId, shopSlug, {
                entryDate: new Date(form.entryDate + "T00:00:00"),
                referenceNumber: referenceNumber || undefined,
                description: form.description,
                costCenterId: selectedCostCenterId || undefined,
                lines: valid.map(r => ({
                    accountId: r.accountId,
                    debitAmount: parseFloat(r.debit) || 0,
                    creditAmount: parseFloat(r.credit) || 0,
                    lineDescription: r.lineDescription || undefined,
                    costCenterId: selectedCostCenterId || undefined,
                })),
                backdatedReason: form.backdatedReason || undefined,
            });
            if (res.success) {
                showMsg("success", "Compound journal entry posted successfully.");
                setForm(p => ({ ...p, description: "", amount: "", backdatedReason: "" }));
                setReferenceNumber("");
                setCompoundRows([
                    { id: "1", accountId: "", lineDescription: "", debit: "", credit: "" },
                    { id: "2", accountId: "", lineDescription: "", debit: "", credit: "" },
                ]);
                setShowForm(false);
                window.location.reload();
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
                        {showForm ? "Close Form" : "+ New Journal Entry"}
                    </button>
                </div>
            </div>

            {/* Manual & Compound Entry Form */}
            {showForm && (
                <div className="border border-zinc-300 rounded-xl p-5 space-y-5 bg-zinc-50 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
                        <div className="space-y-1">
                            <h3 className="font-mono text-sm uppercase font-bold text-zinc-800 flex items-center gap-2">
                                <Scale className="w-4 h-4 text-[#064e3b]" />
                                <span>{entryMode === "COMPOUND" ? "Compound Multi-Line Journal Entry" : "Simple 2-Legged Journal Entry"}</span>
                            </h3>
                            <p className="text-[11px] text-zinc-500 font-sans">
                                {entryMode === "COMPOUND"
                                    ? "Post arbitrary N-line debit and credit entries. Total debits must equal total credits."
                                    : "Quickly post a 1-to-1 transfer between a single debit account and credit account."}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 font-mono text-xs">
                                <button
                                    type="button"
                                    onClick={() => setEntryMode("COMPOUND")}
                                    className={`px-3 py-1.5 rounded-md font-bold transition-all ${entryMode === "COMPOUND" ? "bg-black text-white" : "text-zinc-500 hover:text-black"}`}
                                >
                                    Multi-Line (Grid)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEntryMode("SIMPLE")}
                                    className={`px-3 py-1.5 rounded-md font-bold transition-all ${entryMode === "SIMPLE" ? "bg-black text-white" : "text-zinc-500 hover:text-black"}`}
                                >
                                    Simple (2-Legs)
                                </button>
                            </div>
                            {glOnboardingMode && (
                                <span className="font-mono text-[9px] uppercase bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">Onboarding Mode</span>
                            )}
                        </div>
                    </div>

                    {/* Header Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                            <label className="font-mono text-[10px] uppercase text-zinc-500 block mb-1 font-semibold">Posting Date *</label>
                            <input type="date" value={form.entryDate} onChange={e => setForm(p => ({ ...p, entryDate: e.target.value }))}
                                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black bg-white" />
                        </div>
                        <div>
                            <label className="font-mono text-[10px] uppercase text-zinc-500 block mb-1 font-semibold">Reference Code</label>
                            <input type="text" value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)}
                                placeholder="e.g. JRN-2026-001"
                                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black bg-white font-mono uppercase" />
                        </div>
                        <div>
                            <label className="font-mono text-[10px] uppercase text-zinc-500 block mb-1 font-semibold">Master Description *</label>
                            <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                placeholder="e.g. Monthly Payroll Accrual"
                                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black bg-white" />
                        </div>
                        <div>
                            <label className="font-mono text-[10px] uppercase text-zinc-500 block mb-1 font-semibold">Cost Center (Optional)</label>
                            <select
                                value={selectedCostCenterId}
                                onChange={e => setSelectedCostCenterId(e.target.value)}
                                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black bg-white"
                            >
                                <option value="">None (General Overhead)</option>
                                {costCenters.map(cc => (
                                    <option key={cc.id} value={cc.id}>{cc.code} — {cc.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* COMPOUND MULTI-LINE GRID */}
                    {entryMode === "COMPOUND" ? (
                        <div className="space-y-4">
                            <div className="overflow-x-auto border border-zinc-200 rounded-xl bg-white">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-zinc-50 border-b border-zinc-200 font-mono text-[10px] uppercase text-zinc-500 font-bold">
                                        <tr>
                                            <th className="py-2.5 px-3 w-10">#</th>
                                            <th className="py-2.5 px-3 min-w-[220px]">Account Code &amp; Name *</th>
                                            <th className="py-2.5 px-3 min-w-[180px]">Line Description</th>
                                            <th className="py-2.5 px-3 w-36 text-right">Debit (KES)</th>
                                            <th className="py-2.5 px-3 w-36 text-right">Credit (KES)</th>
                                            <th className="py-2.5 px-3 w-28 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {compoundRows.map((row, idx) => (
                                            <tr key={row.id} className="hover:bg-zinc-50/50 transition-colors">
                                                <td className="py-2 px-3 font-mono text-zinc-400 font-bold text-[10px]">{idx + 1}</td>
                                                <td className="py-2 px-3">
                                                    <select
                                                        value={row.accountId}
                                                        onChange={e => handleRowChange(row.id, "accountId", e.target.value)}
                                                        className="w-full border border-zinc-200 rounded-md px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-black"
                                                    >
                                                        <option value="">Select account...</option>
                                                        {accounts.map(a => (
                                                            <option key={a.id} value={a.id}>{a.code} — {a.name} ({a.accountType})</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="py-2 px-3">
                                                    <input
                                                        type="text"
                                                        value={row.lineDescription}
                                                        onChange={e => handleRowChange(row.id, "lineDescription", e.target.value)}
                                                        placeholder="Line particulars..."
                                                        className="w-full border border-zinc-200 rounded-md px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-black"
                                                    />
                                                </td>
                                                <td className="py-2 px-3">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={row.debit}
                                                        onChange={e => handleRowChange(row.id, "debit", e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-full border border-zinc-200 rounded-md px-2.5 py-1.5 text-xs bg-white text-right font-mono focus:outline-none focus:ring-1 focus:ring-black"
                                                    />
                                                </td>
                                                <td className="py-2 px-3">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={row.credit}
                                                        onChange={e => handleRowChange(row.id, "credit", e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-full border border-zinc-200 rounded-md px-2.5 py-1.5 text-xs bg-white text-right font-mono focus:outline-none focus:ring-1 focus:ring-black"
                                                    />
                                                </td>
                                                <td className="py-2 px-3 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAutoBalance(row.id)}
                                                            title="Auto-balance this line with residual amount"
                                                            className="p-1 text-zinc-400 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                                                        >
                                                            <Sparkles className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveRow(row.id)}
                                                            disabled={compoundRows.length <= 2}
                                                            title="Remove line"
                                                            className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded disabled:opacity-30"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-zinc-50 border-t border-zinc-200 font-mono text-xs font-bold">
                                        <tr>
                                            <td colSpan={3} className="py-3 px-4">
                                                <button
                                                    type="button"
                                                    onClick={handleAddRow}
                                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-black bg-white border border-zinc-300 hover:border-black px-3 py-1.5 rounded-lg shadow-2xs transition-colors"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    <span>+ Add Line</span>
                                                </button>
                                            </td>
                                            <td className="py-3 px-3 text-right text-emerald-800">
                                                {fmt(totalCompoundDebits)}
                                            </td>
                                            <td className="py-3 px-3 text-right text-purple-800">
                                                {fmt(totalCompoundCredits)}
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                {isCompoundBalanced ? (
                                                    <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-bold">
                                                        ✓ Balanced
                                                    </span>
                                                ) : (
                                                    <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] rounded-full font-bold">
                                                        Δ {Math.abs(compoundImbalance).toFixed(2)}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Backdated Justification (if applicable) */}
                            {new Date(form.entryDate) < new Date(new Date().setHours(0,0,0,0)) && (
                                <div>
                                    <label className="font-mono text-[10px] uppercase text-zinc-500 block mb-1 font-semibold">Audit Justification for Prior Date Posting</label>
                                    <input type="text" value={form.backdatedReason} onChange={e => setForm(p => ({ ...p, backdatedReason: e.target.value }))}
                                        placeholder="e.g. Month-end payroll allocation recorded retroactively for audit completeness"
                                        className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black bg-white" />
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-2">
                                <div className="text-[11px] text-zinc-500 font-mono">
                                    Total Posting: <strong className="text-black">{fmt(totalCompoundDebits)}</strong> across {compoundRows.length} lines
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setShowForm(false)} className="text-xs text-zinc-500 hover:text-black px-4 py-2 font-mono">Cancel</button>
                                    <button
                                        onClick={handlePostCompound}
                                        disabled={isPending || !isCompoundBalanced}
                                        className="bg-black text-white px-6 py-2.5 rounded-lg font-mono text-xs uppercase font-bold hover:bg-zinc-800 transition-colors disabled:opacity-40 flex items-center gap-1.5 shadow-sm"
                                    >
                                        {isPending ? "Posting Compound Entry..." : "Post Compound Entry"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* SIMPLE 2-LEGGED ENTRY FORM */
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="font-mono text-[10px] uppercase text-zinc-500 block mb-1 font-semibold">Amount (KES) *</label>
                                    <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                                        placeholder="e.g. 15000.00"
                                        className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black bg-white font-mono" />
                                </div>
                                <div>
                                    <label className="font-mono text-[10px] uppercase text-zinc-500 block mb-1 font-semibold">Debit Account (DR) — Destination Account *</label>
                                    <select value={form.debitAccountId} onChange={e => setForm(p => ({ ...p, debitAccountId: e.target.value }))}
                                        className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black bg-white">
                                        <option value="">Select debit account...</option>
                                        {accounts.map(a => (
                                            <option key={a.id} value={a.id}>{a.code} — {a.name} ({a.accountType})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="font-mono text-[10px] uppercase text-zinc-500 block mb-1 font-semibold">Credit Account (CR) — Source Account *</label>
                                    <select value={form.creditAccountId} onChange={e => setForm(p => ({ ...p, creditAccountId: e.target.value }))}
                                        className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black bg-white">
                                        <option value="">Select credit account...</option>
                                        {accounts.map(a => (
                                            <option key={a.id} value={a.id}>{a.code} — {a.name} ({a.accountType})</option>
                                        ))}
                                    </select>
                                </div>
                                {new Date(form.entryDate) < new Date(new Date().setHours(0,0,0,0)) && (
                                    <div>
                                        <label className="font-mono text-[10px] uppercase text-zinc-500 block mb-1 font-semibold">Backdating Reason</label>
                                        <input type="text" value={form.backdatedReason} onChange={e => setForm(p => ({ ...p, backdatedReason: e.target.value }))}
                                            placeholder="Reason for backdated posting..."
                                            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black bg-white" />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 justify-end pt-2">
                                <button onClick={() => setShowForm(false)} className="text-xs text-zinc-500 hover:text-black px-4 py-2 font-mono">Cancel</button>
                                <button onClick={handlePost} disabled={isPending}
                                    className="bg-black text-white px-6 py-2.5 rounded-lg font-mono text-xs uppercase font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50">
                                    {isPending ? "Posting..." : "Post Simple Entry"}
                                </button>
                            </div>
                        </div>
                    )}
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
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        {entry.periodName && <p className="font-mono text-[9px] text-zinc-400">{entry.periodName}</p>}
                                        {entry.costCenterCode && (
                                            <span className="font-mono text-[9px] text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">
                                                CC: {entry.costCenterCode}
                                            </span>
                                        )}
                                    </div>
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
