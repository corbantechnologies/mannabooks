// src/app/workspaces/[slug]/products/page.tsx
import { db } from "@/db";
import { products, shops, stockLocations } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { ProductFormClientSide } from "./ProductFormClientSide";
import { CatalogActionsPopover } from "./CatalogActionsPopover";
import { ProductFilterBar } from "./ProductFilterBar";
import { ProductsTableClient } from "./ProductsTableClient";
import { LowStockAlertBanner } from "@/components/LowStockAlertBanner";
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
    <div className="p-5 sm:p-7 space-y-6">
      
      {/* ACTION BLOCK TOP BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs text-zinc-400 font-medium">Products &amp; Inventory</span>
          <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Product Catalog</h1>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Inject interactive creation portal block */}
          <ProductFormClientSide shopId={shop.id} shopSlug={slug} locations={locationList} />

          {/* Clean Catalog Options Popover */}
          <CatalogActionsPopover shopSlug={slug} shopName={shop.name} search={search} />
        </div>
      </div>

      {/* LOW STOCK INVENTORY WARNING BANNER (DISMISSIBLE) */}
      <LowStockAlertBanner
        items={catalogList
          .filter(
            (p) => p.itemType === "PRODUCT" && p.trackStock && parseFloat(p.stockQuantity || "0") <= parseFloat(p.reorderThreshold || "5")
          )
          .map((p) => ({
            name: p.name,
            stockQuantity: p.stockQuantity,
            reorderThreshold: p.reorderThreshold,
          }))}
        shopSlug={slug}
        actionHref={`/workspaces/${slug}/inventory`}
        actionLabel="Open Stock Ledger →"
        storageKeyPrefix="manna_dismiss_stock_alert_products"
      />

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