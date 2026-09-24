import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { getExpiryRiskReport, getStorageBins } from "@/lib/actions/wms";
import { getStockLocations } from "@/lib/actions/inventory";
import { getWorkspaceProducts } from "@/lib/actions/production";
import { ExpiryRiskClient } from "./ExpiryRiskClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Batch & Expiry Risk (FEFO) | Manna Books",
  description: "Track inventory expiration dates and batch valuation at risk",
};

interface ExpiryReportPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ExpiryReportPage({ params }: ExpiryReportPageProps) {
  const { slug } = await params;
  const { shop } = await getActiveWorkspaceContext(slug);

  const [report, productsList, locations, bins] = await Promise.all([
    getExpiryRiskReport(shop.id),
    getWorkspaceProducts(shop.id),
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
          Batch &amp; Expiry Risk (FEFO)
        </h1>
        <p className="text-xs text-zinc-500 font-sans mt-1">
          Monitor batches nearing expiry across warehouse shelves to prevent inventory write-offs using First Expired, First Out allocation.
        </p>
      </div>

      <ExpiryRiskClient
        shopId={shop.id}
        shopSlug={shop.slug}
        currency={shop.currency || "KES"}
        report={report}
        products={productsList}
        locations={locations}
        bins={bins}
      />
    </div>
  );
}
