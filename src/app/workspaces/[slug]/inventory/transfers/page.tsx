// src/app/workspaces/[slug]/inventory/transfers/page.tsx
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getStockTransfers } from "@/lib/actions/stock-transfers";
import Link from "next/link";
import { dispatchStockTransfer, cancelStockTransfer } from "@/lib/actions/stock-transfers";

interface TransfersPageProps {
  params: Promise<{ slug: string }>;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-zinc-100 text-zinc-700 border-zinc-300",
  IN_TRANSIT: "bg-blue-100 text-blue-900 border-blue-300",
  COMPLETED: "bg-emerald-100 text-emerald-900 border-emerald-300",
  CANCELLED: "bg-rose-100 text-rose-700 border-rose-300",
};

export default async function TransfersListPage({ params }: TransfersPageProps) {
  const { slug } = await params;

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (!shop) notFound();

  const transfers = await getStockTransfers(shop.id);

  return (
    <div className="p-4 sm:p-8 space-y-10 selection:bg-black selection:text-white font-mono text-xs">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/80 pb-6">
        <div>
          <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Inventory / Transfers</span>
          <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Stock Transfers</h1>
          <p className="font-sans text-xs text-zinc-600 mt-1">
            Move stock between locations. Transfers create an immutable ledger trail (TRANSFER_OUT → TRANSFER_IN).
          </p>
        </div>
        <Link
          href={`/workspaces/${slug}/inventory/transfers/new`}
          className="bg-black text-white hover:bg-zinc-800 px-4 py-2 font-mono text-xs font-semibold uppercase rounded transition-colors"
        >
          + New Transfer
        </Link>
      </div>

      {/* TRANSFERS TABLE */}
      <div className="card-modern overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
              <th className="p-4 border-r border-zinc-200">Date</th>
              <th className="p-4 border-r border-zinc-200">From</th>
              <th className="p-4 border-r border-zinc-200">To</th>
              <th className="p-4 border-r border-zinc-200">Items</th>
              <th className="p-4 border-r border-zinc-200 text-center">Status</th>
              <th className="p-4 border-r border-zinc-200">Requested By</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/80 bg-white">
            {transfers.map((transfer) => (
              <tr key={transfer.id} className="hover:bg-zinc-50/80 transition-colors">
                <td className="p-4 border-r border-zinc-200/80 text-zinc-500">
                  {new Date(transfer.createdAt).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                </td>
                <td className="p-4 border-r border-zinc-200/80 font-semibold text-black">
                  {transfer.fromLocation?.name || "—"}
                  {transfer.fromLocation?.code && (
                    <span className="block text-[10px] text-zinc-400">{transfer.fromLocation.code}</span>
                  )}
                </td>
                <td className="p-4 border-r border-zinc-200/80 font-semibold text-black">
                  {transfer.toLocation?.name || "—"}
                  {transfer.toLocation?.code && (
                    <span className="block text-[10px] text-zinc-400">{transfer.toLocation.code}</span>
                  )}
                </td>
                <td className="p-4 border-r border-zinc-200/80 text-zinc-600">
                  {transfer.items.length} product{transfer.items.length !== 1 ? "s" : ""}
                  <span className="block text-[10px] text-zinc-400">
                    {transfer.items.slice(0, 2).map(i => i.product?.name).join(", ")}
                    {transfer.items.length > 2 ? `… +${transfer.items.length - 2} more` : ""}
                  </span>
                </td>
                <td className="p-4 border-r border-zinc-200/80 text-center">
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold uppercase ${STATUS_STYLES[transfer.status] || ""}`}>
                    {transfer.status}
                  </span>
                </td>
                <td className="p-4 border-r border-zinc-200/80 text-zinc-600">
                  {transfer.requestedBy?.name || "—"}
                </td>
                <td className="p-4 text-center">
                  <Link
                    href={`/workspaces/${slug}/inventory/transfers/${transfer.id}`}
                    className="border border-zinc-300 px-3 py-1.5 text-[10px] font-semibold uppercase rounded hover:border-black hover:bg-zinc-50 transition-colors inline-block"
                  >
                    {transfer.status === "DRAFT" ? "Edit / Dispatch" :
                     transfer.status === "IN_TRANSIT" ? "Receive Stock" : "View Details"}
                  </Link>
                </td>
              </tr>
            ))}

            {transfers.length === 0 && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-zinc-400 italic font-sans text-xs">
                  No stock transfers recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* LEGEND */}
      <div className="flex flex-wrap gap-3 font-mono text-[10px]">
        {Object.entries(STATUS_STYLES).map(([status, style]) => (
          <span key={status} className={`px-2 py-0.5 rounded border font-semibold uppercase ${style}`}>
            {status.replace("_", " ")}
          </span>
        ))}
        <span className="text-zinc-400 self-center">— Transfer lifecycle stages</span>
      </div>
    </div>
  );
}
