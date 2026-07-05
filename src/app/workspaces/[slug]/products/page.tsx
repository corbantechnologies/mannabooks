// src/app/workspaces/[slug]/products/page.tsx
import { db } from "@/db";
import { products, shops } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { ProductFormClientSide } from "./ProductFormClientSide";
import { EditProductModal } from "./EditProductModal";

import { and } from "drizzle-orm";
import { ProductFilterBar } from "./ProductFilterBar";

interface ProductsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    search?: string;
    taxType?: string;
  }>;
}

export default async function WorkspaceProductsPage({ params, searchParams }: ProductsPageProps) {
  // 1. Await params and searchParams (required in Next.js 15+)
  const { slug } = await params;
  const { search, taxType } = await searchParams;

  // 2. Resolve active tenant context on the server
  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) {
    notFound();
  }

  // 3. Query conditions
  const conditions = [eq(products.shopId, shop.id)];
  if (taxType && taxType !== "ALL") {
    conditions.push(eq(products.defaultTaxType, taxType as any));
  }

  let catalogList = await db.query.products.findMany({
    where: and(...conditions),
    orderBy: [desc(products.createdAt)],
  });

  // Client-side text search filter
  if (search && search.trim() !== "") {
    const q = search.toLowerCase().trim();
    catalogList = catalogList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-12 selection:bg-black selection:text-white">
      
      {/* ACTION BLOCK TOP BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/80 pb-6">
        <div>
          <span className="font-mono text-xs text-zinc-400 font-semibold">CATALOG // ITEM_REGISTRY_LEDGER</span>
          <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Product Catalog</h1>
        </div>
        
        {/* Inject interactive creation portal block */}
        <ProductFormClientSide shopId={shop.id} shopSlug={slug} />
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <ProductFilterBar />

      {/* DATA LEDGER GRID */}
      <div className="card-modern overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
              <th className="p-4 border-r border-zinc-200">Item Description</th>
              <th className="p-4 border-r border-zinc-200">Type</th>
              <th className="p-4 border-r border-zinc-200">SKU / Code Reference</th>
              <th className="p-4 border-r border-zinc-200">Selling Price</th>
              <th className="p-4 border-r border-zinc-200">Cost &amp; Profit Margin</th>
              <th className="p-4 border-r border-zinc-200">Stock Inventory Level</th>
              <th className="p-4 border-r border-zinc-200">Default Tax Flag</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/80 bg-white">
            {catalogList.map((p) => {
              const qty = parseFloat(p.stockQuantity || "0");
              const threshold = parseFloat(p.reorderThreshold || "5");
              const sellPrice = parseFloat(p.unitPrice || "0");
              const costPrice = parseFloat(p.costPrice || "0");
              const profitMargin = sellPrice > 0 ? ((sellPrice - costPrice) / sellPrice) * 100 : 0;

              return (
                <tr key={p.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="p-4 border-r border-zinc-200/80 font-sans text-sm font-semibold uppercase tracking-tight text-black">
                    {p.name}
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 font-semibold text-[10px]">
                    {p.itemType === "SERVICE" ? (
                      <span className="bg-zinc-100 text-zinc-800 border border-zinc-300 px-2 py-0.5 rounded uppercase">
                        Service
                      </span>
                    ) : (
                      <span className="bg-blue-50 text-blue-900 border border-blue-200 px-2 py-0.5 rounded uppercase">
                        Product
                      </span>
                    )}
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 text-zinc-500 tracking-wider">
                    {p.sku || <span className="text-zinc-300 italic font-normal lowercase">&gt; unassigned</span>}
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 font-semibold text-sm text-black">
                    {formatCurrency(p.unitPrice, shop.currency)}
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 text-xs">
                    {costPrice > 0 ? (
                      <div>
                        <span className="block text-zinc-500 font-mono text-[10px]">
                          Cost: {formatCurrency(costPrice, shop.currency)}
                        </span>
                        <span className={`font-bold text-[10px] ${profitMargin >= 20 ? "text-emerald-700" : "text-amber-800"}`}>
                          Margin: {profitMargin.toFixed(1)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-400 italic text-[10px]">N/A (Cost 0)</span>
                    )}
                  </td>
                  <td className="p-4 border-r border-zinc-200/80 text-xs">
                    {p.itemType === "SERVICE" || !p.trackStock ? (
                      <span className="text-zinc-400 italic font-normal">Service (Untracked)</span>
                    ) : qty <= 0 ? (
                      <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded font-semibold text-[10px] uppercase">
                        ❌ Out of Stock ({qty})
                      </span>
                    ) : qty <= threshold ? (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-semibold text-[10px] uppercase">
                        ⚠️ Low Stock ({qty} left)
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded font-semibold text-[10px] uppercase">
                        ✓ {qty} in Stock
                      </span>
                    )}
                  </td>
                  <td className="p-4 border-r border-zinc-200/80">
                    <span className={`px-2.5 py-0.5 font-semibold uppercase text-[10px] rounded ${
                      p.defaultTaxType === "V_16" ? "bg-black text-white" :
                      p.defaultTaxType === "V_0" ? "border border-zinc-300 bg-white text-zinc-600 font-semibold" :
                      "bg-zinc-100 text-zinc-400 border border-zinc-200"
                    }`}>
                      {p.defaultTaxType === "V_16" ? "VAT 16%" :
                       p.defaultTaxType === "V_0" ? "Zero Rated" : "Tax Exempt"}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <EditProductModal product={p} shopId={shop.id} shopSlug={slug} />
                  </td>
                </tr>
              );
            })}

            {catalogList.length === 0 && (
              <tr>
                <td colSpan={8} className="p-12 text-center text-zinc-400 italic">
                  &gt; LOOKUP INDEX EMPTY. NO INVENTORY NODES LOCATED.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}