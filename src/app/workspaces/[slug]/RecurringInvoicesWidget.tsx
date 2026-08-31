import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { RecurringInvoiceItem } from "@/lib/actions/recurring";

interface RecurringInvoicesWidgetProps {
  slug: string;
  currency: string;
  recurringInvoices: RecurringInvoiceItem[];
}

export function RecurringInvoicesWidget({
  slug,
  currency,
  recurringInvoices,
}: RecurringInvoicesWidgetProps) {
  const activeSeries = recurringInvoices.filter((i) => i.isRecurring);
  const upcomingInvoices = activeSeries
    .filter((i) => i.nextRecurringDate)
    .sort((a, b) => new Date(a.nextRecurringDate!).getTime() - new Date(b.nextRecurringDate!).getTime())
    .slice(0, 4);

  return (
    <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-sm space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🔁</span>
          <div>
            <h3 className="font-sans text-xs font-bold uppercase tracking-tight text-black">
              Upcoming Recurring Invoices
            </h3>
            <p className="text-[10px] text-zinc-400 font-sans">
              {activeSeries.length} active subscription cycles scheduled
            </p>
          </div>
        </div>
        <Link
          href={`/workspaces/${slug}/documents/recurring`}
          className="text-[10px] font-sans font-bold uppercase text-zinc-500 hover:text-black transition-colors"
        >
          Manage All →
        </Link>
      </div>

      <div className="divide-y divide-zinc-100">
        {upcomingInvoices.map((inv) => {
          const daysLeft = inv.nextRecurringDate
            ? Math.ceil((new Date(inv.nextRecurringDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null;

          return (
            <div key={inv.id} className="py-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-black font-sans truncate text-xs">{inv.clientName}</p>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-400">
                  <span className="bg-zinc-100 px-1.5 py-0.2 rounded font-bold uppercase text-[9px] text-zinc-600">
                    {inv.recurringInterval}
                  </span>
                  <span>Due: {inv.nextRecurringDate ? new Date(inv.nextRecurringDate).toLocaleDateString("en-KE", { month: "short", day: "numeric" }) : "—"}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold font-mono text-black">
                  {formatCurrency(parseFloat(inv.grandTotal), inv.currency)}
                </p>
                {daysLeft !== null && (
                  <span className={`text-[9px] font-sans font-semibold ${daysLeft <= 7 ? "text-amber-600 font-bold" : "text-zinc-400"}`}>
                    {daysLeft <= 0 ? "Due today" : `in ${daysLeft} days`}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {upcomingInvoices.length === 0 && (
          <div className="py-6 text-center text-zinc-400 font-sans text-xs italic">
            No upcoming recurring invoices. Enable &quot;Make Recurring&quot; on invoice creation.
          </div>
        )}
      </div>
    </div>
  );
}
