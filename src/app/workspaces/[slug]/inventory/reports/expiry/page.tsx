import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { apiClient } from "@/lib/api/client";
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

  const [reportRes, productsRes, locationsRes, binsRes] = await Promise.all([
    apiClient.get<any>(`/v1/inventory/reports/expiry`, { params: { shop_id: shop.id } }),
    apiClient.get<any>(`/v1/products`, { params: { shop_id: shop.id } }),
    apiClient.get<any>(`/v1/inventory/locations`, { params: { shop_id: shop.id } }),
    apiClient.get<any>(`/v1/inventory/bins`, { params: { shop_id: shop.id } }),
  ]);
  const report = reportRes.data?.report || reportRes.data || { totalValuationAtRisk: 0, items: [] };
  const productsList = productsRes.data?.products || (Array.isArray(productsRes.data) ? productsRes.data : []);
  const locations = locationsRes.data?.locations || (Array.isArray(locationsRes.data) ? locationsRes.data : []);
  const bins = binsRes.data?.bins || (Array.isArray(binsRes.data) ? binsRes.data : []);

  return (
    <div className="p-5 sm:p-7 space-y-6">
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
