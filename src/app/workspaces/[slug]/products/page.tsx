// src/app/workspaces/[slug]/products/page.tsx
import { db } from "@/db";
import { products, shops } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { ProductFormClientSide } from "./ProductFormClientSide";

interface ProductsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceProductsPage({ params }: ProductsPageProps) {
  // 1. Await params (required in Next.js 15+)
  const { slug } = await params;

  // 2. Resolve active tenant context on the server
  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) {
    notFound();
  }

  // 2. Extract catalog items mapped to this specific shop isolation boundary
  const catalogList = await db.query.products.findMany({
    where: eq(products.shopId, shop.id),
    orderBy: [desc(products.createdAt)],
  });

  return (
    <div className="p-8 space-y-12 selection:bg-black selection:text-white">
      
      {/* ACTION BLOCK TOP BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black pb-6">
        <div>
          <span className="font-mono text-xs text-zinc-400">CATALOG // ITEM_REGISTRY_LEDGER</span>
          <h1 className="text-3xl font-bold uppercase tracking-tighter mt-1">Product Catalog</h1>
        </div>
        
        {/* Inject interactive creation portal block */}
        <ProductFormClientSide shopId={shop.id} shopSlug={slug} />
      </div>

      {/* DATA LEDGER GRID */}
      <div className="border border-black bg-white overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-black uppercase tracking-wider font-bold">
              <th className="p-4 border-r border-black">Item Description</th>
              <th className="p-4 border-r border-black">SKU / Code Reference</th>
              <th className="p-4 border-r border-black">Baseline Base Unit Rate</th>
              <th className="p-4">Default Tax Flag Configuration</th>
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
                <td className="p-4">
                  <span className={`px-2 py-0.5 font-bold uppercase text-[10px] ${
                    p.defaultTaxType === "V_16" ? "bg-black text-white" :
                    p.defaultTaxType === "V_0" ? "border border-zinc-400 bg-white text-zinc-600" :
                    "bg-zinc-100 text-zinc-400 border border-transparent border-dashed"
                  }`}>
                    {p.defaultTaxType === "V_16" ? "VAT 16%" :
                     p.defaultTaxType === "V_0" ? "Zero Rated" : "Tax Exempt"}
                  </span>
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