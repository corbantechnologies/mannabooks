"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { getClientStatement, type ClientStatementData } from "@/lib/actions/reports";
import { sendClientStatementEmailAction } from "@/lib/actions/statement-email";
import toast from "react-hot-toast";

interface Props {
    shopId: string;
    shopSlug: string;
    clientId: string;
    initialData: ClientStatementData | null;
    shopName: string;
    shopPhone?: string | null;
    shopEmail?: string | null;
    shopTaxPin?: string | null;
    initialStart?: string;
    initialEnd?: string;
}

function fmt(amount: number, currency: string) {
    if (amount === 0) return "—";
    return `${currency} ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ClientStatementView({
    shopId,
    shopSlug,
    clientId,
    initialData,
    shopName,
    shopPhone,
    shopEmail,
    shopTaxPin,
    initialStart,
    initialEnd,
}: Props) {
    const [data, setData] = useState<ClientStatementData | null>(initialData);
    const [startDate, setStartDate] = useState<string>(
        initialStart || new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]
    );
    const [endDate, setEndDate] = useState<string>(
        initialEnd || new Date().toISOString().split("T")[0]
    );
    const [isPending, startTransition] = useTransition();
    const printRef = useRef<HTMLDivElement>(null);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState("");
    const [customNote, setCustomNote] = useState("");
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    async function handleSendEmail() {
        setIsSendingEmail(true);
        const toastId = toast.loading("Dispatching statement to client...");
        try {
            const res = await sendClientStatementEmailAction({
                shopId,
                clientId,
                startDate: new Date(startDate + "T00:00:00"),
                endDate: new Date(endDate + "T23:59:59"),
                recipientEmail: recipientEmail.trim() || undefined,
                customNote: customNote.trim() || undefined,
            });
            if (res.success) {
                toast.success("Statement emailed successfully!", { id: toastId });
                setIsEmailModalOpen(false);
            } else {
                toast.error(res.error || "Failed to send email.", { id: toastId });
            }
        } catch (err: any) {
            toast.error("Network error while dispatching statement.", { id: toastId });
        } finally {
            setIsSendingEmail(false);
        }
    }

    function applyFilter(startStr: string, endStr: string) {
        setStartDate(startStr);
        setEndDate(endStr);
        startTransition(async () => {
            const start = new Date(startStr + "T00:00:00");
            const end = new Date(endStr + "T23:59:59");
            const res = await getClientStatement(shopId, clientId, start, end);
            if (res.success) {
                setData(res.data);
            }
        });
    }

    function setPreset(preset: "THIS_MONTH" | "LAST_30" | "YTD" | "ALL_TIME") {
        const now = new Date();
        let s = new Date();
        const e = now;

        if (preset === "THIS_MONTH") {
            s = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (preset === "LAST_30") {
            s = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (preset === "YTD") {
            s = new Date(now.getFullYear(), 0, 1);
        } else if (preset === "ALL_TIME") {
            s = new Date(2020, 0, 1);
        }

        const sStr = s.toISOString().split("T")[0];
        const eStr = e.toISOString().split("T")[0];
        applyFilter(sStr, eStr);
    }

    function handleCsvExport() {
        if (!data) return;
        const rows = [
            ["STATEMENT OF ACCOUNT"],
            ["Issuer:", shopName],
            ["Client:", data.clientName],
            ["Client PIN:", data.taxPin || "N/A"],
            ["Period:", data.periodLabel],
            ["Currency:", data.currency],
            [],
            ["Date", "Reference", "Type", "Description", "Debit (Billed)", "Credit (Paid)", "Running Balance", "Status"],
            ...data.lines.map((l) => [
                l.date,
                l.reference,
                l.docType,
                `"${l.description}"`,
                l.debit,
                l.credit,
                l.runningBalance,
                l.status,
            ]),
            [],
            ["TOTALS", "", "", "", data.totalDebits, data.totalCredits, data.closingBalance, ""],
            ["CLOSING OUTSTANDING BALANCE", "", "", "", "", "", data.closingBalance, ""],
        ];
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Statement_${data.clientName.replace(/\s+/g, "_")}_${startDate}_to_${endDate}.csv`;
        a.click();
    }

    function handlePrint() {
        window.print();
    }

    return (
        <div className="space-y-8">
            {/* BACK NAV & TOP HEADER */}
            <div className="space-y-2 print:hidden">
                <Link
                    href={`/workspaces/${shopSlug}/clients/${clientId}`}
                    className="font-sans text-xs font-bold text-zinc-400 hover:underline block"
                >
                    ← Back to Client Profile
                </Link>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <span className="text-xs text-zinc-400 font-medium">
                            Accounts Receivable Ledger
                        </span>
                        <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">
                            Statement of Account — {data?.clientName || "Client"}
                        </h1>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Chronological debit/credit transaction history with running balance.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsEmailModalOpen(true)}
                            disabled={!data}
                            className="px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold border border-zinc-300 bg-white hover:border-black hover:bg-zinc-50 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                        >
                            <span>✉</span>
                            <span>Email Statement</span>
                        </button>
                        <button
                            onClick={handleCsvExport}
                            disabled={!data}
                            className="px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold border border-zinc-200 bg-white hover:border-zinc-400 transition-colors disabled:opacity-40"
                        >
                            Export CSV
                        </button>
                        <button
                            onClick={handlePrint}
                            disabled={!data}
                            className="px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold bg-black text-white hover:bg-zinc-800 transition-colors disabled:opacity-40 shadow-sm"
                        >
                            Print / PDF Statement
                        </button>
                    </div>
                </div>
            </div>

            {/* EMAIL STATEMENT MODAL */}
            {isEmailModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
                    <div className="bg-white border border-zinc-300 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                            <h3 className="font-bold font-mono text-sm uppercase text-black">
                                ✉ Email Statement to Client
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsEmailModalOpen(false)}
                                className="text-zinc-400 hover:text-black font-mono font-bold text-base"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3 font-sans text-xs">
                            <p className="text-zinc-600">
                                This will format and dispatch an official statement of account for <strong>{data?.clientName}</strong> covering <strong>{data?.periodLabel}</strong>.
                            </p>

                            <div>
                                <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                                    Recipient Email (Defaults to Client Profile)
                                </label>
                                <input
                                    type="email"
                                    placeholder="e.g. accounts@client.co.ke"
                                    value={recipientEmail}
                                    onChange={(e) => setRecipientEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono focus:outline-none focus:border-black"
                                />
                            </div>

                            <div>
                                <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                                    Optional Note / Cover Message
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="e.g. Please find attached your latest statement. Kindly remit outstanding balance by Friday."
                                    value={customNote}
                                    onChange={(e) => setCustomNote(e.target.value)}
                                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-sans focus:outline-none focus:border-black resize-none"
                                />
                            </div>

                            <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 font-mono text-[11px] space-y-1">
                                <div className="flex justify-between text-zinc-500">
                                    <span>Total Invoiced:</span>
                                    <span className="font-bold text-black">{data ? fmt(data.totalDebits, data.currency) : "—"}</span>
                                </div>
                                <div className="flex justify-between text-zinc-500">
                                    <span>Total Paid:</span>
                                    <span className="font-bold text-emerald-700">{data ? fmt(data.totalCredits, data.currency) : "—"}</span>
                                </div>
                                <div className="flex justify-between text-black font-bold pt-1 border-t border-zinc-200">
                                    <span>Closing Balance:</span>
                                    <span className={data && data.closingBalance > 0 ? "text-rose-600 font-black" : "text-black"}>
                                        {data ? fmt(data.closingBalance, data.currency) : "—"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
                            <button
                                type="button"
                                onClick={() => setIsEmailModalOpen(false)}
                                className="px-4 py-2 border border-zinc-300 rounded-lg font-mono text-xs uppercase font-bold text-zinc-600 hover:bg-zinc-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isSendingEmail}
                                onClick={handleSendEmail}
                                className="px-4 py-2 bg-black text-white rounded-lg font-mono text-xs uppercase font-bold hover:bg-zinc-800 disabled:opacity-50 shadow-sm flex items-center gap-1.5"
                            >
                                {isSendingEmail ? "Dispatching..." : "Send Statement"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FILTER & DATE PRESET CONTROLS */}
            <div className="card-modern p-4 bg-zinc-50/70 border border-zinc-200/80 rounded-xl space-y-3 print:hidden">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-zinc-400 uppercase font-semibold">Presets:</span>
                        <button
                            onClick={() => setPreset("THIS_MONTH")}
                            className="px-2.5 py-1 rounded font-mono text-[11px] font-semibold border border-zinc-200 bg-white hover:border-zinc-400 text-zinc-700"
                        >
                            This Month
                        </button>
                        <button
                            onClick={() => setPreset("LAST_30")}
                            className="px-2.5 py-1 rounded font-mono text-[11px] font-semibold border border-zinc-200 bg-white hover:border-zinc-400 text-zinc-700"
                        >
                            Last 30 Days
                        </button>
                        <button
                            onClick={() => setPreset("YTD")}
                            className="px-2.5 py-1 rounded font-mono text-[11px] font-semibold border border-zinc-200 bg-white hover:border-zinc-400 text-zinc-700"
                        >
                            Year to Date
                        </button>
                        <button
                            onClick={() => setPreset("ALL_TIME")}
                            className="px-2.5 py-1 rounded font-mono text-[11px] font-semibold border border-zinc-200 bg-white hover:border-zinc-400 text-zinc-700"
                        >
                            All Time
                        </button>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="text-zinc-500 font-semibold uppercase">From:</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border border-zinc-300 rounded px-2.5 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-black"
                        />
                        <span className="text-zinc-500 font-semibold uppercase">To:</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="border border-zinc-300 rounded px-2.5 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-black"
                        />
                        <button
                            onClick={() => applyFilter(startDate, endDate)}
                            className="btn-primary-modern px-3 py-1 text-xs uppercase font-semibold"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            </div>

            {isPending && (
                <div className="text-center py-12 text-zinc-400 font-mono text-xs uppercase tracking-widest animate-pulse">
                    Regenerating Statement of Account...
                </div>
            )}

            {!isPending && data && (
                <div className="space-y-6" ref={printRef}>
                    {/* SUMMARY CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
                        <div className="card-modern p-5 bg-white border border-zinc-200/80 rounded-xl space-y-1">
                            <span className="font-mono text-[10px] uppercase font-bold text-zinc-400">Total Invoiced (Debits)</span>
                            <p className="text-2xl font-bold font-mono tracking-tight text-black">
                                {fmt(data.totalDebits, data.currency)}
                            </p>
                            <p className="text-[11px] text-zinc-500">Gross bills and debit notes issued</p>
                        </div>
                        <div className="card-modern p-5 bg-white border border-zinc-200/80 rounded-xl space-y-1">
                            <span className="font-mono text-[10px] uppercase font-bold text-zinc-400">Total Settled (Credits)</span>
                            <p className="text-2xl font-bold font-mono tracking-tight text-emerald-700">
                                {fmt(data.totalCredits, data.currency)}
                            </p>
                            <p className="text-[11px] text-zinc-500">Receipts and credit notes received</p>
                        </div>
                        <div className="card-modern p-5 bg-white border border-zinc-200/80 rounded-xl space-y-1">
                            <span className="font-mono text-[10px] uppercase font-bold text-zinc-400">Closing Balance Due</span>
                            <p className={`text-2xl font-bold font-mono tracking-tight ${
                                data.closingBalance > 0 ? "text-rose-600" : "text-emerald-700"
                            }`}>
                                {fmt(data.closingBalance, data.currency)}
                            </p>
                            <p className="text-[11px] text-zinc-500">
                                {data.closingBalance > 0 ? "Outstanding amount owed by client" : "Account fully settled"}
                            </p>
                        </div>
                    </div>

                    {/* FORMAL PRINTABLE STATEMENT CONTAINER */}
                    <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-sm print:border-0 print:shadow-none">
                        {/* CORPORATE STATEMENT HEADER */}
                        <div className="p-8 border-b border-zinc-100 space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-black font-sans uppercase tracking-tight text-black">
                                        {shopName}
                                    </h2>
                                    {shopEmail && <p className="font-mono text-xs text-zinc-500">{shopEmail}</p>}
                                    {shopPhone && <p className="font-mono text-xs text-zinc-500">{shopPhone}</p>}
                                    {shopTaxPin && <p className="font-mono text-xs text-zinc-600 font-semibold">PIN: {shopTaxPin}</p>}
                                </div>
                                <div className="text-right">
                                    <span className="font-mono text-xs uppercase font-bold tracking-widest text-zinc-400 block">
                                        STATEMENT OF ACCOUNT
                                    </span>
                                    <span className="text-sm font-mono font-bold text-black block mt-1">
                                        {data.periodLabel}
                                    </span>
                                    <span className="font-mono text-[10px] text-zinc-400 uppercase">
                                        Generated on {new Date().toLocaleDateString("en-KE", { dateStyle: "long" })}
                                    </span>
                                </div>
                            </div>

                            {/* CLIENT BILLING TO INFO */}
                            <div className="border-t border-zinc-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-0.5">
                                    <span className="font-mono text-[10px] uppercase font-bold text-zinc-400 block">Statement Issued To:</span>
                                    <p className="font-bold text-base text-black font-sans uppercase">{data.clientName}</p>
                                    <p className="font-mono text-xs text-zinc-600">{data.clientEmail}</p>
                                    {data.clientPhone && <p className="font-mono text-xs text-zinc-600">{data.clientPhone}</p>}
                                    {data.taxPin && <p className="font-mono text-xs text-zinc-700 font-semibold">KRA PIN: {data.taxPin}</p>}
                                </div>
                                <div className="sm:text-right space-y-1 flex flex-col justify-end">
                                    <span className="font-mono text-[10px] uppercase font-bold text-zinc-400 block">Current Account Balance:</span>
                                    <p className={`text-2xl font-bold font-mono ${
                                        data.closingBalance > 0 ? "text-rose-600" : "text-black"
                                    }`}>
                                        {fmt(data.closingBalance, data.currency)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* LEDGER RUNNING BALANCE TABLE */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left font-mono text-xs border-collapse">
                                <thead>
                                    <tr className="bg-zinc-50 border-b border-zinc-100 uppercase tracking-wider font-semibold text-zinc-600">
                                        <th className="px-4 py-3 border-r border-zinc-100">Date</th>
                                        <th className="px-4 py-3 border-r border-zinc-100">Reference</th>
                                        <th className="px-4 py-3 border-r border-zinc-100">Type</th>
                                        <th className="px-4 py-3 border-r border-zinc-100">Description</th>
                                        <th className="px-4 py-3 border-r border-zinc-100 text-right">Debit ({data.currency})</th>
                                        <th className="px-4 py-3 border-r border-zinc-100 text-right">Credit ({data.currency})</th>
                                        <th className="p-4 text-right">Balance ({data.currency})</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 bg-white">
                                    {data.lines.map((line, idx) => (
                                        <tr key={idx} className="hover:bg-zinc-50 transition-colors border-b border-zinc-100/80 last:border-0">
                                            <td className="p-4 border-r border-zinc-200 text-zinc-600 whitespace-nowrap">
                                                {line.date}
                                            </td>
                                            <td className="p-4 border-r border-zinc-200 font-semibold text-black">
                                                <Link
                                                    href={`/workspaces/${shopSlug}/documents/${line.docId}`}
                                                    className="hover:underline underline-offset-2"
                                                >
                                                    {line.reference}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 border-r border-zinc-100">
                                                <span className="border border-zinc-300 px-2 py-0.5 text-[9px] font-semibold uppercase rounded bg-zinc-50">
                                                    {line.docType}
                                                </span>
                                            </td>
                                            <td className="p-4 border-r border-zinc-200 font-sans text-xs text-zinc-700">
                                                {line.description}
                                            </td>
                                            <td className="p-4 border-r border-zinc-200 text-right font-semibold text-black">
                                                {line.debit > 0 ? fmt(line.debit, data.currency) : "—"}
                                            </td>
                                            <td className="p-4 border-r border-zinc-200 text-right font-semibold text-emerald-700">
                                                {line.credit > 0 ? fmt(line.credit, data.currency) : "—"}
                                            </td>
                                            <td className={`p-4 text-right font-bold ${
                                                line.runningBalance > 0 ? "text-rose-600" : "text-black"
                                            }`}>
                                                {fmt(line.runningBalance, data.currency)}
                                            </td>
                                        </tr>
                                    ))}

                                    {data.lines.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="p-12 text-center text-zinc-400 italic">
                                                No transactions recorded for this client within the selected date range.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>

                                {/* TABLE FOOTER TOTALS */}
                                {data.lines.length > 0 && (
                                    <tfoot>
                                        <tr className="bg-zinc-50/80 border-t-2 border-zinc-300 font-bold">
                                            <td colSpan={4} className="p-4 text-right uppercase tracking-wider text-xs border-r border-zinc-200">
                                                Period Totals &amp; Closing Balance
                                            </td>
                                            <td className="p-4 text-right border-r border-zinc-200 font-mono text-black">
                                                {fmt(data.totalDebits, data.currency)}
                                            </td>
                                            <td className="p-4 text-right border-r border-zinc-200 font-mono text-emerald-700">
                                                {fmt(data.totalCredits, data.currency)}
                                            </td>
                                            <td className={`p-4 text-right font-mono text-sm ${
                                                data.closingBalance > 0 ? "text-rose-600 font-black" : "text-black"
                                            }`}>
                                                {fmt(data.closingBalance, data.currency)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>

                        {/* STATEMENT PAYMENT REMITTANCE NOTICE */}
                        <div className="p-6 bg-zinc-50 border-t border-zinc-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-mono">
                            <div>
                                <span className="font-bold text-black uppercase block">Payment Instructions &amp; Remittance</span>
                                <p className="text-zinc-500 text-[11px] font-sans mt-0.5">
                                    Please reference statement number and invoice IDs when initiating bank transfers or M-Pesa payments.
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-zinc-400 uppercase text-[10px] block">Closing Balance Payable</span>
                                <span className={`text-base font-bold ${
                                    data.closingBalance > 0 ? "text-rose-600" : "text-emerald-700"
                                }`}>
                                    {fmt(data.closingBalance, data.currency)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
