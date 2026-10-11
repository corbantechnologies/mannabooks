// src/app/workspaces/[slug]/suppliers/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { SupplierFormClientSide } from "./SupplierFormClientSide";
import { SupplierFilterBar } from "./SupplierFilterBar";
import { SuppliersTableClient } from "./SuppliersTableClient";

interface SuppliersPageProps {
  params: Promise<{ slug: string }>;
}

export default async function SuppliersPage({ params }: SuppliersPageProps) {
  const { slug } = await params;
  const { shop } = await getActiveWorkspaceContext(slug);

  return (
    <div className="p-5 sm:p-7 space-y-6">
      {/* HEADER + CTA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs text-zinc-400 font-medium">Supplier Registry</span>
          <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Supplier Network</h1>
        </div>

        <SupplierFormClientSide shopId={shop.id} shopSlug={slug} />
      </div>

      {/* SEARCH AND FILTER BAR */}
      <SupplierFilterBar />

      {/* SUPPLIERS DATA TABLE (PURE CLIENT REACT QUERY) */}
      <SuppliersTableClient shopId={shop.id} shopSlug={slug} />
    </div>
  );
}
