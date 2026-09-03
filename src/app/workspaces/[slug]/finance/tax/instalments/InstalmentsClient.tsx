"use client";

import { useState, useTransition } from "react";
import { generateTaxInstalments, payTaxInstalment } from "@/lib/actions/tax";

interface Instalment {
    id: string;
    instalmentNumber: number;
    dueDate: string;
    estimatedAmount: string;
    paidAmount: string;
    paidAt: string | null;
    paymentReference: string | null;
    status: "PENDING" | "PAID" | "OVERDUE";
}

interface Props {
    shopId: string;
    shopSlug: string;
    year: number;
    estimatedTax: number;
    instalmentsRequired: boolean;
    initialInstalments: Instalment[];
    currency: string;
}

function fmt(amount: number, currency: string) {
    return `${currency} ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function InstalmentsClient({ shopId, shopSlug, year, estimatedTax, instalmentsRequired, initialInstalments, currency }: Props) {
    const [instalments, setInstalments] = useState<Instalment[]>(initialInstalments);
    const [isPending, startTransition] = useTransition();
    const [payingId, setPayingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [payment, setPayment] = useState({
        paidAmount: "",
        paymentReference: "",
        paidAt: new Date().toISOString().split("T")[0],
    });

    function showMsg(type: "success" | "error", text: string) {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    }

    function handleGenerate() {
        startTransition(async () => {
            const res = await generateTaxInstalments(shopId, shopSlug, year);
            if (res.success) {
                showMsg("success", "Tax instalment schedule generated successfully.");
                setTimeout(() => window.location.reload(), 1500);
            } else {
                showMsg("error", res.error || "Failed to generate schedule.");
            }
        });
    }

    function handleRecordPayment(id: string) {
        const amt = parseFloat(payment.paidAmount);
        if (isNaN(amt) || amt <= 0 || !payment.paymentReference) return;

        startTransition(async () => {
            const res = await payTaxInstalment(shopId, shopSlug, id, {
                paidAmount: amt,
                paymentReference: payment.paymentReference.trim(),
                paidAt: new Date(payment.paidAt + "T00:00:00"),
            });
            if (res.success) {
                setInstalments(prev => prev.map(i => i.id === id
                    ? { ...i, status: "PAID", paidAmount: amt.toFixed(2), paidAt: payment.paidAt, paymentReference: payment.paymentReference }
                    : i
                ));
                setPayingId(null);
                setPayment({ paidAmount: "", paymentReference: "", paidAt: new Date().toISOString().split("T")[0] });
                showMsg("success", `Payment of ${fmt(amt, currency)} recorded and DR 2310 / CR 1200 posted.`);
            } else {
                showMsg("error", res.error || "Failed to pay instalment.");
            }
        });
    }

    const totalPaid = instalments.reduce((s, i) => s + parseFloat(i.paidAmount), 0);

    return (
        <div className="space-y-6">
            {message && (
                <div className={`px-4 py-3 rounded-lg text-sm font-medium border ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
                    {message.text}
                </div>
            )}

            {/* Threshold Banner */}
            <div className={`border p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${instalmentsRequired ? "bg-amber-50 border-amber-200" : "bg-zinc-50 border-zinc-200"}`}>
                <div>
                    <p className={`font-mono text-xs font-bold uppercase ${instalmentsRequired ? "text-amber-800" : "text-zinc-500"}`}>
                        CIT Instalment Status: {instalmentsRequired ? "⚠️ Compulsory" : "✓ Optional"}
                    </p>
                    <p className="text-sm text-zinc-600 mt-1">
                        Estimated Tax Liability: <strong>{fmt(estimatedTax, currency)}</strong>.
                        {instalmentsRequired
                            ? " Tax is >= KES 30,000. You are required to file and pay quarterly instalments."
                            : " Tax is < KES 30,000. You can file and pay CIT annually, instalments are optional."
                        }
                    </p>
                </div>
                {instalments.length === 0 && (
                    <button onClick={handleGenerate} disabled={isPending}
                        className="bg-black text-white px-5 py-2.5 rounded-lg font-mono text-xs uppercase font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50 flex-shrink-0">
                        Generate CIT Schedule
                    </button>
                )}
            </div>

            {instalments.length > 0 && (
                <>
                    {/* Summary Card */}
                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 flex items-center justify-between text-sm">
                        <span className="text-zinc-500">Year {year} CIT Instalments</span>
                        <span className="font-mono text-sm font-bold text-black">Total Remitted: {fmt(totalPaid, currency)}</span>
                    </div>

                    {/* Schedule List */}
                    <div className="border border-zinc-200 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <div className="min-w-[700px]">
                                <div className="grid grid-cols-[80px_1fr_1.2fr_1.2fr_120px] gap-4 px-4 py-2.5 bg-zinc-50 border-b border-zinc-100">
                                    <span className="font-mono text-[9px] uppercase text-zinc-400 font-semibold">Instalment</span>
                                    <span className="font-mono text-[9px] uppercase text-zinc-400 font-semibold">Due Date</span>
                                    <span className="font-mono text-[9px] uppercase text-zinc-400 font-semibold text-right">Est. Liability</span>
                                    <span className="font-mono text-[9px] uppercase text-zinc-400 font-semibold text-right">Paid Amount</span>
                                    <span className="font-mono text-[9px] uppercase text-zinc-400 font-semibold text-center">Status</span>
                                </div>

                                <div className="divide-y divide-zinc-100">
                                    {instalments.map(inst => (
                                        <div key={inst.id} className="p-4 hover:bg-zinc-50/50 transition-colors space-y-3">
                                            <div className="grid grid-cols-[80px_1fr_1.2fr_1.2fr_120px] gap-4 items-center">
                                                <span className="text-sm font-bold text-black">#{inst.instalmentNumber}</span>
                                                <span className="text-xs text-zinc-600 font-mono">
                                                    {new Date(inst.dueDate).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })}
                                                </span>
                                                <span className="text-xs font-mono text-right text-zinc-600">{fmt(parseFloat(inst.estimatedAmount), currency)}</span>
                                                <span className="text-xs font-mono text-right text-black font-semibold">
                                                    {parseFloat(inst.paidAmount) > 0 ? fmt(parseFloat(inst.paidAmount), currency) : "—"}
                                                </span>
                                                <div className="flex justify-center items-center gap-2">
                                                    <span className={`font-mono text-[9px] uppercase px-2 py-0.5 rounded border font-bold ${inst.status === "PAID" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-emerald-200"}`}>
                                                        {inst.status}
                                                    </span>
                                                    {inst.status === "PENDING" && (
                                                        <button onClick={() => setPayingId(inst.id)}
                                                            className="text-[10px] text-zinc-400 hover:text-black font-mono uppercase font-bold">
                                                            Pay
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {payingId === inst.id && (
                                                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 space-y-3">
                                                    <p className="font-mono text-[10px] font-bold text-emerald-700 uppercase">Record Instalment Remittance</p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                        <input type="number" step="0.01" value={payment.paidAmount} onChange={e => setPayment(p => ({ ...p, paidAmount: e.target.value }))}
                                                            placeholder="Amount Paid (KES)"
                                                            className="border border-emerald-200 rounded px-3 py-1.5 text-xs focus:ring-emerald-500 bg-white font-mono" />
                                                        <input type="text" value={payment.paymentReference} onChange={e => setPayment(p => ({ ...p, paymentReference: e.target.value }))}
                                                            placeholder="KRA Payment PRN / Ref"
                                                            className="border border-emerald-200 rounded px-3 py-1.5 text-xs focus:ring-emerald-500 bg-white" />
                                                        <input type="date" value={payment.paidAt} onChange={e => setPayment(p => ({ ...p, paidAt: e.target.value }))}
                                                            className="border border-emerald-200 rounded px-3 py-1.5 text-xs focus:ring-emerald-500 bg-white font-mono" />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleRecordPayment(inst.id)} disabled={isPending || !payment.paidAmount || !payment.paymentReference}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono uppercase font-bold px-3 py-1.5 rounded disabled:opacity-40">
                                                            Confirm Payment
                                                        </button>
                                                        <button onClick={() => setPayingId(null)} className="text-xs text-zinc-500 hover:text-black">Cancel</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
