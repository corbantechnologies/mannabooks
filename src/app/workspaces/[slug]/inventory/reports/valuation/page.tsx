// src/app/workspaces/[slug]/inventory/reports/valuation/page.tsx
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getStockValuation } from "@/lib/actions/inventory";
import { formatCurrency } from "@/lib/utils";

interface Props { params: Promise<{ slug: string }> }

export default async function StockValuationPage({ params }: Props) {
  const { slug } = await params;
  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (!shop) notFound();

  const rows = await getStockValuation(shop.id);

  const totalValue = rows.reduce((s, r) => s + r.totalValue, 0);
  const lowStockRows = rows.filter(r => r.isLowStock);
  const outOfStockRows = rows.filter(r => r.currentQty <= 0);

  return (
    <div className="p-4 sm:p-8 space-y-10 selection:bg-black selection:text-white font-mono text-xs">

      {/* HEADER */}
      <div className="border-b border-zinc-200/80 pb-6">
        <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Inventory / Reports</span>
        <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Stock Valuation Report</h1>
        <p className="font-sans text-xs text-zinc-600 mt-1">
          Current on-hand inventory valued at weighted average cost. FIFO layers from the stock ledger.
        </p>
      </div>

      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Stock Value", value: formatCurrency(totalValue, shop.currency), highlight: true },
          { label: "Tracked Products", value: rows.length.toString(), sub: "in stock valuation" },
          { label: "Low Stock Items", value: lowStockRows.length.toString(), alert: lowStockRows.length > 0, sub: "at or below reorder point" },
          { label: "Out of Stock", value: outOfStockRows.length.toString(), danger: outOfStockRows.length > 0, sub: "zero quantity items" },
        ].map((card) => (
          <div
            key={card.label}
            className={`card-modern p-5 space-y-1 ${card.danger ? "border-rose-300 bg-rose-50" : card.alert ? "border-amber-300 bg-amber-50" : ""}`}
          >
            <p className="text-[10px] text-zinc-400 uppercase font-semibold">{card.label}</p>
            <p className={`text-xl font-semibold font-mono tracking-tight ${
              card.danger ? "text-rose-800" : card.alert ? "text-amber-900" : card.highlight ? "text-emerald-700" : "text-black"
            }`}>{card.value}</p>
            {card.sub && <p className="text-[10px] text-zinc-500">{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* VALUATION TABLE */}
      <div className="card-modern overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
              <th className="p-4 border-r border-zinc-200">#</th>
              <th className="p-4 border-r border-zinc-200">Product</th>
              <th className="p-4 border-r border-zinc-200">SKU</th>
              <th className="p-4 border-r border-zinc-200">Location</th>
              <th className="p-4 border-r border-zinc-200 text-right">Qty on Hand</th>
              <th className="p-4 border-r border-zinc-200 text-right">Avg Unit Cost</th>
              <th className="p-4 border-r border-zinc-200 text-right">Total Value</th>
              <th className="p-4 text-center">Stock Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/80 bg-white">
            {rows.map((row, idx) => (
              <tr
                key={row.productId}
                className={`hover:bg-zinc-50/80 transition-colors ${row.currentQty <= 0 ? "bg-rose-50/40" : row.isLowStock ? "bg-amber-50/40" : ""}`}
              >
                <td className="p-4 border-r border-zinc-200/80 text-zinc-400">{idx + 1}</td>
                <td className="p-4 border-r border-zinc-200/80 font-sans font-semibold text-black text-sm">
                  {row.productName}
                </td>
                <td className="p-4 border-r border-zinc-200/80 text-zinc-500 uppercase tracking-wider">
                  {row.sku || <span className="text-zinc-300 font-normal lowercase italic">—</span>}
                </td>
                <td className="p-4 border-r border-zinc-200/80 text-zinc-600">{row.locationName}</td>
                <td className="p-4 border-r border-zinc-200/80 text-right font-semibold">
                  <span className={row.currentQty <= 0 ? "text-rose-700" : row.isLowStock ? "text-amber-800" : "text-black"}>
                    {row.currentQty.toFixed(2)}
                  </span>
                  <span className="block text-[10px] text-zinc-400">Reorder at: {row.reorderThreshold.toFixed(2)}</span>
                </td>
                <td className="p-4 border-r border-zinc-200/80 text-right text-zinc-700">
                  {formatCurrency(row.avgUnitCost, shop.currency)}
                </td>
                <td className="p-4 border-r border-zinc-200/80 text-right font-bold text-black">
                  {formatCurrency(row.totalValue, shop.currency)}
                </td>
                <td className="p-4 text-center">
                  {row.currentQty <= 0
                    ? <span className="bg-rose-100 text-rose-900 border-rose-300 border px-2 py-0.5 rounded text-[10px] font-bold uppercase">Out of Stock</span>
                    : row.isLowStock
                    ? <span className="bg-amber-100 text-amber-900 border-amber-300 border px-2 py-0.5 rounded text-[10px] font-bold uppercase">Low Stock</span>
                    : <span className="bg-emerald-100 text-emerald-900 border-emerald-300 border px-2 py-0.5 rounded text-[10px] font-bold uppercase">In Stock</span>
                  }
                </td>
              </tr>
            ))}
            {rows.length > 0 && (
              <tr className="bg-zinc-900 text-white">
                <td colSpan={6} className="p-4 font-semibold uppercase tracking-wider text-right text-sm">Total Stock Value</td>
                <td className="p-4 font-bold text-emerald-400 text-right text-sm">{formatCurrency(totalValue, shop.currency)}</td>
                <td className="p-4" />
              </tr>
            )}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="p-12 text-center text-zinc-400 italic">
                  &gt; NO TRACKED PRODUCTS FOUND. ENABLE STOCK TRACKING ON PRODUCTS TO SEE VALUATION.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
