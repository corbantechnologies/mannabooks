import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { apiClient } from "@/lib/api/client";
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

  const [bomsRes, ordersRes, locationsRes, productsRes] = await Promise.all([
    apiClient.get<any>(`/v1/inventory/boms`, { params: { shop_id: shop.id } }),
    apiClient.get<any>(`/v1/inventory/production-orders`, { params: { shop_id: shop.id } }),
    apiClient.get<any>(`/v1/inventory/locations`, { params: { shop_id: shop.id } }),
    apiClient.get<any>(`/v1/products`, { params: { shop_id: shop.id } }),
  ]);
  const boms = bomsRes.data?.boms || (Array.isArray(bomsRes.data) ? bomsRes.data : []);
  const orders = ordersRes.data?.orders || (Array.isArray(ordersRes.data) ? ordersRes.data : []);
  const locations = locationsRes.data?.locations || (Array.isArray(locationsRes.data) ? locationsRes.data : []);
  const products = productsRes.data?.products || (Array.isArray(productsRes.data) ? productsRes.data : []);

  return (
    <div className="p-5 sm:p-7 space-y-6">
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
