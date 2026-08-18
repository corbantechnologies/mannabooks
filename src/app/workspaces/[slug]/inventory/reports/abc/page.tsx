// src/app/workspaces/[slug]/inventory/reports/abc/page.tsx
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getAbcAnalysis } from "@/lib/actions/inventory";
import { formatCurrency } from "@/lib/utils";

interface Props { params: Promise<{ slug: string }> }

const TIER_STYLES = {
  A: { badge: "bg-emerald-100 text-emerald-900 border-emerald-300", bar: "bg-emerald-600", desc: "Top performers — top 70% of revenue" },
  B: { badge: "bg-blue-100 text-blue-900 border-blue-300", bar: "bg-blue-500", desc: "Mid-range — next 20% of revenue" },
  C: { badge: "bg-zinc-100 text-zinc-600 border-zinc-300", bar: "bg-zinc-400", desc: "Low volume — bottom 10% of revenue" },
};

export default async function AbcAnalysisPage({ params }: Props) {
  const { slug } = await params;
  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (!shop) notFound();

  const products = await getAbcAnalysis(shop.id);

  const aTier = products.filter(p => p.tier === "A");
  const bTier = products.filter(p => p.tier === "B");
  const cTier = products.filter(p => p.tier === "C");
  const totalRevenue = products.reduce((s, p) => s + p.totalRevenue, 0);

  return (
    <div className="p-4 sm:p-8 space-y-10 selection:bg-black selection:text-white font-mono text-xs">

      {/* HEADER */}
      <div className="border-b border-zinc-200/80 pb-6">
        <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Inventory / Reports</span>
        <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">ABC Analysis</h1>
        <p className="font-sans text-xs text-zinc-600 mt-1">
          Products ranked by revenue contribution using the Pareto principle. A = top 70%, B = next 20%, C = remaining 10%.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="card-modern p-16 text-center space-y-3">
          <p className="text-4xl">📊</p>
          <p className="font-sans font-bold text-base text-black">No Sales Data Available</p>
          <p className="font-sans text-xs text-zinc-500">ABC analysis requires stock sales recorded through invoices and receipts.</p>
        </div>
      ) : (
        <>
          {/* TIER SUMMARY CARDS */}
          <div className="grid grid-cols-3 gap-4">
            {(["A", "B", "C"] as const).map((tier) => {
              const tierProducts = tier === "A" ? aTier : tier === "B" ? bTier : cTier;
              const tierRevenue = tierProducts.reduce((s, p) => s + p.totalRevenue, 0);
              const style = TIER_STYLES[tier];
              return (
                <div key={tier} className={`card-modern p-5 space-y-2`}>
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-0.5 rounded-full border font-bold text-sm ${style.badge}`}>Tier {tier}</span>
                    <span className="font-mono font-bold text-xl text-black">{tierProducts.length}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500">{style.desc}</p>
                  <p className="font-semibold text-sm text-black">{formatCurrency(tierRevenue, shop.currency)}</p>
                  <div className="w-full bg-zinc-100 rounded-full h-1.5 mt-2">
                    <div className={`h-1.5 rounded-full ${style.bar}`} style={{ width: `${totalRevenue > 0 ? (tierRevenue / totalRevenue) * 100 : 0}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ABC TABLE */}
          <div className="card-modern overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
                  <th className="p-4 border-r border-zinc-200 text-center">Rank</th>
                  <th className="p-4 border-r border-zinc-200">Product</th>
                  <th className="p-4 border-r border-zinc-200">SKU</th>
                  <th className="p-4 border-r border-zinc-200 text-right">Revenue</th>
                  <th className="p-4 border-r border-zinc-200 text-right">Share %</th>
                  <th className="p-4 border-r border-zinc-200 text-right">Cumulative %</th>
                  <th className="p-4 border-r border-zinc-200 text-center">Tier</th>
                  <th className="p-4">Revenue Bar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 bg-white">
                {products.map((p, idx) => {
                  const style = TIER_STYLES[p.tier];
                  return (
                    <tr key={p.productId} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="p-4 border-r border-zinc-200/80 text-center text-zinc-400 font-bold">{idx + 1}</td>
                      <td className="p-4 border-r border-zinc-200/80 font-sans font-semibold text-black text-sm">{p.name}</td>
                      <td className="p-4 border-r border-zinc-200/80 text-zinc-500 uppercase tracking-wider">
                        {p.sku || <span className="text-zinc-300 font-normal lowercase italic">—</span>}
                      </td>
                      <td className="p-4 border-r border-zinc-200/80 text-right font-semibold text-black">
                        {formatCurrency(p.totalRevenue, shop.currency)}
                      </td>
                      <td className="p-4 border-r border-zinc-200/80 text-right text-zinc-600">
                        {p.revenueShare.toFixed(1)}%
                      </td>
                      <td className="p-4 border-r border-zinc-200/80 text-right text-zinc-600">
                        {p.cumulativeShare.toFixed(1)}%
                      </td>
                      <td className="p-4 border-r border-zinc-200/80 text-center">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${style.badge}`}>
                          {p.tier}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="w-full bg-zinc-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${style.bar}`}
                            style={{ width: `${p.revenueShare}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* METHODOLOGY NOTE */}
          <div className="border border-zinc-200 bg-zinc-50/60 rounded-xl p-5">
            <p className="font-sans text-xs text-zinc-600 leading-relaxed">
              <strong className="text-black">ABC Analysis methodology:</strong> Products are ranked from highest to lowest revenue contribution.
              Tier A products (top 70% of cumulative revenue) are your most valuable items and should receive priority stock management, tighter reorder thresholds, and dedicated supplier relationships.
              Tier C items may be candidates for rationalization or discontinuation.
              Revenue is calculated from SALE movements recorded in the stock ledger.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
