"use client";

import { useState, useTransition } from "react";
import { importB2BInvoiceAsExpenseAction } from "@/lib/actions/b2b";
import { formatCurrency } from "@/lib/utils";
import { Spinner } from "@/components/Spinner";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface B2BDocument {
  id: string;
  docNumber: string;
  type: string;
  status: string;
  grandTotal: string;
  currency: string | null;
  issueDate: Date;
  portalToken: string | null;
  shop: {
    name: string;
    currency: string;
  };
}

interface B2BInboxClientProps {
  shopId: string;
  shopSlug: string;
  shopName: string;
  shopTaxPin: string | null;
  initialBills: B2BDocument[];
  initialOrders: B2BDocument[];
}

export function B2BInboxClient({
  shopId,
  shopSlug,
  shopName,
  shopTaxPin,
  initialBills,
  initialOrders,
}: B2BInboxClientProps) {
  const [activeTab, setActiveTab] = useState<"BILLS" | "ORDERS">("BILLS");
  const [isPending, startTransition] = useTransition();
  const [loggedExpenseIds, setLoggedExpenseIds] = useState<string[]>([]);

  const handleLogAsExpense = (doc: B2BDocument) => {
    startTransition(async () => {
      const res = await importB2BInvoiceAsExpenseAction(doc.id, shopId, shopSlug);
      if (res.success) {
        toast.success(`Invoice ${doc.docNumber} imported successfully as expense!`);
        setLoggedExpenseIds((prev) => [...prev, doc.id]);
      } else {
        toast.error(res.error || "Failed to import invoice.");
      }
    });
  };

  const currentList = activeTab === "BILLS" ? initialBills : initialOrders;

  return (
    <div className="space-y-8 font-mono text-xs text-left">
      
      {/* WARNING BANNER FOR MISSING TAX PIN */}
      {!shopTaxPin && (
        <div className="border border-amber-200 bg-amber-50/50 p-4 rounded-md space-y-2">
          <h3 className="font-bold text-amber-900 uppercase">Warning: KRA PIN Missing</h3>
          <p className="text-amber-800 leading-relaxed font-sans">
            Your workspace tax identification number is not configured in settings. Automated B2B routing matches document recipients using your KRA Tax PIN. Please configure it in your Settings to ensure documents sent to you arrive here.
          </p>
          <Link
            href={`/workspaces/${shopSlug}/settings`}
            className="text-amber-900 underline font-semibold uppercase hover:no-underline inline-block mt-1"
          >
            Configure Tax PIN ➔
          </Link>
        </div>
      )}

      {/* INBOX METRIC CARDS */}
      <div className="card-modern divide-y md:divide-y-0 md:divide-x divide-zinc-200/80 bg-white grid grid-cols-1 md:grid-cols-2">
        <div className="p-6 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Incoming Bills &amp; Quotes</p>
          <p className="text-xl font-semibold text-black tracking-tight font-sans">
            {initialBills.length} Documents Received
          </p>
          <p className="text-[10px] text-zinc-500">Invoices, quotes, and receipts sent to your PIN/Email.</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="text-[10px] text-zinc-400 uppercase font-semibold">Incoming Purchase Orders</p>
          <p className="text-xl font-semibold text-black tracking-tight font-sans">
            {initialOrders.length} Orders Received
          </p>
          <p className="text-[10px] text-zinc-500">Local Purchase Orders (LPOs) matching your supplier credentials.</p>
        </div>
      </div>

      {/* TAB SELECTOR HEADER */}
      <div className="card-modern bg-white overflow-hidden">
        <div className="flex border-b border-zinc-200/80 bg-zinc-50">
          <button
            type="button"
            onClick={() => setActiveTab("BILLS")}
            className={`flex-1 py-4 text-center font-sans text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === "BILLS"
                ? "border-black text-black bg-white"
                : "border-transparent text-zinc-400 hover:text-zinc-600"
            }`}
          >
            Incoming Bills &amp; Quotes ({initialBills.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ORDERS")}
            className={`flex-1 py-4 text-center font-sans text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === "ORDERS"
                ? "border-black text-black bg-white"
                : "border-transparent text-zinc-400 hover:text-zinc-600"
            }`}
          >
            Incoming Purchase Orders ({initialOrders.length})
          </button>
        </div>

        {/* DOCUMENTS LIST */}
        <div className="p-6">
          {currentList.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <p className="font-semibold uppercase tracking-wider">&gt; No incoming documents found</p>
              <p className="text-[10px] font-sans mt-1">Automatic B2B routing will list documents here once matched.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200/80">
              {currentList.map((doc) => {
                const isLogged = loggedExpenseIds.includes(doc.id);
                const hasPortal = !!doc.portalToken;

                return (
                  <div
                    key={doc.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-zinc-50/50 px-2 transition-colors rounded"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-black text-sm uppercase font-sans">
                          {doc.docNumber}
                        </span>
                        <span className="bg-black text-white text-[9px] font-mono px-2 py-0.5 uppercase tracking-wide rounded">
                          {doc.type}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-semibold uppercase">
                          FROM: {doc.shop.name}
                        </span>
                      </div>
                      <p className="text-zinc-500 font-sans text-[11px] leading-tight">
                        Issued Date: {new Date(doc.issueDate).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right shrink-0">
                        <span className="text-xs text-zinc-400 block font-semibold uppercase">Grand Total</span>
                        <span className="text-sm font-semibold text-black font-mono">
                          {formatCurrency(parseFloat(doc.grandTotal), doc.currency || doc.shop.currency)}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {hasPortal && (
                          <Link
                            href={`/portal/invoice/${doc.portalToken}`}
                            target="_blank"
                            className="border border-zinc-300 px-3 py-1.5 bg-white hover:bg-zinc-50 font-semibold uppercase rounded text-zinc-700 hover:text-black transition-colors"
                          >
                            View
                          </Link>
                        )}

                        {activeTab === "BILLS" && doc.type === "INVOICE" && (
                          <button
                            type="button"
                            onClick={() => handleLogAsExpense(doc)}
                            disabled={isPending || isLogged}
                            className={`px-3 py-1.5 font-semibold uppercase rounded flex items-center justify-center gap-1.5 transition-colors ${
                              isLogged
                                ? "bg-zinc-100 text-zinc-400 border border-zinc-200"
                                : "btn-primary-modern bg-black text-white hover:bg-zinc-800 border-none"
                            }`}
                          >
                            {isPending ? (
                              <>
                                <Spinner size={8} color="white" />
                                <span>Importing...</span>
                              </>
                            ) : isLogged ? (
                              "✓ Logged as Expense"
                            ) : (
                              "Log as Expense"
                            )}
                          </button>
                        )}

                        {activeTab === "ORDERS" && (
                          <Link
                            href={`/workspaces/${shopSlug}/documents/new?sourceDocId=${doc.id}`}
                            className="btn-primary-modern bg-emerald-600 hover:bg-emerald-500 text-white border-none px-3 py-1.5 font-semibold uppercase rounded"
                          >
                            Process Order ➔
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
