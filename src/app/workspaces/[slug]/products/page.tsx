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
          <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Products & Inventory</span>
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

          {/* Inject interactive creation portal block */}
          <ProductFormClientSide shopId={shop.id} shopSlug={slug} />
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <ProductFilterBar />

      {/* INTERACTIVE DATA LEDGER GRID WITH SELECTION */}
      <ProductsTableClient
        catalogList={catalogList}
        shop={shop}
        shopSlug={slug}
      />

    </div>
  );
}