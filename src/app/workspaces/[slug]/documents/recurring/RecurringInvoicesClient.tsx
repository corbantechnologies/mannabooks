"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { toggleRecurringInvoiceAction, generateNextRecurringInvoiceAction, type RecurringInvoiceItem } from "@/lib/actions/recurring";
import toast from "react-hot-toast";
import { Spinner } from "@/components/Spinner";

interface RecurringInvoicesClientProps {
  shopId: string;
  shopSlug: string;
  currency: string;
  recurringInvoices: RecurringInvoiceItem[];
}

export function RecurringInvoicesClient({
  shopId,
  shopSlug,
  currency,
  recurringInvoices,
}: RecurringInvoicesClientProps) {
  const [invoices, setInvoices] = useState(recurringInvoices);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  async function handleToggle(inv: RecurringInvoiceItem) {
    const nextState = !inv.isRecurring;
    const toastId = toast.loading(`${nextState ? "Resuming" : "Pausing"} recurring schedule...`);

    const res = await toggleRecurringInvoiceAction({
      shopId,
      shopSlug,
      documentId: inv.id,
      isRecurring: nextState,
      recurringInterval: inv.recurringInterval || "MONTHLY",
    });

    if (res.success) {
      toast.success(`Recurring schedule ${nextState ? "resumed" : "paused"}!`, { id: toastId });
      setInvoices((prev) =>
        prev.map((item) => (item.id === inv.id ? { ...item, isRecurring: nextState } : item))
      );
    } else {
      toast.error(res.error || "Failed to update status.", { id: toastId });
    }
  }

  async function handleGenerateNow(inv: RecurringInvoiceItem) {
    setGeneratingId(inv.id);
    const toastId = toast.loading(`Issuing next recurring cycle invoice for ${inv.clientName}...`);

    try {
      const res = await generateNextRecurringInvoiceAction({
        shopId,
        shopSlug,
        sourceDocumentId: inv.id,
      });

      if (res.success && res.newDocId) {
        toast.success("New recurring invoice cycle issued successfully!", { id: toastId });
      } else {
        toast.error(res.error || "Failed to generate invoice.", { id: toastId });
      }
    } catch {
      toast.error("Error issuing recurring cycle.", { id: toastId });
    } finally {
      setGeneratingId(null);
    }
  }

  const activeCount = invoices.filter((i) => i.isRecurring).length;

  return (
    <div className="space-y-8 selection:bg-black selection:text-white">
      {/* HEADER TOP BAR */}
      <div className="border-b border-zinc-200/80 pb-6 space-y-2">
        <Link
          href={`/workspaces/${shopSlug}/documents`}
          className="text-xs font-bold text-zinc-400 hover:underline block"
        >
          ← Back to Billing &amp; Invoices
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
              Automated Subscription &amp; Retainer Billing
            </span>
            <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black">
              Recurring Invoices Management
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Automate periodic retainer invoicing for ongoing client contracts and subscriptions.
            </p>
          </div>

          <Link
            href={`/workspaces/${shopSlug}/documents/new`}
            className="btn-primary-modern px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider shadow-2xs"
          >
            + Create New Invoice
          </Link>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-modern p-5 space-y-1 border-l-4 border-zinc-900 bg-white">
          <p className="text-[10px] text-zinc-400 uppercase font-bold">Active Recurring Series</p>
          <p className="text-2xl font-bold font-mono tracking-tight text-black">{activeCount}</p>
          <p className="text-[10px] text-zinc-500">{invoices.length} total registered templates</p>
        </div>

        <div className="card-modern p-5 space-y-1 border-l-4 border-emerald-600 bg-white">
          <p className="text-[10px] text-zinc-400 uppercase font-bold">Upcoming Next 30 Days</p>
          <p className="text-2xl font-bold font-mono tracking-tight text-emerald-700">
            {invoices.filter((i) => i.isRecurring && i.nextRecurringDate && new Date(i.nextRecurringDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length}
          </p>
          <p className="text-[10px] text-zinc-500">Scheduled auto-generation cycles</p>
        </div>

        <div className="card-modern p-5 space-y-1 border-l-4 border-blue-600 bg-white">
          <p className="text-[10px] text-zinc-400 uppercase font-bold">Recurring Pipeline MRR</p>
          <p className="text-2xl font-bold font-mono tracking-tight text-blue-700">
            {formatCurrency(
              invoices.filter(i => i.isRecurring).reduce((acc, i) => acc + parseFloat(i.grandTotal || "0"), 0),
              currency
            )}
          </p>
          <p className="text-[10px] text-zinc-500">Monthly contract volume potential</p>
        </div>
      </div>

      {/* RECURRING TEMPLATES TABLE */}
      <div className="card-modern overflow-x-auto bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600 text-[11px]">
              <th className="p-3.5 border-r border-zinc-200">Template Serial</th>
              <th className="p-3.5 border-r border-zinc-200">Client</th>
              <th className="p-3.5 border-r border-zinc-200 text-center">Frequency</th>
              <th className="p-3.5 border-r border-zinc-200 text-right">Cycle Amount</th>
              <th className="p-3.5 border-r border-zinc-200">Next Scheduled Run</th>
              <th className="p-3.5 border-r border-zinc-200 text-center">Status</th>
              <th className="p-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/80 bg-white">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-zinc-50/80 transition-colors">
                <td className="p-3.5 border-r border-zinc-200/80 font-mono">
                  <Link
                    href={`/workspaces/${shopSlug}/documents/${inv.id}`}
                    className="font-bold text-black uppercase hover:underline"
                  >
                    {inv.docNumber} ➔
                  </Link>
                </td>
                <td className="p-3.5 border-r border-zinc-200/80">
                  <span className="font-bold text-xs text-black block uppercase">{inv.clientName}</span>
                  <span className="text-zinc-400 text-[10px] block">{inv.clientEmail}</span>
                </td>
                <td className="p-3.5 border-r border-zinc-200/80 text-center">
                  <span className="badge-zinc text-[10px]">
                    {inv.recurringInterval || "MONTHLY"}
                  </span>
                </td>
                <td className="p-3.5 border-r border-zinc-200/80 text-right font-mono font-bold text-black text-xs">
                  {formatCurrency(parseFloat(inv.grandTotal), inv.currency)}
                </td>
                <td className="p-3.5 border-r border-zinc-200/80">
                  {inv.nextRecurringDate ? (
                    <div>
                      <span className="font-semibold text-black block">
                        {new Date(inv.nextRecurringDate).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {Math.ceil((new Date(inv.nextRecurringDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days away
                      </span>
                    </div>
                  ) : (
                    <span className="text-zinc-400 italic">—</span>
                  )}
                </td>
                <td className="p-3.5 border-r border-zinc-200/80 text-center">
                  <button
                    type="button"
                    onClick={() => handleToggle(inv)}
                    className={`${inv.isRecurring ? "badge-emerald" : "badge-zinc"} cursor-pointer hover:opacity-80 transition-opacity`}
                  >
                    {inv.isRecurring ? "✓ Active" : "⏸ Paused"}
                  </button>
                </td>
                <td className="p-3.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      disabled={generatingId === inv.id}
                      onClick={() => handleGenerateNow(inv)}
                      className="btn-primary-modern px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider disabled:opacity-50 flex items-center gap-1"
                    >
                      {generatingId === inv.id ? (
                        <>
                          <Spinner size={8} color="white" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        "⚡ Issue Now"
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {invoices.length === 0 && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-zinc-400 italic">
                  No recurring invoices registered. To create one, toggle &quot;🔁 Make Recurring&quot; when drafting any customer invoice.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
