"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { recordDocumentPaymentAction, deleteDocumentPaymentAction } from "@/lib/actions/documents";
import toast from "react-hot-toast";
import { Spinner } from "@/components/Spinner";

export interface PaymentItem {
  id: string;
  amount: string;
  paymentDate: string | Date;
  paymentChannel: string;
  paymentReference?: string | null;
  notes?: string | null;
  recordedBy?: { name: string } | null;
}

interface PaymentHistorySubLedgerProps {
  documentId: string;
  shopId: string;
  shopSlug: string;
  currency: string;
  grandTotal: number | string;
  payments: PaymentItem[];
  docStatus: string;
}

export function PaymentHistorySubLedger({
  documentId,
  shopId,
  shopSlug,
  currency,
  grandTotal,
  payments = [],
  docStatus,
}: PaymentHistorySubLedgerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [channel, setChannel] = useState("MPESA");
  const [reference, setReference] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalBilled = typeof grandTotal === "string" ? parseFloat(grandTotal || "0") : grandTotal;
  const totalPaid = payments.reduce((acc, p) => acc + parseFloat(p.amount || "0"), 0);
  const balanceRemaining = Math.max(0, totalBilled - totalPaid);

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Recording settlement installment...");

    try {
      const res = await recordDocumentPaymentAction({
        documentId,
        shopId,
        shopSlug,
        amount: num,
        paymentChannel: channel,
        paymentReference: reference.trim() || undefined,
        paymentDate: new Date(paymentDate),
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        toast.success(`Payment of ${formatCurrency(num, currency)} recorded successfully!`, { id: toastId });
        setIsModalOpen(false);
        setAmount("");
        setReference("");
        setNotes("");
      } else {
        toast.error(res.error || "Failed to record payment.", { id: toastId });
      }
    } catch (err) {
      toast.error("An unexpected error occurred while saving payment.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeletePayment(paymentId: string) {
    if (!confirm("Are you sure you want to remove this payment entry? The document status will be recalculated.")) {
      return;
    }

    setDeletingId(paymentId);
    const toastId = toast.loading("Deleting payment entry...");

    try {
      const res = await deleteDocumentPaymentAction({
        paymentId,
        documentId,
        shopId,
        shopSlug,
      });

      if (res.success) {
        toast.success("Payment entry deleted.", { id: toastId });
      } else {
        toast.error(res.error || "Failed to delete payment.", { id: toastId });
      }
    } catch (err) {
      toast.error("Error deleting payment entry.", { id: toastId });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-200/80 pb-3">
        <div>
          <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Settlement &amp; Installments</span>
          <h3 className="font-bold uppercase tracking-tight text-sm font-mono text-black mt-0.5">
            Payment History &amp; Balance Ledger
          </h3>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="font-mono text-xs text-right">
            <span className="text-[10px] text-zinc-400 uppercase block">Remaining Balance:</span>
            <span className={`font-black text-sm ${balanceRemaining > 0 ? "text-rose-600" : "text-emerald-700"}`}>
              {formatCurrency(balanceRemaining, currency)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setAmount(balanceRemaining > 0 ? balanceRemaining.toFixed(2) : "");
              setIsModalOpen(true);
            }}
            className="btn-primary-modern px-3 py-1.5 text-xs font-semibold uppercase tracking-wider shrink-0"
          >
            + Record Payment
          </button>
        </div>
      </div>

      {/* PAYMENTS SUB-TABLE */}
      <div className="card-modern overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
              <th className="p-3 border-r border-zinc-200">Date Paid</th>
              <th className="p-3 border-r border-zinc-200">Payment Channel</th>
              <th className="p-3 border-r border-zinc-200">Reference / Code</th>
              <th className="p-3 border-r border-zinc-200">Notes</th>
              <th className="p-3 border-r border-zinc-200 text-right">Amount Settled</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/80 bg-white">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-50/80 transition-colors">
                <td className="p-3 border-r border-zinc-200/80 text-zinc-600">
                  {new Date(p.paymentDate).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                </td>
                <td className="p-3 border-r border-zinc-200/80 font-bold uppercase">
                  <span className="px-2 py-0.5 border border-zinc-200 bg-zinc-50 rounded text-[10px]">
                    {p.paymentChannel}
                  </span>
                </td>
                <td className="p-3 border-r border-zinc-200/80 font-bold text-black tracking-wide">
                  {p.paymentReference || "—"}
                </td>
                <td className="p-3 border-r border-zinc-200/80 font-sans text-xs text-zinc-500">
                  {p.notes || "—"}
                </td>
                <td className="p-3 border-r border-zinc-200/80 font-bold text-emerald-700 text-right">
                  {formatCurrency(p.amount, currency)}
                </td>
                <td className="p-3 text-center">
                  <button
                    type="button"
                    disabled={deletingId === p.id}
                    onClick={() => handleDeletePayment(p.id)}
                    className="text-rose-600 hover:text-rose-800 font-bold uppercase text-[10px] hover:underline"
                  >
                    {deletingId === p.id ? "Deleting..." : "Remove"}
                  </button>
                </td>
              </tr>
            ))}

            {payments.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-zinc-400 italic">
                  No installment payments recorded yet for this invoice.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <form
            onSubmit={handleRecordPayment}
            className="bg-white border border-zinc-200/80 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl font-mono text-xs"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="font-bold text-sm uppercase text-black font-sans">
                + Record Invoice Payment Installment
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-black font-bold text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                  Payment Amount ({currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm font-bold focus:outline-none focus:ring-1 focus:ring-black"
                />
                <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                  <span>Grand Total: {formatCurrency(totalBilled, currency)}</span>
                  <span>Balance: {formatCurrency(balanceRemaining, currency)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                    Channel / Method *
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs uppercase focus:outline-none focus:ring-1 focus:ring-black bg-white font-semibold"
                  >
                    <option value="MPESA">M-Pesa</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-black bg-white font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                  Transaction Code / Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. QAB71239X or FT261900123"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs uppercase focus:outline-none focus:ring-1 focus:ring-black font-semibold"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                  Internal Settlement Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. 50% initial installment via Till"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs font-sans focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn-secondary-modern px-4 py-2 text-xs font-semibold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary-modern px-4 py-2 text-xs font-semibold uppercase tracking-wider disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size={10} color="white" />
                    <span>Saving...</span>
                  </>
                ) : (
                  "Confirm Payment"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
