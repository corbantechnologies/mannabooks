// src/app/workspaces/[slug]/products/page.tsx
import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { apiClient } from "@/lib/api/client";
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

  // 2. Resolve active tenant context via FastAPI
  const { shop } = await getActiveWorkspaceContext(slug);

  // 3. Fetch products and active stock locations in parallel via FastAPI
  const [itemsRes, locationsRes] = await Promise.all([
    apiClient.get<any[]>(`/v1/items?shop_id=${shop.id}&limit=300`),
    apiClient.get<any[]>(`/v1/items/locations?shop_id=${shop.id}`),
  ]);

  const rawProducts = itemsRes.data || [];
  const locationList = (locationsRes.data || []).map((l: any) => ({
    id: String(l.id),
    name: l.name,
    code: l.code || null,
    address: l.address || null,
    isDefault: Boolean(l.isDefault ?? l.is_default),
    isActive: Boolean(l.isActive ?? l.is_active ?? true),
  }));

  let filteredList = rawProducts.map((p: any) => ({
    id: String(p.id),
    shopId: String(p.shop_id || p.shopId || shop.id),
    name: p.name,
    sku: p.sku || null,
    itemType: p.item_type || p.itemType || "PRODUCT",
    unitPrice: String(p.unit_price ?? p.unitPrice ?? "0.00"),
    costPrice: String(p.cost_price ?? p.costPrice ?? "0.00"),
    defaultTaxType: p.default_tax_type ?? p.defaultTaxType ?? "V_16",
    trackStock: Boolean(p.track_stock ?? p.trackStock),
    stockQuantity: String(p.stock_quantity ?? p.stockQuantity ?? "0.00"),
    reorderThreshold: String(p.reorder_threshold ?? p.reorderThreshold ?? "5.00"),
    itemClsCd: p.item_cls_cd || p.itemClsCd || "24101601",
    pkgUnitCd: p.pkg_unit_cd || p.pkgUnitCd || "PCE",
    defaultLocationId: p.default_location_id || p.defaultLocationId || null,
    createdAt: p.created_at || p.createdAt || new Date().toISOString(),
  }));

  if (taxType && taxType !== "ALL") {
    filteredList = filteredList.filter((p: any) => p.defaultTaxType === taxType);
  }

  if (search && search.trim() !== "") {
    const q = search.toLowerCase().trim();
    filteredList = filteredList.filter(
      (p: any) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
    );
  }

  return (
    <div className="p-5 sm:p-7 space-y-6">
      
      {/* ACTION BLOCK TOP BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs text-zinc-400 font-medium">Inventory &amp; Pricing</span>
          <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Catalog Management</h1>
        </div>

        <div className="flex items-center gap-2.5">
          <CatalogActionsPopover shopSlug={slug} shopName={shop.name} search={search} />
          <ProductFormClientSide
            shopId={shop.id}
            shopSlug={slug}
            locations={locationList}
          />
        </div>
      </div>

      {/* LOW STOCK ALERT BANNER */}
      <LowStockAlertBanner items={filteredList} shopSlug={slug} />

      {/* FILTER CONTROLS */}
      <ProductFilterBar />

      {/* INTERACTIVE DATA TABLE */}
      <ProductsTableClient
        catalogList={filteredList}
        shop={shop}
        shopSlug={slug}
        locations={locationList}
      />
    </div>
  );
}