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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black pb-6">
        <div>
          <span className="font-mono text-xs text-zinc-400">CATALOG // ITEM_REGISTRY_LEDGER</span>
          <h1 className="text-3xl font-bold uppercase tracking-tighter mt-1">Product Catalog</h1>
        </div>
        
        {/* Inject interactive creation portal block */}
        <ProductFormClientSide shopId={shop.id} shopSlug={slug} />
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <ProductFilterBar />

      {/* DATA LEDGER GRID */}
      <div className="border border-black bg-white overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-black uppercase tracking-wider font-bold">
              <th className="p-4 border-r border-black">Item Description</th>
              <th className="p-4 border-r border-black">SKU / Code Reference</th>
              <th className="p-4 border-r border-black">Baseline Base Unit Rate</th>
              <th className="p-4 border-r border-black">Default Tax Flag Configuration</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {catalogList.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                <td className="p-4 border-r border-black font-sans text-sm font-bold uppercase tracking-tight">
                  {p.name}
                </td>
                <td className="p-4 border-r border-black text-zinc-500 tracking-wider">
                  {p.sku || <span className="text-zinc-300 italic font-normal lowercase">&gt; unassigned</span>}
                </td>
                <td className="p-4 border-r border-black font-bold text-sm text-black">
                  {formatCurrency(p.unitPrice, shop.currency)}
                </td>
                <td className="p-4 border-r border-black">
                  <span className={`px-2 py-0.5 font-bold uppercase text-[10px] ${
                    p.defaultTaxType === "V_16" ? "bg-black text-white" :
                    p.defaultTaxType === "V_0" ? "border border-zinc-400 bg-white text-zinc-600" :
                    "bg-zinc-100 text-zinc-400 border border-transparent border-dashed"
                  }`}>
                    {p.defaultTaxType === "V_16" ? "VAT 16%" :
                     p.defaultTaxType === "V_0" ? "Zero Rated" : "Tax Exempt"}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <EditProductModal product={p} shopId={shop.id} shopSlug={slug} />
                </td>
              </tr>
            ))}

            {catalogList.length === 0 && (
              <tr>
                <td colSpan={4} className="p-12 text-center text-zinc-400 italic">
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