"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import axiosClient from "@/lib/api/axios";
import { Spinner } from "@/components/Spinner";

interface Props {
  shopId: string;
  shopSlug: string;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-zinc-100 text-zinc-700 border-zinc-300",
  IN_TRANSIT: "bg-blue-100 text-blue-900 border-blue-300",
  COMPLETED: "bg-emerald-100 text-emerald-900 border-emerald-300",
  CANCELLED: "bg-rose-100 text-rose-700 border-rose-300",
};

export function TransfersListClient({ shopId, shopSlug }: Props) {
  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ["inventory", "transfers", shopId],
    queryFn: async () => {
      try {
        const res: any = await axiosClient.get("/items/transfers", { params: { shop_id: shopId } });
        return Array.isArray(res) ? res : res?.transfers || [];
      } catch {
        return [];
      }
    },
    enabled: Boolean(shopId),
  });

  return (
    <div className="p-5 sm:p-7 space-y-6 font-mono text-xs">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs text-zinc-400 font-medium">Inventory / Transfers</span>
          <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Stock Transfers</h1>
          <p className="font-sans text-xs text-zinc-600 mt-1">
            Move stock between locations. Transfers create an immutable ledger trail (TRANSFER_OUT → TRANSFER_IN).
          </p>
        </div>
        <Link
          href={`/workspaces/${shopSlug}/inventory/transfers/new`}
          className="bg-black text-white hover:bg-zinc-800 px-4 py-2 font-mono text-xs font-semibold uppercase rounded transition-colors"
        >
          + New Transfer
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner size={32} />
        </div>
      ) : (
        <>
          {/* TRANSFERS TABLE */}
          <div className="surface overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-wide font-semibold text-zinc-400 bg-zinc-50/60">
                  <th className="px-4 py-3 border-r border-zinc-100">Date</th>
                  <th className="px-4 py-3 border-r border-zinc-100">From</th>
                  <th className="px-4 py-3 border-r border-zinc-100">To</th>
                  <th className="px-4 py-3 border-r border-zinc-100">Items</th>
                  <th className="px-4 py-3 border-r border-zinc-100 text-center">Status</th>
                  <th className="px-4 py-3 border-r border-zinc-100">Requested By</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {transfers.map((transfer: any) => (
                  <tr key={transfer.id} className="hover:bg-zinc-50 transition-colors border-b border-zinc-100/80 last:border-0">
                    <td className="px-4 py-3 border-r border-zinc-100 text-zinc-400">
                      {new Date(transfer.createdAt || transfer.created_at).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                    </td>
                    <td className="p-4 border-r border-zinc-100 font-sans font-semibold text-black">
                      {transfer.fromLocation?.name || transfer.from_location_name || "—"}
                    </td>
                    <td className="p-4 border-r border-zinc-100 font-sans font-semibold text-black">
                      {transfer.toLocation?.name || transfer.to_location_name || "—"}
                    </td>
                    <td className="p-4 border-r border-zinc-100 text-zinc-600">
                      {transfer.items?.length || transfer.item_count || 1} item(s)
                    </td>
                    <td className="p-4 border-r border-zinc-100 text-center">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold uppercase ${STATUS_STYLES[transfer.status] || "bg-zinc-100 text-zinc-600 border-zinc-200"}`}>
                        {transfer.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 border-r border-zinc-100 text-zinc-400">
                      {transfer.requestedBy?.name || transfer.requested_by || "System"}
                    </td>
                    <td className="p-4 text-center">
                      <Link
                        href={`/workspaces/${shopSlug}/inventory/transfers/${transfer.id}`}
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
        </>
      )}
    </div>
  );
}
