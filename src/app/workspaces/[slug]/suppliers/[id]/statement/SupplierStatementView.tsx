"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { getSupplierStatement, type SupplierStatementData } from "@/lib/actions/reports";
import { sendSupplierStatementEmailAction } from "@/lib/actions/statement-email";
import toast from "react-hot-toast";

interface Props {
    shopId: string;
    shopSlug: string;
    supplierId: string;
    initialData: SupplierStatementData | null;
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

export default function SupplierStatementView({
    shopId,
    shopSlug,
    supplierId,
    initialData,
    shopName,
    shopPhone,
    shopEmail,
    shopTaxPin,
    initialStart,
    initialEnd,
}: Props) {
    const [data, setData] = useState<SupplierStatementData | null>(initialData);
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
        const toastId = toast.loading("Dispatching statement to vendor...");
        try {
            const res = await sendSupplierStatementEmailAction({
                shopId,
                supplierId,
                startDate: new Date(startDate + "T00:00:00"),
                endDate: new Date(endDate + "T23:59:59"),
                recipientEmail: recipientEmail.trim() || undefined,
                customNote: customNote.trim() || undefined,
            });
            if (res.success) {
                toast.success("Statement emailed to supplier successfully!", { id: toastId });
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
            const res = await getSupplierStatement(shopId, supplierId, start, end);
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
            ["SUPPLIER STATEMENT OF ACCOUNT"],
            ["Issuer:", shopName],
            ["Vendor:", data.supplierName],
            ["Vendor PIN:", data.taxPin || "N/A"],
            ["Period:", data.periodLabel],
            ["Currency:", data.currency],
            [],
            ["Date", "Reference", "Type", "Description", "Paid / Debit", "Billed / Credit", "Running Balance", "Status"],
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
            ["CLOSING OUTSTANDING PAYABLE", "", "", "", "", "", data.closingBalance, ""],
        ];
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `SupplierStatement_${data.supplierName.replace(/\s+/g, "_")}_${startDate}_to_${endDate}.csv`;
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
                    href={`/workspaces/${shopSlug}/suppliers/${supplierId}`}
                    className="font-sans text-xs font-bold text-zinc-400 hover:underline block"
                >
                    ← Back to Supplier Profile
                </Link>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <span className="text-xs text-zinc-400 font-medium">
                            Accounts Payable Ledger
                        </span>
                        <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">
                            Statement of Account — {data?.supplierName || "Supplier"}
                        </h1>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Chronological bills, payments, and running liability balance.
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
                                ✉ Email Statement to Vendor
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsEmailModalOpen(false)}
                                className="text-zinc-400 hover:text-black font-mono font-bold text-base cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3 font-sans text-xs">
                            <p className="text-zinc-600">
                                This will format and dispatch an official statement of account for <strong>{data?.supplierName}</strong> covering <strong>{data?.periodLabel}</strong>.
                            </p>

                            <div>
                                <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                                    Recipient Email (Defaults to Supplier Profile)
                                </label>
                                <input
                                    type="email"
                                    placeholder="e.g. accounts@supplier.co.ke"
                                    value={recipientEmail}
                                    onChange={(e) => setRecipientEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono focus:outline-none focus:border-black"
                                />
                            </div>

                            <div>
                                <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                                    Optional Note / Remittance Notice
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="e.g. Please find reconciled vendor ledger statement. Payment for voucher PV-002 scheduled for tomorrow."
                                    value={customNote}
                                    onChange={(e) => setCustomNote(e.target.value)}
                                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-sans focus:outline-none focus:border-black resize-none"
                                />
                            </div>

                            <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 font-mono text-[11px] space-y-1">
                                <div className="flex justify-between text-zinc-500">
                                    <span>Total Billed:</span>
                                    <span>{fmt(data?.totalCredits || 0, data?.currency || "KES")}</span>
                                </div>
                                <div className="flex justify-between text-zinc-500">
                                    <span>Total Settled:</span>
                                    <span>{fmt(data?.totalDebits || 0, data?.currency || "KES")}</span>
                                </div>
                                <div className="flex justify-between font-bold text-black border-t border-zinc-200 pt-1">
                                    <span>Closing Payable:</span>
                                    <span>{fmt(data?.closingBalance || 0, data?.currency || "KES")}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3">
                            <button
                                type="button"
                                onClick={() => setIsEmailModalOpen(false)}
                                className="px-3 py-1.5 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSendEmail}
                                disabled={isSendingEmail}
                                className="px-4 py-1.5 bg-black text-white rounded-lg text-xs font-bold uppercase font-mono hover:bg-zinc-800 disabled:opacity-50"
                            >
                                {isSendingEmail ? "Dispatching..." : "Send Email"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FILTER CONTROLS BAR */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-zinc-200/80 rounded-xl bg-white shadow-2xs print:hidden">
                <div className="flex flex-wrap items-center gap-2">
                    {(["THIS_MONTH", "LAST_30", "YTD", "ALL_TIME"] as const).map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setPreset(p)}
                            className="px-3 py-1.5 rounded-lg font-mono text-xs font-bold border border-zinc-200 hover:border-black transition-colors"
                        >
                            {p === "THIS_MONTH" ? "This Month" : p === "LAST_30" ? "Last 30 Days" : p === "YTD" ? "Year-to-Date" : "All Time"}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => applyFilter(e.target.value, endDate)}
                        className="px-2.5 py-1.5 text-xs font-mono border border-zinc-300 rounded-lg focus:outline-none focus:border-black"
                    />
                    <span className="text-zinc-400 font-mono text-xs">to</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => applyFilter(startDate, e.target.value)}
                        className="px-2.5 py-1.5 text-xs font-mono border border-zinc-300 rounded-lg focus:outline-none focus:border-black"
                    />
                </div>
            </div>

            {/* PRINTABLE STATEMENT CONTAINER */}
            <div ref={printRef} className="border border-zinc-200 rounded-2xl bg-white p-6 sm:p-10 space-y-8 shadow-xs print:border-0 print:p-0">
                {/* STATEMENT HEADER */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-zinc-200 pb-8">
                    <div>
                        <h2 className="text-2xl font-bold uppercase tracking-tight text-black">{shopName}</h2>
                        <p className="text-xs text-zinc-500 mt-1 font-mono">
                            {shopPhone && <span>Tel: {shopPhone} · </span>}
                            {shopEmail && <span>Email: {shopEmail} · </span>}
                            {shopTaxPin && <span>PIN: {shopTaxPin}</span>}
                        </p>
                    </div>
                    <div className="sm:text-right">
                        <span className="badge-modern bg-zinc-100 text-zinc-800 font-mono text-xs uppercase font-bold px-3 py-1 rounded-full">
                            Vendor Statement
                        </span>
                        <p className="text-xs text-zinc-500 font-mono mt-2">Period: {data?.periodLabel}</p>
                    </div>
                </div>

                {/* VENDOR & SUMMARY STRIP */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-zinc-50 p-5 rounded-xl border border-zinc-100">
                    <div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase font-mono tracking-wider block">Vendor / Payee</span>
                        <p className="text-base font-bold text-black mt-0.5">{data?.supplierName}</p>
                        <p className="text-xs text-zinc-600 font-mono mt-0.5">
                            {data?.supplierEmail && <span>{data.supplierEmail}</span>}
                            {data?.supplierPhone && <span> · {data.supplierPhone}</span>}
                        </p>
                        {data?.taxPin && <p className="text-xs text-zinc-500 font-mono mt-0.5">PIN: {data.taxPin}</p>}
                    </div>

                    <div className="flex flex-col sm:items-end justify-center">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase font-mono tracking-wider block">Closing Payable Balance</span>
                        <p className="text-2xl font-black font-mono text-black mt-0.5">
                            {fmt(data?.closingBalance || 0, data?.currency || "KES")}
                        </p>
                        <span className="text-[10px] text-zinc-500 font-sans mt-0.5">
                            {(data?.closingBalance || 0) > 0 ? "Liability owed to supplier" : "Account settled in full"}
                        </span>
                    </div>
                </div>

                {/* TRANSACTIONS TABLE */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-200 text-[10px] font-mono uppercase text-zinc-400">
                                <th className="py-2.5 px-3">Date</th>
                                <th className="py-2.5 px-3">Reference</th>
                                <th className="py-2.5 px-3">Description</th>
                                <th className="py-2.5 px-3 text-right">Paid (KES)</th>
                                <th className="py-2.5 px-3 text-right">Billed (KES)</th>
                                <th className="py-2.5 px-3 text-right">Running Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 font-mono">
                            {isPending ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-zinc-400 uppercase tracking-widest text-xs animate-pulse">
                                        Compiling statement records...
                                    </td>
                                </tr>
                            ) : data?.lines && data.lines.length > 0 ? (
                                data.lines.map((line, idx) => (
                                    <tr key={idx} className="hover:bg-zinc-50/60 transition-colors">
                                        <td className="py-3 px-3 text-zinc-600 whitespace-nowrap">{line.date}</td>
                                        <td className="py-3 px-3 font-bold text-black whitespace-nowrap">
                                            <Link
                                                href={`/workspaces/${shopSlug}/documents/${line.docId}`}
                                                className="hover:underline text-black"
                                            >
                                                {line.reference}
                                            </Link>
                                        </td>
                                        <td className="py-3 px-3 text-zinc-600 font-sans">{line.description}</td>
                                        <td className="py-3 px-3 text-right font-semibold text-emerald-700">
                                            {line.debit > 0 ? fmt(line.debit, "") : "—"}
                                        </td>
                                        <td className="py-3 px-3 text-right font-semibold text-black">
                                            {line.credit > 0 ? fmt(line.credit, "") : "—"}
                                        </td>
                                        <td className="py-3 px-3 text-right font-black text-black">
                                            {fmt(line.runningBalance, "")}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-zinc-400 font-sans">
                                        No billing or payment records found for this period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {data && data.lines.length > 0 && (
                            <tfoot>
                                <tr className="border-t-2 border-black font-mono font-bold text-xs bg-zinc-50/50">
                                    <td colSpan={3} className="py-3 px-3 uppercase">Total Valuation ({data.currency})</td>
                                    <td className="py-3 px-3 text-right text-emerald-700">{fmt(data.totalDebits, "")}</td>
                                    <td className="py-3 px-3 text-right text-black">{fmt(data.totalCredits, "")}</td>
                                    <td className="py-3 px-3 text-right text-black">{fmt(data.closingBalance, "")}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                {/* FOOTER */}
                <div className="border-t border-zinc-200 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-zinc-400 font-mono gap-2">
                    <p>Generated by Manna Books · Double-entry Accounting Engine</p>
                    <p>{new Date().toLocaleDateString("en-KE", { dateStyle: "long" })}</p>
                </div>
            </div>
        </div>
    );
}
