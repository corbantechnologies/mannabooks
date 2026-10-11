import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { apiClient } from "@/lib/api/client";
import { StorageBinsClient } from "./StorageBinsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Storage Bins & Shelf Hierarchy | Manna Books",
  description: "Manage warehouse zones, aisles, racks, and shelf storage bins",
};

interface StorageBinsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function StorageBinsPage({ params }: StorageBinsPageProps) {
  const { slug } = await params;
  const { shop } = await getActiveWorkspaceContext(slug);

  const [locationsRes, binsRes] = await Promise.all([
    apiClient.get<any>(`/v1/inventory/locations`, { params: { shop_id: shop.id } }),
    apiClient.get<any>(`/v1/inventory/bins`, { params: { shop_id: shop.id } }),
  ]);
  const locations = locationsRes.data?.locations || (Array.isArray(locationsRes.data) ? locationsRes.data : []);
  const bins = binsRes.data?.bins || (Array.isArray(binsRes.data) ? binsRes.data : []);

  return (
    <div className="p-5 sm:p-7 space-y-6">
      <div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
          Warehouse Management System (WMS)
        </span>
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight font-sans text-black mt-0.5">
          Storage Bins &amp; Shelf Hierarchy
        </h1>
        <p className="text-xs text-zinc-500 font-sans mt-1">
          Map physical storage slots down to the shelf, print QR barcode labels, and organize warehouse picking routes.
        </p>
      </div>

      <StorageBinsClient
        shopId={shop.id}
        shopSlug={shop.slug}
        locations={locations}
        initialBins={bins}
      />
    </div>
  );
}
