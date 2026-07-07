"use client";

import { useState } from "react";
import { createExpense, deleteExpense } from "@/lib/actions/expenses";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

type ExpenseCategory = 'RENT' | 'UTILITIES' | 'FUEL' | 'MARKETING' | 'SALARIES' | 'OFFICE_SUPPLIES' | 'OTHER';

type Expense = {
    id: string;
    description: string;
    amount: string;
    currency: string;
    category: string;
    expenseDate: string;
    receiptUrl: string | null;
    paymentChannel: string | null;
    paymentReference: string | null;
};

export default function ExpenseTrackerClient({ shopId, shopCurrency, initialExpenses }: { shopId: string, shopCurrency: string, initialExpenses: Expense[] }) {
    const [isAdding, setIsAdding] = useState(false);
    
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState<ExpenseCategory>("OTHER");
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentChannel, setPaymentChannel] = useState("");
    const [paymentReference, setPaymentReference] = useState("");
    const [receiptUrl, setReceiptUrl] = useState("");

    const [status, setStatus] = useState<"IDLE" | "LOADING" | "ERROR">("IDLE");
    const [isUploading, setIsUploading] = useState(false);
    const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

    async function handleCloudinaryUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            toast.error("Cloudinary is not configured. Please check your environment variables.");
            return;
        }

        const toastId = toast.loading("Uploading receipt image...");
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
                setReceiptUrl(data.secure_url);
                toast.success("Receipt uploaded securely.", { id: toastId });
            } else {
                toast.error(data.error?.message || "Cloudinary upload failed.", { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error("Network error uploading receipt.", { id: toastId });
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

        const res = await createExpense(shopId, {
            description,
            amount: numericAmount,
            category,
            expenseDate: new Date(expenseDate),
            currency: shopCurrency,
            paymentChannel: paymentChannel || undefined,
            paymentReference: paymentReference || undefined,
            receiptUrl: receiptUrl || undefined
        });

        if (res.success) {
            toast.success("Expense logged securely.");
            setDescription("");
            setAmount("");
            setCategory("OTHER");
            setPaymentChannel("");
            setPaymentReference("");
            setReceiptUrl("");
            setIsAdding(false);
            setStatus("IDLE");
        } else {
            toast.error(res.error || "Failed to log expense.");
            setStatus("ERROR");
        }
    }



    return (
        <div>
            {isAdding ? (
                <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-sm mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-bold text-lg text-black">Log Operating Expense</h2>
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
                                    placeholder="e.g., Office Rent, Server Hosting"
                                    required
                                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-black uppercase">Amount ({shopCurrency})</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    required
                                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-black uppercase">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
                                >
                                    <option value="RENT">Rent & Lease</option>
                                    <option value="UTILITIES">Utilities (Water, Power, Internet)</option>
                                    <option value="FUEL">Fuel & Travel</option>
                                    <option value="MARKETING">Marketing & Ads</option>
                                    <option value="SALARIES">Salaries & Wages</option>
                                    <option value="OFFICE_SUPPLIES">Office Supplies</option>
                                    <option value="OTHER">Other Expense</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-black uppercase">Date Incurred</label>
                                <input
                                    type="date"
                                    value={expenseDate}
                                    onChange={(e) => setExpenseDate(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-black uppercase">Payment Mode</label>
                                <select
                                    value={paymentChannel}
                                    onChange={(e) => setPaymentChannel(e.target.value)}
                                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
                                >
                                    <option value="">-- Select Mode --</option>
                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                    <option value="MPESA">M-Pesa / Mobile Money</option>
                                    <option value="CASH">Cash</option>
                                    <option value="CHEQUE">Cheque</option>
                                    <option value="CREDIT_CARD">Credit / Debit Card</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-black uppercase">Transaction Reference (Optional)</label>
                                <input
                                    type="text"
                                    value={paymentReference}
                                    onChange={(e) => setPaymentReference(e.target.value)}
                                    placeholder="e.g. QAB71239X"
                                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <label className="block text-xs font-bold text-black uppercase mb-1.5">Attach Receipt Image (Optional)</label>
                            
                            {receiptUrl ? (
                                <div className="relative inline-block border border-zinc-200 rounded-lg overflow-hidden group">
                                    <img src={receiptUrl} alt="Receipt" className="w-32 h-32 object-cover" />
                                    <button 
                                        type="button"
                                        onClick={() => setReceiptUrl("")}
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
                                        <svg className="mx-auto h-8 w-8 text-zinc-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        <p className="text-sm font-bold text-black">{isUploading ? "Uploading to secure vault..." : "Click or drag to upload receipt"}</p>
                                        <p className="text-[10px] text-zinc-500 font-mono mt-1">JPEG, PNG up to 5MB</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={status === "LOADING" || isUploading}
                                className="bg-black hover:bg-zinc-800 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-colors disabled:opacity-50"
                            >
                                {status === "LOADING" ? "Logging..." : "Log Expense"}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="flex justify-end mb-4">
                    <button onClick={() => setIsAdding(true)} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-zinc-800 transition-colors">
                        + Add Expense
                    </button>
                </div>
            )}

            <div className="card-modern overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                        <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
                            <th className="p-4 border-r border-zinc-200">Date</th>
                            <th className="p-4 border-r border-zinc-200">Description</th>
                            <th className="p-4 border-r border-zinc-200">Category</th>
                            <th className="p-4 border-r border-zinc-200">Payment</th>
                            <th className="p-4 border-r border-zinc-200">Receipt</th>
                            <th className="p-4 border-r border-zinc-200 text-right">Amount</th>
                            <th className="p-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 bg-white">
                        {initialExpenses.map(expense => (
                            <tr key={expense.id} className="hover:bg-zinc-50/80 transition-colors">
                                <td className="p-4 border-r border-zinc-200/80 font-sans text-sm font-semibold uppercase tracking-tight text-black">{expense.expenseDate.split('T')[0]}</td>
                                <td className="p-4 border-r border-zinc-200/80 text-zinc-600">{expense.description}</td>
                                <td className="p-4 border-r border-zinc-200/80">
                                    <span className="inline-block px-2 py-1 bg-zinc-100 text-zinc-800 rounded text-[10px] font-bold tracking-wider uppercase">
                                        {expense.category}
                                    </span>
                                </td>
                                <td className="p-4 border-r border-zinc-200/80">
                                    {expense.paymentChannel ? (
                                        <div>
                                            <span className="block text-xs font-bold text-black">{expense.paymentChannel.replace('_', ' ')}</span>
                                            {expense.paymentReference && <span className="block text-[10px] font-mono text-zinc-500 mt-0.5">{expense.paymentReference}</span>}
                                        </div>
                                    ) : (
                                        <span className="text-zinc-400 text-xs italic">—</span>
                                    )}
                                </td>
                                <td className="p-4 border-r border-zinc-200/80">
                                    {expense.receiptUrl ? (
                                        <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2">
                                            View Receipt
                                        </a>
                                    ) : (
                                        <span className="text-zinc-400 italic">No receipt</span>
                                    )}
                                </td>
                                <td className="p-4 border-r border-zinc-200/80 text-right font-black text-sm text-black">
                                    {formatCurrency(parseFloat(expense.amount), expense.currency)}
                                </td>
                                <td className="p-4 text-center">
                                    {deletingExpenseId === expense.id ? (
                                        <div className="flex justify-center items-center gap-1.5 animate-in fade-in zoom-in-95">
                                            <button 
                                                onClick={async () => {
                                                    const toastId = toast.loading("Deleting expense...");
                                                    const res = await deleteExpense(shopId, expense.id);
                                                    if (res.success) {
                                                        toast.success("Expense deleted.", { id: toastId });
                                                    } else {
                                                        toast.error(res.error || "Failed to delete expense.", { id: toastId });
                                                    }
                                                    setDeletingExpenseId(null);
                                                }} 
                                                className="bg-rose-600 text-white px-2 py-0.5 rounded font-sans text-[10px] font-bold hover:bg-rose-700 uppercase"
                                            >
                                                Confirm
                                            </button>
                                            <button 
                                                onClick={() => setDeletingExpenseId(null)} 
                                                className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded font-sans text-[10px] font-bold hover:bg-zinc-200 uppercase"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setDeletingExpenseId(expense.id)} className="text-rose-500 hover:text-rose-700 text-xs font-bold uppercase tracking-wider">
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {initialExpenses.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-sm text-zinc-500 font-mono">No expenses logged yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
