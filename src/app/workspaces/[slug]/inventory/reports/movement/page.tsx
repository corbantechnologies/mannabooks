// src/app/workspaces/[slug]/inventory/reports/movement/page.tsx
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getStockLedger, getStockLocations } from "@/lib/actions/inventory";

interface Props { params: Promise<{ slug: string }> }

const MOVEMENT_LABELS: Record<string, string> = {
  PURCHASE_RECEIPT: "Purchase Receipt",
  SALE: "Sale",
  ADJUSTMENT_IN: "Adjustment In",
  ADJUSTMENT_OUT: "Adjustment Out",
  TRANSFER_OUT: "Transfer Out",
  TRANSFER_IN: "Transfer In",
  OPENING_BALANCE: "Opening Balance",
  RETURN: "Return",
  VOID: "Void",
};

const MOVEMENT_COLORS: Record<string, string> = {
  PURCHASE_RECEIPT: "bg-emerald-100 text-emerald-900 border-emerald-300",
  SALE: "bg-rose-100 text-rose-900 border-rose-300",
  ADJUSTMENT_IN: "bg-blue-100 text-blue-900 border-blue-300",
  ADJUSTMENT_OUT: "bg-amber-100 text-amber-900 border-amber-300",
  TRANSFER_OUT: "bg-purple-100 text-purple-900 border-purple-300",
  TRANSFER_IN: "bg-indigo-100 text-indigo-900 border-indigo-300",
  OPENING_BALANCE: "bg-zinc-100 text-zinc-700 border-zinc-300",
  RETURN: "bg-cyan-100 text-cyan-900 border-cyan-300",
  VOID: "bg-zinc-100 text-zinc-400 border-zinc-200",
};

const OUTFLOW_TYPES = ["SALE", "ADJUSTMENT_OUT", "TRANSFER_OUT", "VOID"];

export default async function MovementHistoryPage({ params }: Props) {
  const { slug } = await params;
  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (!shop) notFound();

  const [ledger, locations] = await Promise.all([
    getStockLedger(shop.id, { limit: 200 }),
    getStockLocations(shop.id),
  ]);

  return (
    <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white font-mono text-xs">

      {/* HEADER */}
      <div className="border-b border-zinc-200/80 pb-6">
        <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Inventory / Reports</span>
        <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Stock Movement History</h1>
        <p className="font-sans text-xs text-zinc-600 mt-1">
          Full immutable audit trail of every stock movement — sales, receipts, adjustments, and transfers. Showing last 200 entries.
        </p>
      </div>

      {/* TYPE LEGEND */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(MOVEMENT_LABELS).map(([type, label]) => (
          <span key={type} className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${MOVEMENT_COLORS[type]}`}>
            {label}
          </span>
        ))}
      </div>

      {/* LEDGER TABLE */}
      <div className="card-modern overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
              <th className="p-4 border-r border-zinc-200">Date & Time</th>
              <th className="p-4 border-r border-zinc-200">Product</th>
              <th className="p-4 border-r border-zinc-200 text-center">Type</th>
              <th className="p-4 border-r border-zinc-200">Location</th>
              <th className="p-4 border-r border-zinc-200 text-right">Qty</th>
              <th className="p-4 border-r border-zinc-200 text-right">Unit Cost</th>
              <th className="p-4 border-r border-zinc-200 text-right">Balance After</th>
              <th className="p-4">Ref / Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/80 bg-white">
            {ledger.map((entry: any) => {
              const isOutflow = OUTFLOW_TYPES.includes(entry.movementType);
              return (
                <tr key={entry.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="p-4 border-r border-zinc-200/80 text-zinc-500">
                    {new Date(entry.createdAt).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                    <span className="block text-[10px] text-zinc-400">
                      {new Date(entry.createdAt).toLocaleTimeString("en-KE", { timeStyle: "short" })}
                    </span>
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 font-sans font-semibold text-black text-sm">
                    {entry.product?.name || "—"}
                    {entry.product?.sku && (
                      <span className="block text-[10px] text-zinc-400 font-mono">{entry.product.sku}</span>
                    )}
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 text-center">
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold uppercase ${MOVEMENT_COLORS[entry.movementType] || ""}`}>
                      {MOVEMENT_LABELS[entry.movementType] || entry.movementType}
                    </span>
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 text-zinc-600">
                    {entry.location?.name || <span className="text-zinc-400 italic">Default</span>}
                  </td>
                  <td className={`p-4 border-r border-zinc-200/80 font-semibold text-right ${isOutflow ? "text-rose-700" : "text-emerald-700"}`}>
                    {isOutflow ? "-" : "+"}{parseFloat(entry.quantity).toFixed(2)}
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 text-right text-zinc-600">
                    {parseFloat(entry.unitCost) > 0 ? `${parseFloat(entry.unitCost).toFixed(2)}` : "—"}
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 font-semibold text-right text-black">
                    {entry.runningBalance !== null ? parseFloat(entry.runningBalance).toFixed(2) : "—"}
                  </td>
                  <td className="p-4 text-zinc-500 text-[10px] leading-relaxed">
                    {entry.adjustmentReason && (
                      <span className="block text-zinc-600">{entry.adjustmentReason.replace(/_/g, " ")}</span>
                    )}
                    {entry.notes && <span className="italic">{entry.notes}</span>}
                    {entry.sourceDocument && (
                      <span className="block text-zinc-400">Doc: {entry.sourceDocument.serialNumber || entry.sourceDocumentId}</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {ledger.length === 0 && (
              <tr>
                <td colSpan={8} className="p-12 text-center text-zinc-400 italic font-sans text-xs">
                  No stock movements recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
