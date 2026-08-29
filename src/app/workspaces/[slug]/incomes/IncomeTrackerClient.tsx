"use client";

import { useState } from "react";
import { createIncome, deleteIncome, IncomeCategory } from "@/lib/actions/incomes";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { Spinner } from "@/components/Spinner";
import { ConfirmModal } from "@/components/ConfirmModal";

type Income = {
    id: string;
    description: string;
    amount: string;
    currency: string;
    category: string;
    incomeDate: string;
    attachmentUrl: string | null;
    paymentChannel: string | null;
    paymentReference: string | null;
};

export default function IncomeTrackerClient({ shopId, currency, initialIncomes }: { shopId: string, currency: string, initialIncomes: Income[] }) {
    const [isAdding, setIsAdding] = useState(false);
    
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState<IncomeCategory>("OTHER");
    const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentChannel, setPaymentChannel] = useState("");
    const [paymentReference, setPaymentReference] = useState("");
    const [attachmentUrl, setAttachmentUrl] = useState("");

    const [status, setStatus] = useState<"IDLE" | "LOADING" | "ERROR">("IDLE");
    const [isUploading, setIsUploading] = useState(false);
    const [deletingIncomeId, setDeletingIncomeId] = useState<string | null>(null);
    const [incomeToDelete, setIncomeToDelete] = useState<Income | null>(null);

    async function handleConfirmDelete() {
        if (!incomeToDelete) return;
        setDeletingIncomeId(incomeToDelete.id);
        const toastId = toast.loading("Deleting income record...");
        const res = await deleteIncome(shopId, incomeToDelete.id);
        setDeletingIncomeId(null);
        setIncomeToDelete(null);

        if (res.success) {
            toast.success("Income deleted successfully.", { id: toastId });
        } else {
            toast.error(res.error || "Failed to delete income.", { id: toastId });
        }
    }

    async function handleCloudinaryUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            toast.error("Cloudinary is not configured. Please check your environment variables.");
            return;
        }

        const toastId = toast.loading("Uploading attachment image...");
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", uploadPreset);

            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setAttachmentUrl(data.secure_url);
                toast.success("Attachment uploaded securely.", { id: toastId });
            } else {
                toast.error(data.error?.message || "Cloudinary upload failed.", { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error("Network error uploading attachment.", { id: toastId });
        } finally {
            setIsUploading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setStatus("LOADING");

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            toast.error("Please enter a valid amount.");
            setStatus("ERROR");
            return;
        }

        const res = await createIncome(shopId, {
            description,
            amount: numericAmount,
            category,
            incomeDate: new Date(incomeDate),
            currency,
            paymentChannel: paymentChannel || undefined,
            paymentReference: paymentReference || undefined,
            attachmentUrl: attachmentUrl || undefined
        });

        if (res.success) {
            toast.success("Income logged securely.");
            setDescription("");
            setAmount("");
            setCategory("OTHER");
            setPaymentChannel("");
            setPaymentReference("");
            setAttachmentUrl("");
            setIsAdding(false);
            setStatus("IDLE");
        } else {
            toast.error(res.error || "Failed to log income.");
            setStatus("ERROR");
        }
    }

    function handleDelete(incomeId: string) {
        const income = initialIncomes.find((i) => i.id === incomeId);
        if (income) setIncomeToDelete(income);
    }

    return (
        <div>
            {isAdding ? (
                <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-sm mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-bold text-lg text-black">Log Non-Operating Income</h2>
                        <button onClick={() => setIsAdding(false)} className="text-zinc-400 hover:text-black">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-black uppercase">Description</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="e.g., Bank Interest, Sold Old Printer"
                                    required
                                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-black uppercase">Amount ({currency})</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    required
                                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-black uppercase">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as IncomeCategory)}
                                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                                >
                                    <option value="INTEREST">Interest</option>
                                    <option value="DIVIDENDS">Dividends</option>
                                    <option value="ASSET_SALE">Asset Sale</option>
                                    <option value="REFUNDS">Refunds</option>
                                    <option value="COMMISSION">Commission</option>
                                    <option value="RENTAL_INCOME">Rental Income</option>
                                    <option value="GRANTS_SUBSIDIES">Grants / Subsidies</option>
                                    <option value="OTHER">Other Income</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-black uppercase">Date Received</label>
                                <input
                                    type="date"
                                    value={incomeDate}
                                    onChange={(e) => setIncomeDate(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-black uppercase">Payment Mode (Received Via)</label>
                                <select
                                    value={paymentChannel}
                                    onChange={(e) => setPaymentChannel(e.target.value)}
                                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                                >
                                    <option value="">-- Select Mode --</option>
                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                    <option value="MPESA">M-Pesa / Mobile Money</option>
                                    <option value="CASH">Cash</option>
                                    <option value="CHEQUE">Cheque</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-black uppercase">Transaction Reference (Optional)</label>
                                <input
                                    type="text"
                                    value={paymentReference}
                                    onChange={(e) => setPaymentReference(e.target.value)}
                                    placeholder="e.g. OAB71239X"
                                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <label className="block text-xs font-bold text-black uppercase mb-1.5">Attach Proof/Deposit Slip (Optional)</label>
                            
                            {attachmentUrl ? (
                                <div className="relative inline-block border border-zinc-200 rounded-lg overflow-hidden group">
                                    <img src={attachmentUrl} alt="Attachment" className="w-32 h-32 object-cover" />
                                    <button 
                                        type="button"
                                        onClick={() => setAttachmentUrl("")}
                                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleCloudinaryUpload}
                                        disabled={isUploading}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                    <div className={`border-2 border-dashed border-zinc-300 rounded-lg p-6 text-center transition-colors ${isUploading ? 'bg-zinc-100 border-zinc-400' : 'hover:border-black hover:bg-zinc-50'}`}>
                                        {isUploading ? (
                                            <Spinner size={32} className="mx-auto mb-2 text-zinc-500" />
                                        ) : (
                                            <svg className="mx-auto h-8 w-8 text-zinc-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                        )}
                                        <p className="text-sm font-bold text-black">{isUploading ? "Uploading to secure vault..." : "Click or drag to upload receipt"}</p>
                                        <p className="text-[10px] text-zinc-500 font-mono mt-1">JPEG, PNG up to 5MB</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-4 border-t border-zinc-100">
                            <button
                                type="submit"
                                disabled={status === "LOADING" || isUploading}
                                className="bg-black hover:bg-zinc-800 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {status === "LOADING" && <Spinner size={16} />}
                                {status === "LOADING" ? "Saving..." : "Save Income Record"}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="mb-6 flex justify-between items-center">
                    <p className="text-sm text-zinc-500">
                        {initialIncomes.length} {initialIncomes.length === 1 ? 'record' : 'records'} logged.
                    </p>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-zinc-800 transition-colors flex items-center gap-2"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Log Income
                    </button>
                </div>
            )}

            {initialIncomes.length === 0 ? (
                <div className="bg-white border border-zinc-200/80 rounded-xl p-12 text-center shadow-sm">
                    <div className="bg-emerald-50 text-emerald-600 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    </div>
                    <h3 className="text-zinc-900 font-bold mb-1 text-lg">No non-operating income</h3>
                    <p className="text-zinc-500 text-sm max-w-sm mx-auto mb-6">Keep track of non-operational revenue like interests or dividends for clean financial reporting.</p>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="border-2 border-dashed border-zinc-300 text-zinc-700 font-bold px-6 py-2.5 rounded-lg hover:border-black hover:text-black hover:bg-zinc-50 transition-colors"
                    >
                        Log Your First Income
                    </button>
                </div>
            ) : (
                <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-50/50 border-b border-zinc-200/80 text-xs uppercase text-zinc-500 font-bold">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4">Payment Info</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {initialIncomes.map((inc) => (
                                    <tr key={inc.id} className="hover:bg-zinc-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-zinc-600">
                                            {new Date(inc.incomeDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-zinc-900">{inc.description}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700">
                                                {inc.category.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">
                                            +{inc.currency} {formatCurrency(parseFloat(inc.amount))}
                                        </td>
                                        <td className="px-6 py-4">
                                            {inc.paymentChannel ? (
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase text-zinc-400 block">{inc.paymentChannel.replace('_', ' ')}</span>
                                                    {inc.paymentReference && <span className="font-mono text-xs text-zinc-600">{inc.paymentReference}</span>}
                                                </div>
                                            ) : (
                                                <span className="text-zinc-300 italic text-xs">Unspecified</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            {inc.attachmentUrl && (
                                                <a href={inc.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs font-bold inline-flex items-center gap-1">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path></svg>
                                                    View
                                                </a>
                                            )}
                                            <button 
                                                onClick={() => handleDelete(inc.id)}
                                                disabled={deletingIncomeId === inc.id}
                                                className="text-red-500 hover:text-red-700 transition-colors p-1 disabled:opacity-50 inline-flex items-center justify-center"
                                                title="Delete Income"
                                            >
                                                {deletingIncomeId === inc.id ? (
                                                    <Spinner size={16} />
                                                ) : (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* CONFIRM DELETE MODAL */}
            <ConfirmModal
                isOpen={!!incomeToDelete}
                onClose={() => setIncomeToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Income Record"
                message={`Are you sure you want to delete the income record for "${incomeToDelete?.description}" (${incomeToDelete ? formatCurrency(incomeToDelete.amount, incomeToDelete.currency) : ""})? This action cannot be undone.`}
                confirmLabel="Delete Record"
                variant="danger"
                isLoading={deletingIncomeId !== null}
            />
        </div>
    );
}
