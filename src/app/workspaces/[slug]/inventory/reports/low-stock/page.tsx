// src/app/workspaces/[slug]/inventory/reports/low-stock/page.tsx
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getLowStockProducts } from "@/lib/actions/inventory";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface Props { params: Promise<{ slug: string }> }

export default async function LowStockPage({ params }: Props) {
  const { slug } = await params;
  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (!shop) notFound();

  const lowStockProducts = await getLowStockProducts(shop.id);
  const outOfStock = lowStockProducts.filter(p => parseFloat(p.stockQuantity) <= 0);
  const critical = lowStockProducts.filter(p => parseFloat(p.stockQuantity) > 0 && parseFloat(p.stockQuantity) <= parseFloat(p.reorderThreshold) / 2);
  const reorderNeeded = lowStockProducts.filter(p => parseFloat(p.stockQuantity) > parseFloat(p.reorderThreshold) / 2 && parseFloat(p.stockQuantity) <= parseFloat(p.reorderThreshold));

  return (
    <div className="p-4 sm:p-8 space-y-10 selection:bg-black selection:text-white font-mono text-xs">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/80 pb-6">
        <div>
          <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Inventory / Reports</span>
          <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Low Stock Alerts</h1>
          <p className="font-sans text-xs text-zinc-600 mt-1">
            Products at or below their reorder threshold requiring immediate attention.
          </p>
        </div>
        <Link
          href={`/workspaces/${slug}/inventory/adjustments`}
          className="bg-black text-white hover:bg-zinc-800 px-4 py-2 font-mono text-xs font-semibold uppercase rounded transition-colors"
        >
          + Adjust Stock
        </Link>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-modern p-5 border-rose-300 bg-rose-50 space-y-1">
          <p className="text-[10px] text-rose-600 uppercase font-semibold">⛔ Out of Stock</p>
          <p className="text-2xl font-semibold font-mono text-rose-900">{outOfStock.length}</p>
          <p className="text-[10px] text-rose-700">Zero quantity — cannot fulfill orders</p>
        </div>
        <div className="card-modern p-5 border-amber-300 bg-amber-50 space-y-1">
          <p className="text-[10px] text-amber-700 uppercase font-semibold">⚠️ Critical</p>
          <p className="text-2xl font-semibold font-mono text-amber-900">{critical.length}</p>
          <p className="text-[10px] text-amber-700">Below 50% of reorder threshold</p>
        </div>
        <div className="card-modern p-5 border-yellow-300 bg-yellow-50 space-y-1">
          <p className="text-[10px] text-yellow-700 uppercase font-semibold">🔔 Reorder Now</p>
          <p className="text-2xl font-semibold font-mono text-yellow-900">{reorderNeeded.length}</p>
          <p className="text-[10px] text-yellow-700">At or below reorder threshold</p>
        </div>
      </div>

      {lowStockProducts.length === 0 ? (
        <div className="card-modern p-16 text-center space-y-3">
          <p className="text-4xl">✅</p>
          <p className="font-sans font-bold text-base text-black">All Stock Levels Healthy</p>
          <p className="font-sans text-xs text-zinc-500">No products are currently below their reorder thresholds.</p>
        </div>
      ) : (
        <div className="card-modern overflow-x-auto">
          <div className="border-b border-zinc-200 px-5 py-3 bg-zinc-50/80">
            <h2 className="font-sans font-bold text-sm uppercase tracking-tight">
              {lowStockProducts.length} Product{lowStockProducts.length !== 1 ? "s" : ""} Requiring Attention
            </h2>
          </div>
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
                <th className="p-4 border-r border-zinc-200">Product</th>
                <th className="p-4 border-r border-zinc-200">SKU</th>
                <th className="p-4 border-r border-zinc-200 text-right">Current Qty</th>
                <th className="p-4 border-r border-zinc-200 text-right">Reorder At</th>
                <th className="p-4 border-r border-zinc-200 text-right">Deficit</th>
                <th className="p-4 border-r border-zinc-200 text-right">Cost Price</th>
                <th className="p-4 text-center">Alert Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 bg-white">
              {lowStockProducts.map((p) => {
                const qty = parseFloat(p.stockQuantity);
                const threshold = parseFloat(p.reorderThreshold);
                const deficit = Math.max(0, threshold - qty);
                const isOut = qty <= 0;
                const isCritical = qty > 0 && qty <= threshold / 2;

                return (
                  <tr key={p.id} className={`hover:bg-zinc-50/80 transition-colors ${isOut ? "bg-rose-50/50" : isCritical ? "bg-amber-50/30" : "bg-yellow-50/20"}`}>
                    <td className="p-4 border-r border-zinc-200/80 font-sans font-semibold text-black text-sm">{p.name}</td>
                    <td className="p-4 border-r border-zinc-200/80 text-zinc-500 uppercase tracking-wider">
                      {p.sku || <span className="text-zinc-300 font-normal lowercase italic">—</span>}
                    </td>
                    <td className={`p-4 border-r border-zinc-200/80 font-bold text-right ${isOut ? "text-rose-700" : isCritical ? "text-amber-800" : "text-yellow-800"}`}>
                      {qty.toFixed(2)}
                    </td>
                    <td className="p-4 border-r border-zinc-200/80 text-right text-zinc-600">{threshold.toFixed(2)}</td>
                    <td className="p-4 border-r border-zinc-200/80 text-right font-semibold text-rose-700">
                      {deficit > 0 ? `-${deficit.toFixed(2)}` : "—"}
                    </td>
                    <td className="p-4 border-r border-zinc-200/80 text-right text-zinc-600">
                      {formatCurrency(p.costPrice, shop.currency)}
                    </td>
                    <td className="p-4 text-center">
                      {isOut
                        ? <span className="bg-rose-100 text-rose-900 border-rose-300 border px-2 py-0.5 rounded text-[10px] font-bold uppercase">Out of Stock</span>
                        : isCritical
                        ? <span className="bg-amber-100 text-amber-900 border-amber-300 border px-2 py-0.5 rounded text-[10px] font-bold uppercase">Critical</span>
                        : <span className="bg-yellow-100 text-yellow-900 border-yellow-300 border px-2 py-0.5 rounded text-[10px] font-bold uppercase">Reorder Now</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
