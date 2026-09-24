import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { getStockLocations } from "@/lib/actions/inventory";
import { getStorageBins } from "@/lib/actions/wms";
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

  const [locations, bins] = await Promise.all([
    getStockLocations(shop.id),
    getStorageBins(shop.id),
  ]);

  return (
    <div className="space-y-6">
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
