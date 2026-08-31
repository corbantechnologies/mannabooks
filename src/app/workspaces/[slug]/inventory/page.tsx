// src/app/workspaces/[slug]/inventory/page.tsx
import { db } from "@/db";
import { shops, stockLedger } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { getInventoryOverview, migrateCatalogToStockLedger, backfillLedgerLocations } from "@/lib/actions/inventory";
import Link from "next/link";

interface InventoryPageProps {
  params: Promise<{ slug: string }>;
}

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
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

const MOVEMENT_TYPE_COLORS: Record<string, string> = {
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

const MOVEMENT_TYPE_LIST = [
  "PURCHASE_RECEIPT",
  "SALE",
  "ADJUSTMENT_IN",
  "ADJUSTMENT_OUT",
  "TRANSFER_OUT",
  "TRANSFER_IN",
  "OPENING_BALANCE",
  "RETURN",
  "VOID"
];

export default async function InventoryOverviewPage({ params }: InventoryPageProps) {
  const { slug } = await params;

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (!shop) notFound();

  const overview = await getInventoryOverview(shop.id);

  // Count ledger entries with missing location (for backfill prompt)
  const nullLocationCount = await db.$count(
    stockLedger,
    and(eq(stockLedger.shopId, shop.id), isNull(stockLedger.locationId))
  );

  return (
    <div className="p-4 sm:p-8 space-y-10 selection:bg-black selection:text-white font-mono text-xs">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/80 pb-6">
        <div>
          <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Inventory Management</span>
          <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Stock Overview</h1>
          <p className="font-sans text-xs text-zinc-600 mt-1">Real-time inventory levels, valuation, and recent movements across all locations.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/workspaces/${slug}/inventory/adjustments`}
            className="border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-black px-4 py-2 font-mono text-xs font-semibold uppercase rounded transition-colors"
          >
            + Adjust Stock
          </Link>
          <Link
            href={`/workspaces/${slug}/inventory/transfers/new`}
            className="bg-black text-white hover:bg-zinc-800 px-4 py-2 font-mono text-xs font-semibold uppercase rounded transition-colors"
          >
            + New Transfer
          </Link>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Products", value: overview.totalProducts.toString(), sub: "in catalog" },
          { label: "Tracked Products", value: overview.totalTrackedProducts.toString(), sub: "with stock tracking" },
          { label: "Stock Value", value: formatCurrency(overview.totalStockValue, shop.currency), sub: "current valuation", highlight: true },
          { label: "Low Stock", value: overview.lowStockCount.toString(), sub: "below reorder point", alert: overview.lowStockCount > 0 },
          { label: "Out of Stock", value: overview.outOfStockCount.toString(), sub: "zero quantity items", danger: overview.outOfStockCount > 0 },
          { label: "Locations", value: overview.totalLocations.toString(), sub: "active locations" },
        ].map((card) => (
          <div
            key={card.label}
            className={`card-modern p-5 space-y-1 ${card.danger ? "border-rose-300 bg-rose-50" : card.alert ? "border-amber-300 bg-amber-50" : ""}`}
          >
            <p className="text-[10px] text-zinc-400 uppercase font-semibold">{card.label}</p>
            <p className={`text-lg font-semibold font-mono tracking-tight ${
              card.danger ? "text-rose-800" : card.alert ? "text-amber-900" : card.highlight ? "text-emerald-700" : "text-black"
            }`}>
              {card.value}
            </p>
            <p className="text-[10px] text-zinc-500 leading-tight">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* QUICK LINKS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: `/workspaces/${slug}/inventory/locations`, title: "Manage Locations", desc: "Add or edit stock locations", icon: "🏭" },
          { href: `/workspaces/${slug}/inventory/adjustments`, title: "Stock Adjustments", desc: "Manual in/out adjustments", icon: "⚖️" },
          { href: `/workspaces/${slug}/inventory/transfers`, title: "Stock Transfers", desc: "Move stock between locations", icon: "🔄" },
          { href: `/workspaces/${slug}/inventory/reports/valuation`, title: "Stock Valuation", desc: "FIFO value by product", icon: "💰" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="card-modern p-5 hover:border-zinc-400 transition-all hover:shadow-md group"
          >
            <div className="text-2xl mb-3">{link.icon}</div>
            <p className="font-sans font-semibold text-sm text-black group-hover:underline underline-offset-2">{link.title}</p>
            <p className="text-[10px] text-zinc-500 mt-1">{link.desc}</p>
          </Link>
        ))}
      </div>

      {/* RECENT STOCK MOVEMENTS */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold uppercase tracking-wider font-sans text-black">Recent Stock Activity</h2>
          <Link href={`/workspaces/${slug}/inventory/reports/movement`} className="text-[10px] text-zinc-500 hover:text-black hover:underline uppercase font-semibold">
            View Full History →
          </Link>
        </div>

        <div className="card-modern overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
                <th className="p-4 border-r border-zinc-200">Date & Time</th>
                <th className="p-4 border-r border-zinc-200">Product</th>
                <th className="p-4 border-r border-zinc-200">Type</th>
                <th className="p-4 border-r border-zinc-200">Location</th>
                <th className="p-4 border-r border-zinc-200 text-right">Qty</th>
                <th className="p-4 text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 bg-white">
              {overview.recentMovements.map((entry: any) => {
                const isOutflow = ["SALE", "ADJUSTMENT_OUT", "TRANSFER_OUT", "VOID"].includes(entry.movementType);
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
                      {entry.product?.sku && <span className="block text-[10px] text-zinc-400 font-mono">{entry.product.sku}</span>}
                    </td>
                    <td className="p-4 border-r border-zinc-200/80">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold uppercase ${MOVEMENT_TYPE_COLORS[entry.movementType] || "bg-zinc-100 text-zinc-500 border-zinc-200"}`}>
                        {MOVEMENT_TYPE_LABELS[entry.movementType] || entry.movementType}
                      </span>
                    </td>
                    <td className="p-4 border-r border-zinc-200/80 text-zinc-600">
                      {entry.location?.name || <span className="text-zinc-400 italic">Default</span>}
                    </td>
                    <td className={`p-4 border-r border-zinc-200/80 font-semibold text-right ${isOutflow ? "text-rose-700" : "text-emerald-700"}`}>
                      {isOutflow ? "-" : "+"}{parseFloat(entry.quantity).toFixed(2)}
                    </td>
                    <td className="p-4 font-semibold text-right text-black">
                      {entry.runningBalance !== null ? parseFloat(entry.runningBalance).toFixed(2) : "—"}
                    </td>
                  </tr>
                );
              })}
              {overview.recentMovements.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-zinc-400 italic font-sans text-xs">
                    No stock movements recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MIGRATION PROMPT if ledger is empty but tracked products exist */}
      {overview.recentMovements.length === 0 && overview.totalTrackedProducts > 0 && (
        <div className="border border-zinc-200 bg-zinc-50 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="font-sans font-bold text-black uppercase text-xs tracking-wide">📦 Populate Stock Ledger</p>
            <p className="font-sans text-xs text-zinc-600 mt-1">
              You have tracked products in your catalog, but no ledger entries. Initialize the ledger and migrate opening balances.
            </p>
          </div>
          <form action={async () => {
            "use server";
            await migrateCatalogToStockLedger(shop.id, slug);
          }}>
            <button
              type="submit"
              className="bg-black hover:bg-zinc-800 text-white font-mono text-[10px] uppercase font-bold px-4 py-2 rounded transition-colors shrink-0"
            >
              Initialize Ledger &rarr;
            </button>
          </form>
        </div>
      )}

      {/* BACKFILL PROMPT — if existing ledger entries have no location */}
      {nullLocationCount > 0 && (
        <div className="border border-blue-200 bg-blue-50/60 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="font-sans font-bold text-blue-900 uppercase text-xs tracking-wide">🔧 Fix Historical Location Data</p>
            <p className="font-sans text-xs text-blue-800 mt-1">
              {nullLocationCount} stock movement{nullLocationCount !== 1 ? "s" : ""} have no location assigned. Backfilling assigns them to your default location and updates per-location stock levels.
            </p>
          </div>
          <form action={async () => {
            "use server";
            await backfillLedgerLocations(shop.id, slug);
          }}>
            <button
              type="submit"
              className="bg-blue-700 hover:bg-blue-800 text-white font-mono text-[10px] uppercase font-bold px-4 py-2 rounded transition-colors shrink-0"
            >
              Fix Location Data →
            </button>
          </form>
        </div>
      )}

      {/* SETUP PROMPT if no locations exist */}
      {overview.totalLocations === 0 && (
        <div className="border border-amber-200 bg-amber-50/60 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="font-sans font-bold text-amber-900 uppercase text-xs tracking-wide">⚠️ No Stock Locations Configured</p>
            <p className="font-sans text-xs text-amber-800 mt-1">
              Create at least one stock location (e.g. "Main Store") to begin tracking inventory movements.
            </p>
          </div>
          <Link
            href={`/workspaces/${slug}/inventory/locations`}
            className="bg-amber-800 hover:bg-amber-900 text-white font-mono text-[10px] uppercase font-bold px-4 py-2 rounded transition-colors shrink-0"
          >
            Setup Locations →
          </Link>
        </div>
      )}
    </div>
  );
}
