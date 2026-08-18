// src/app/workspaces/[slug]/inventory/transfers/new/page.tsx
import { db } from "@/db";
import { shops, products } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getStockLocations } from "@/lib/actions/inventory";
import { NewTransferForm } from "./NewTransferForm";

interface NewTransferPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewTransferPage({ params }: NewTransferPageProps) {
  const { slug } = await params;

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (!shop) notFound();

  const [locations, trackedProducts] = await Promise.all([
    getStockLocations(shop.id),
    db.query.products.findMany({
      where: and(eq(products.shopId, shop.id), eq(products.trackStock, true)),
      orderBy: (p, { asc }) => [asc(p.name)],
    }),
  ]);

  if (locations.length < 2) {
    return (
      <div className="p-8 text-center font-mono text-xs text-zinc-500">
        <p className="text-sm font-semibold text-black mb-2">⚠️ At Least 2 Locations Required</p>
        <p>You need at least 2 active stock locations to create a transfer. Please add more locations first.</p>
        <a href={`/workspaces/${slug}/inventory/locations`} className="mt-4 inline-block bg-black text-white px-4 py-2 rounded font-bold uppercase text-xs">
          Manage Locations
        </a>
      </div>
    );
  }

  return (
    <NewTransferForm
      shopId={shop.id}
      shopSlug={slug}
      shopCurrency={shop.currency}
      locations={locations}
      trackedProducts={trackedProducts}
    />
  );
}
