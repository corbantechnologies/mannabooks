import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { getStockLocations } from "@/lib/actions/inventory";
import { getStocktakes } from "@/lib/actions/stocktake";
import { StocktakesClient } from "./StocktakesClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stocktake Audit Wizard | Manna Books",
  description: "Periodic physical inventory counting, blind counts, variance analysis, and ledger reconciliation",
};

interface StocktakesPageProps {
  params: Promise<{ slug: string }>;
}

export default async function StocktakesPage({ params }: StocktakesPageProps) {
  const { slug } = await params;
  const { shop } = await getActiveWorkspaceContext(slug);

  const [stocktakes, locations] = await Promise.all([
    getStocktakes(shop.id),
    getStockLocations(shop.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
          Warehouse Auditing &amp; Control
        </span>
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight font-sans text-black mt-0.5">
          Stocktake Audit Wizard
        </h1>
        <p className="text-xs text-zinc-500 font-sans mt-1">
          Perform cycle counts and full physical inventory audits. Record counted quantities, review variances against system ledger, and post shrinkage adjustments in one click.
        </p>
      </div>

      <StocktakesClient
        shopId={shop.id}
        shopSlug={shop.slug}
        initialStocktakes={stocktakes}
        locations={locations}
      />
    </div>
  );
}
