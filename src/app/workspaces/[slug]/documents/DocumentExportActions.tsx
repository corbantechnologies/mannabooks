"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface ExportDocItem {
    id: string;
    docNumber: string;
    type: string;
    status: string;
    issueDate: string | Date;
    dueDate?: string | Date | null;
    subTotal: string | number;
    taxAmount: string | number;
    grandTotal: string | number;
    client?: { name: string; taxPin?: string | null } | null;
    supplier?: { name: string; taxPin?: string | null } | null;
    paymentChannel?: string | null;
    paymentReference?: string | null;
}

interface Props {
    shopSlug: string;
    currency: string;
    documents: ExportDocItem[];
}

export function DocumentExportActions({ shopSlug, currency, documents }: Props) {
    const [isExportingZip, setIsExportingZip] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    function handleExportCsv() {
        if (documents.length === 0) {
            toast.error("No documents to export in the active view.");
            return;
        }

        const totalSub = documents.reduce((s, d) => s + parseFloat(d.subTotal?.toString() || "0"), 0);
        const totalTax = documents.reduce((s, d) => s + parseFloat(d.taxAmount?.toString() || "0"), 0);
        const totalGrand = documents.reduce((s, d) => s + parseFloat(d.grandTotal?.toString() || "0"), 0);

        const rows = [
            ["DOCUMENT REGISTER / TRANSACTION STREAM"],
            ["Shop:", shopSlug],
            ["Export Date:", new Date().toLocaleDateString("en-KE", { dateStyle: "long" })],
            ["Total Records:", documents.length.toString()],
            [],
            [
                "Date",
                "Document Number",
                "Document Type",
                "Party Name",
                "Tax PIN",
                "Status",
                "Currency",
                "Subtotal (Excl. VAT)",
                "VAT Amount (16%)",
                "Grand Total",
                "Payment Channel",
                "Payment Reference",
            ],
            ...documents.map((d) => {
                const party = d.client?.name || d.supplier?.name || "Walk-in";
                const taxPin = d.client?.taxPin || d.supplier?.taxPin || "N/A";
                const dateStr = new Date(d.issueDate).toLocaleDateString("en-KE", { dateStyle: "medium" });

                return [
                    dateStr,
                    d.docNumber,
                    d.type,
                    `"${party.replace(/"/g, '""')}"`,
                    taxPin,
                    d.status,
                    currency,
                    parseFloat(d.subTotal?.toString() || "0").toFixed(2),
                    parseFloat(d.taxAmount?.toString() || "0").toFixed(2),
                    parseFloat(d.grandTotal?.toString() || "0").toFixed(2),
                    d.paymentChannel || "—",
                    `"${(d.paymentReference || "—").replace(/"/g, '""')}"`,
                ];
            }),
            [],
            [
                "TOTAL VALUATION",
                "",
                "",
                "",
                "",
                "",
                currency,
                totalSub.toFixed(2),
                totalTax.toFixed(2),
                totalGrand.toFixed(2),
                "",
                "",
            ],
        ];

        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `DocumentRegister_${shopSlug}_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${documents.length} documents to CSV!`);
        setIsOpen(false);
    }

    async function handleExportZip() {
        if (documents.length === 0) {
            toast.error("No documents to bundle.");
            return;
        }

        setIsExportingZip(true);
        const toastId = toast.loading(`Compiling ${documents.length} vector PDFs into ZIP archive...`);

        try {
            const res = await fetch(`/api/workspaces/${shopSlug}/documents/bulk-pdf`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentIds: documents.map((d) => d.id) }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to generate bulk PDF archive.");
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `MannaBooks_${shopSlug}_Documents_${new Date().toISOString().split("T")[0]}.zip`;
            a.click();
            URL.revokeObjectURL(url);

            toast.success(`Successfully archived ${documents.length} vector PDFs!`, { id: toastId });
            setIsOpen(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to download ZIP.", { id: toastId });
        } finally {
            setIsExportingZip(false);
        }
    }

    return (
        <div className="relative inline-block text-left">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="btn-secondary-modern px-3.5 py-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-2xs"
            >
                <span>📥</span>
                <span>Export ({documents.length})</span>
                <span className="text-[9px] opacity-70">{isOpen ? "▲" : "▼"}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-1.5 w-60 bg-white border border-zinc-200/80 rounded-xl shadow-xl z-40 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Export Stream ({documents.length} items)
                    </div>

                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="w-full text-left px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-emerald-50 hover:text-emerald-950 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                    >
                        <span>📊</span>
                        <div>
                            <p className="font-semibold leading-tight">Export Register (CSV)</p>
                            <p className="text-[10px] text-zinc-400 font-sans mt-0.5">Sales / Purchase table with KRA PIN</p>
                        </div>
                    </button>

                    <button
                        type="button"
                        disabled={isExportingZip}
                        onClick={handleExportZip}
                        className="w-full text-left px-2.5 py-2 text-xs font-medium text-zinc-800 hover:bg-emerald-50 hover:text-emerald-950 rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        <span>📦</span>
                        <div>
                            <p className="font-semibold leading-tight">{isExportingZip ? "Zipping PDFs..." : "Bulk PDFs (ZIP Archive)"}</p>
                            <p className="text-[10px] text-zinc-400 font-sans mt-0.5">Download vector PDFs in single zip</p>
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
}
