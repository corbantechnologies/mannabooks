// src/app/workspaces/[slug]/products/page.tsx
import { db } from "@/db";
import { products, shops, stockLocations } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { ProductFormClientSide } from "./ProductFormClientSide";
import { EditProductModal } from "./EditProductModal";

import { ProductFilterBar } from "./ProductFilterBar";
import { ShareCatalogModal } from "./ShareCatalogModal";
import { ProductsTableClient } from "./ProductsTableClient";
import Link from "next/link";

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

  // 4. Fetch products and active stock locations in parallel
  const [catalogList, locationList] = await Promise.all([
    db.query.products.findMany({
      where: and(...conditions),
      orderBy: [desc(products.createdAt)],
    }),
    db.query.stockLocations.findMany({
      where: and(eq(stockLocations.shopId, shop.id), eq(stockLocations.isActive, true)),
      orderBy: [desc(stockLocations.isDefault), desc(stockLocations.createdAt)],
    }),
  ]);

  // Client-side text search filter
  let filteredList = catalogList;
  if (search && search.trim() !== "") {
    const q = search.toLowerCase().trim();
    filteredList = catalogList.filter(
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
          <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Products &amp; Inventory</span>
          <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Product Catalog</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Shareable interactive digital catalog */}
          <ShareCatalogModal shopSlug={slug} shopName={shop.name} />

          <a
            href={`/api/catalog/${slug}/pdf${search ? `?search=${encodeURIComponent(search)}` : ""}`}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-black px-4 py-2 font-mono text-xs font-semibold uppercase rounded transition-colors flex items-center gap-1.5"
            title="Download formatted product rate card PDF"
          >
            <span>📄</span>
            <span>Price PDF</span>
          </a>

          <Link 
            href={`/workspaces/${slug}/products/bulk`}
            className="border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-black px-4 py-2 font-mono text-xs font-semibold uppercase rounded transition-colors"
          >
            Bulk Import
          </Link>

          {/* Inject interactive creation portal block — with locations for stock assignment */}
          <ProductFormClientSide shopId={shop.id} shopSlug={slug} locations={locationList} />
        </div>
      </div>

      {/* LOW STOCK INVENTORY WARNING BANNER */}
      {(() => {
        const lowStockItems = catalogList.filter(
          (p) => p.itemType === "PRODUCT" && p.trackStock && parseFloat(p.stockQuantity || "0") <= parseFloat(p.reorderThreshold || "5")
        );
        if (lowStockItems.length === 0) return null;
        return (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-bold text-amber-900 text-xs uppercase font-mono tracking-wide">
                  Inventory Alert: {lowStockItems.length} Product{lowStockItems.length > 1 ? "s" : ""} Below Reorder Threshold
                </p>
                <p className="text-amber-800 text-xs font-sans mt-0.5">
                  {lowStockItems.slice(0, 3).map((p) => `${p.name} (${parseFloat(p.stockQuantity)} in stock, threshold: ${parseFloat(p.reorderThreshold)})`).join("; ")}
                  {lowStockItems.length > 3 ? ` ...and ${lowStockItems.length - 3} more` : ""}
                </p>
              </div>
            </div>
            <Link
              href={`/workspaces/${slug}/inventory`}
              className="bg-amber-900 hover:bg-amber-950 text-white font-mono text-[10px] uppercase font-bold px-3 py-1.5 rounded transition-colors shrink-0"
            >
              Open Stock Ledger →
            </Link>
          </div>
        );
      })()}

      {/* FILTER & SEARCH CONTROL BAR */}
      <ProductFilterBar />

      {/* INTERACTIVE DATA LEDGER GRID WITH SELECTION */}
      <ProductsTableClient
        catalogList={filteredList}
        shop={shop}
        shopSlug={slug}
        locations={locationList}
      />

    </div>
  );
}