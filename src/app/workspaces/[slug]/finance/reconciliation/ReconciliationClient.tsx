"use client";

import { useState, useRef, ChangeEvent } from "react";
import { type BankReconciliationPayload, type CashGlEntry } from "@/lib/actions/reconciliation";

interface StatementRow {
    id: string;
    date: string;
    reference: string;
    details: string;
    amount: number;
    direction: "DEBIT" | "CREDIT"; // DEBIT = Outflow (Bank side withdrawal), CREDIT = Inflow (Bank side deposit)
    matchedGlId: string | null;
}

interface Props {
    shopId: string;
    shopSlug: string;
    isGlEnabled: boolean;
    currency: string;
    initialData: BankReconciliationPayload | null;
}

function fmt(n: number, currency: string) {
    return `${currency} ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ReconciliationClient({
    isGlEnabled,
    currency,
    initialData,
}: Props) {
    const [glEntries, setGlEntries] = useState<CashGlEntry[]>(initialData?.glEntries || []);
    const [statementRows, setStatementRows] = useState<StatementRow[]>([]);
    const [statementClosingBalance, setStatementClosingBalance] = useState<number>(0);
    const [hasUploaded, setHasUploaded] = useState<boolean>(false);
    const [filterState, setFilterState] = useState<"ALL" | "MATCHED" | "UNMATCHED">("ALL");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const bookBalance = initialData?.bookBalance || 0;

    // Parse CSV file content
    function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target?.result as string;
            parseCsv(text);
        };
        reader.readAsText(file);
    }

    function parseCsv(text: string) {
        const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
        if (lines.length <= 1) return;

        const parsed: StatementRow[] = [];
        let runningStatementBal = 0;

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(",").map((c) => c.replace(/^["']|["']$/g, "").trim());
            if (cols.length < 3) continue;

            const dateStr = cols[0] || new Date().toISOString().split("T")[0];
            const ref = cols[1] || `TXN-${i}`;
            const details = cols[2] || "Bank transaction";
            
            // Format can be: Date, Ref, Details, Debit, Credit, Balance OR Date, Details, Amount, Type
            let debit = 0;
            let credit = 0;

            if (cols.length >= 5) {
                debit = parseFloat(cols[3] || "0") || 0;
                credit = parseFloat(cols[4] || "0") || 0;
            } else {
                const amt = parseFloat(cols[3] || "0") || 0;
                if (amt < 0) debit = Math.abs(amt);
                else credit = amt;
            }

            const isCredit = credit > 0;
            const amount = isCredit ? credit : debit;
            const direction = isCredit ? "CREDIT" : "DEBIT";

            if (cols[5]) {
                const bal = parseFloat(cols[5]);
                if (!isNaN(bal)) runningStatementBal = bal;
            } else {
                if (isCredit) runningStatementBal += amount;
                else runningStatementBal -= amount;
            }

            parsed.push({
                id: `stmt-${i}-${Date.now()}`,
                date: dateStr,
                reference: ref,
                details,
                amount,
                direction,
                matchedGlId: null,
            });
        }

        // Run auto-match logic against existing GL entries
        const matched = autoMatch(parsed, glEntries);
        setStatementRows(matched);
        setStatementClosingBalance(runningStatementBal);
        setHasUploaded(true);
    }

    function loadSampleStatement() {
        const sampleCsv = `Date,Reference,Details,Debit,Credit,Balance
2026-08-25,MPESA-QH82910,Customer Invoice Payment Settlement,0,15000,115000
2026-08-26,NCBA-WTH-041,Office Rent Disbursement,45000,0,70000
2026-08-27,MPESA-TK99120,Walk-in POS Store Sale,0,6500,76500
2026-08-28,CHQ-882190,Electricity & Internet Utilities,12000,0,64500
2026-08-29,BNK-FEE-88,Bank Monthly Maintenance Fee,750,0,63750`;
        parseCsv(sampleCsv);
    }

    function autoMatch(statements: StatementRow[], books: CashGlEntry[]): StatementRow[] {
        const usedGlIds = new Set<string>();

        return statements.map((row) => {
            // Find best matching GL entry (same amount + matching direction + not already used)
            const match = books.find((gl) => {
                if (usedGlIds.has(gl.id)) return false;
                const amtMatch = Math.abs(gl.amount - row.amount) < 0.01;
                // GL DEBIT is Cash IN (matches Statement CREDIT/Deposit)
                // GL CREDIT is Cash OUT (matches Statement DEBIT/Withdrawal)
                const dirMatch =
                    (row.direction === "CREDIT" && gl.direction === "DEBIT") ||
                    (row.direction === "DEBIT" && gl.direction === "CREDIT");
                return amtMatch && dirMatch;
            });

            if (match) {
                usedGlIds.add(match.id);
                return { ...row, matchedGlId: match.id };
            }
            return row;
        });
    }

    function toggleMatch(statementId: string, glId: string) {
        setStatementRows((prev) =>
            prev.map((row) => {
                if (row.id === statementId) {
                    return {
                        ...row,
                        matchedGlId: row.matchedGlId === glId ? null : glId,
                    };
                }
                return row;
            })
        );
    }

    const matchedCount = statementRows.filter((r) => r.matchedGlId !== null).length;
    const unmatchedCount = statementRows.length - matchedCount;
    const matchedGlIds = new Set(statementRows.map((r) => r.matchedGlId).filter(Boolean));

    const totalReconciledAmount = statementRows
        .filter((r) => r.matchedGlId !== null)
        .reduce((sum, r) => sum + (r.direction === "CREDIT" ? r.amount : -r.amount), 0);

    const variance = hasUploaded
        ? Math.abs(statementClosingBalance - bookBalance)
        : 0;

    const filteredStatements = statementRows.filter((r) => {
        if (filterState === "MATCHED") return r.matchedGlId !== null;
        if (filterState === "UNMATCHED") return r.matchedGlId === null;
        return true;
    });

    function exportReconciliationReport() {
        const rows = [
            ["BANK & M-PESA RECONCILIATION REPORT"],
            ["Reconciliation Date:", new Date().toLocaleDateString("en-KE", { dateStyle: "long" })],
            ["GL Books Balance (1200):", bookBalance],
            ["Statement Closing Balance:", statementClosingBalance],
            ["Unreconciled Variance:", variance],
            [],
            ["STATEMENT TRANSACTIONS"],
            ["Date", "Reference", "Details", "Direction", "Amount", "Reconciliation Status", "Matched GL Entry ID"],
            ...statementRows.map((r) => [
                r.date,
                r.reference,
                `"${r.details.replace(/"/g, '""')}"`,
                r.direction,
                r.amount,
                r.matchedGlId ? "RECONCILED" : "UNMATCHED",
                r.matchedGlId || "N/A",
            ]),
        ];
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `BankReconciliation_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
    }

    if (!isGlEnabled) {
        return (
            <div className="card-modern p-12 text-center text-zinc-400 font-mono text-sm space-y-2">
                <p className="font-bold text-black uppercase">General Ledger Not Enabled</p>
                <p className="text-zinc-500">
                    Enable the Chart of Accounts in Workspace Settings / Finance to access double-entry bank reconciliation.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* TOP METRIC SCORECARD */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card-modern p-5 bg-white border border-zinc-200/80 rounded-xl space-y-1">
                    <span className="font-mono text-[10px] uppercase font-bold text-zinc-400">
                        GL Internal Books (1200)
                    </span>
                    <p className="text-2xl font-bold font-mono tracking-tight text-black">
                        {fmt(bookBalance, currency)}
                    </p>
                    <p className="text-[11px] text-zinc-500">Net balance from all posted journals</p>
                </div>

                <div className="card-modern p-5 bg-white border border-zinc-200/80 rounded-xl space-y-1">
                    <span className="font-mono text-[10px] uppercase font-bold text-zinc-400">
                        Bank / M-Pesa Statement
                    </span>
                    <p className="text-2xl font-bold font-mono tracking-tight text-blue-700">
                        {hasUploaded ? fmt(statementClosingBalance, currency) : "Upload Statement"}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                        {hasUploaded ? `${statementRows.length} statement rows loaded` : "No statement uploaded yet"}
                    </p>
                </div>

                <div className="card-modern p-5 bg-white border border-zinc-200/80 rounded-xl space-y-1">
                    <span className="font-mono text-[10px] uppercase font-bold text-zinc-400">
                        Reconciliation Status
                    </span>
                    <p className={`text-2xl font-bold font-mono tracking-tight ${
                        hasUploaded && variance === 0 ? "text-emerald-600" : "text-amber-600"
                    }`}>
                        {hasUploaded ? (variance === 0 ? "Fully Reconciled" : `Variance: ${fmt(variance, currency)}`) : "Ready to Reconcile"}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                        {hasUploaded ? `${matchedCount} matched, ${unmatchedCount} pending` : "Import bank statement CSV"}
                    </p>
                </div>
            </div>

            {/* UPLOAD & CONTROLS TOOLBAR */}
            <div className="card-modern p-5 bg-zinc-50/70 border border-zinc-200/80 rounded-xl flex flex-wrap justify-between items-center gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <input
                        type="file"
                        accept=".csv,.txt"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-primary-modern px-4 py-2 text-xs uppercase font-semibold flex items-center gap-2"
                    >
                        <span>📁</span>
                        <span>Upload Bank / M-Pesa CSV</span>
                    </button>
                    <button
                        onClick={loadSampleStatement}
                        className="border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 px-3 py-2 rounded text-xs font-mono font-semibold uppercase"
                    >
                        ⚡ Load Sample Statement
                    </button>
                </div>

                {hasUploaded && (
                    <div className="flex items-center gap-2">
                        <div className="flex border border-zinc-300 rounded overflow-hidden font-mono text-[11px] font-semibold">
                            <button
                                onClick={() => setFilterState("ALL")}
                                className={`px-3 py-1.5 ${filterState === "ALL" ? "bg-black text-white" : "bg-white text-zinc-600"}`}
                            >
                                All ({statementRows.length})
                            </button>
                            <button
                                onClick={() => setFilterState("MATCHED")}
                                className={`px-3 py-1.5 border-l border-zinc-300 ${filterState === "MATCHED" ? "bg-black text-white" : "bg-white text-zinc-600"}`}
                            >
                                Matched ({matchedCount})
                            </button>
                            <button
                                onClick={() => setFilterState("UNMATCHED")}
                                className={`px-3 py-1.5 border-l border-zinc-300 ${filterState === "UNMATCHED" ? "bg-black text-white" : "bg-white text-zinc-600"}`}
                            >
                                Unmatched ({unmatchedCount})
                            </button>
                        </div>
                        <button
                            onClick={exportReconciliationReport}
                            className="border border-zinc-200 bg-white hover:border-zinc-400 px-3 py-1.5 rounded font-mono text-xs uppercase font-bold"
                        >
                            Export CSV
                        </button>
                    </div>
                )}
            </div>

            {/* SIDE-BY-SIDE RECONCILIATION CANVAS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT: EXTERNAL STATEMENT LINES */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold uppercase tracking-tight text-sm font-sans text-black">
                            External Statement Lines
                        </h3>
                        <span className="font-mono text-[11px] text-zinc-400">
                            {statementRows.length} transactions
                        </span>
                    </div>

                    <div className="card-modern overflow-x-auto border border-zinc-200 rounded-xl bg-white">
                        <table className="w-full text-left font-mono text-xs border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-100 uppercase font-semibold text-zinc-600">
                                    <th className="p-3 border-r border-zinc-200">Date</th>
                                    <th className="p-3 border-r border-zinc-200">Ref / Details</th>
                                    <th className="p-3 border-r border-zinc-200 text-right">Amount</th>
                                    <th className="p-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200">
                                {filteredStatements.map((row) => (
                                    <tr key={row.id} className={`hover:bg-zinc-50/80 ${
                                        row.matchedGlId ? "bg-emerald-50/30" : ""
                                    }`}>
                                        <td className="p-3 border-r border-zinc-200 text-zinc-500 whitespace-nowrap">
                                            {row.date}
                                        </td>
                                        <td className="p-3 border-r border-zinc-200">
                                            <div className="font-semibold text-black">{row.reference}</div>
                                            <div className="text-[10px] text-zinc-500 truncate max-w-[180px] font-sans">
                                                {row.details}
                                            </div>
                                        </td>
                                        <td className="p-3 border-r border-zinc-200 text-right">
                                            <span className={`font-bold ${
                                                row.direction === "CREDIT" ? "text-emerald-700" : "text-rose-600"
                                            }`}>
                                                {row.direction === "CREDIT" ? "+" : "-"} {fmt(row.amount, currency)}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            {row.matchedGlId ? (
                                                <span className="border border-emerald-300 bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                                                    ✓ Matched
                                                </span>
                                            ) : (
                                                <span className="border border-amber-300 bg-amber-50 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}

                                {statementRows.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center text-zinc-400 italic">
                                            Upload a CSV or click &quot;Load Sample Statement&quot; to inspect bank transactions.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* RIGHT: INTERNAL GL JOURNAL ENTRIES (ACCOUNT 1200) */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold uppercase tracking-tight text-sm font-sans text-black">
                            Internal Books (Cash &amp; Bank Ledger)
                        </h3>
                        <span className="font-mono text-[11px] text-zinc-400">
                            {glEntries.length} entries
                        </span>
                    </div>

                    <div className="card-modern overflow-x-auto border border-zinc-200 rounded-xl bg-white">
                        <table className="w-full text-left font-mono text-xs border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-100 uppercase font-semibold text-zinc-600">
                                    <th className="p-3 border-r border-zinc-200">Date</th>
                                    <th className="p-3 border-r border-zinc-200">GL Description</th>
                                    <th className="p-3 border-r border-zinc-200 text-right">Amount</th>
                                    <th className="p-3 text-center">Ledger State</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200">
                                {glEntries.map((gl) => {
                                    const isMatched = matchedGlIds.has(gl.id);
                                    return (
                                        <tr key={gl.id} className={`hover:bg-zinc-50/80 ${
                                            isMatched ? "bg-emerald-50/30" : ""
                                        }`}>
                                            <td className="p-3 border-r border-zinc-200 text-zinc-500 whitespace-nowrap">
                                                {new Date(gl.entryDate).toLocaleDateString("en-KE", { dateStyle: "short" })}
                                            </td>
                                            <td className="p-3 border-r border-zinc-200">
                                                <div className="font-semibold text-black truncate max-w-[180px]">
                                                    {gl.description}
                                                </div>
                                                <div className="text-[9px] text-zinc-400 uppercase font-mono">
                                                    Source: {gl.sourceType}
                                                </div>
                                            </td>
                                            <td className="p-3 border-r border-zinc-200 text-right">
                                                <span className={`font-bold ${
                                                    gl.direction === "DEBIT" ? "text-emerald-700" : "text-rose-600"
                                                }`}>
                                                    {gl.direction === "DEBIT" ? "+" : "-"} {fmt(gl.amount, currency)}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                {isMatched ? (
                                                    <span className="border border-emerald-300 bg-emerald-50 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                                                        ✓ Verified
                                                    </span>
                                                ) : (
                                                    <span className="border border-zinc-200 bg-zinc-50 text-zinc-500 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                                                        Unlinked
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {glEntries.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center text-zinc-400 italic">
                                            No posted transactions found in Account 1200.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
