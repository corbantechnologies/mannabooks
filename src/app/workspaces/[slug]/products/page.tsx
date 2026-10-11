// src/app/workspaces/[slug]/products/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { ProductFormClientSide } from "./ProductFormClientSide";
import { CatalogActionsPopover } from "./CatalogActionsPopover";
import { ProductFilterBar } from "./ProductFilterBar";
import { ProductsTableClient } from "./ProductsTableClient";

interface ProductsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceProductsPage({ params }: ProductsPageProps) {
  const { slug } = await params;
  const { shop } = await getActiveWorkspaceContext(slug);

  return (
    <div className="p-5 sm:p-7 space-y-6">
      {/* ACTION BLOCK TOP BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs text-zinc-400 font-medium">Inventory &amp; Pricing</span>
          <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Catalog Management</h1>
        </div>

        <div className="flex items-center gap-2.5">
          <CatalogActionsPopover shopSlug={slug} shopName={shop.name} />
          <ProductFormClientSide
            shopId={shop.id}
            shopSlug={slug}
          />
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <ProductFilterBar />

      {/* INTERACTIVE DATA TABLE (PURE CLIENT REACT QUERY) */}
      <ProductsTableClient
        shop={shop}
        shopSlug={slug}
      />
    </div>
  );
}