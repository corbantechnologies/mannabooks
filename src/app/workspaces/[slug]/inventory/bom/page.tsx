import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { getStockLocations } from "@/lib/actions/inventory";
import { getBillOfMaterials, getProductionOrders, getWorkspaceProducts } from "@/lib/actions/production";
import { BomClient } from "./BomClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bill of Materials (BOM) & Light Manufacturing | Manna Books",
  description: "Manage multi-component assembly recipes, wastage allowances, and run production orders",
};

interface BomPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BomPage({ params }: BomPageProps) {
  const { slug } = await params;
  const { shop } = await getActiveWorkspaceContext(slug);

  const [boms, orders, locations, products] = await Promise.all([
    getBillOfMaterials(shop.id),
    getProductionOrders(shop.id),
    getStockLocations(shop.id),
    getWorkspaceProducts(shop.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
          Light Manufacturing &amp; Assemblies
        </span>
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight font-sans text-black mt-0.5">
          Bill of Materials (BOM)
        </h1>
        <p className="text-xs text-zinc-500 font-sans mt-1">
          Define multi-component recipes with scrap rates and labor allocations, and execute one-click assembly runs that atomically reconcile raw materials and finished goods.
        </p>
      </div>

      <BomClient
        shopId={shop.id}
        shopSlug={shop.slug}
        initialBoms={boms}
        initialOrders={orders}
        locations={locations}
        products={products}
      />
    </div>
  );
}
