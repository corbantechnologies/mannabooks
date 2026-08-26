import { notFound } from "next/navigation";
import { getPublicCatalogData, decodeCatalogToken } from "@/lib/actions/catalog";
import { PublicCatalogClient } from "./PublicCatalogClient";

interface PublicCatalogPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ search?: string; items?: string; token?: string; c?: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await getPublicCatalogData(slug);
  if (!res.success || !res.shop) {
    return { title: "Product Catalog" };
  }
  return {
    title: `${res.shop.name} — Product Catalog & Price List`,
    description: `Browse official products, hardware specifications, and pricing from ${res.shop.name}.`,
  };
}

export default async function PublicCatalogPage({ params, searchParams }: PublicCatalogPageProps) {
  const { slug } = await params;
  const { search, items, token, c } = await searchParams;

  const rawToken = token || c || items;
  let itemIds: string[] | undefined;

  if (rawToken) {
    itemIds = await decodeCatalogToken(rawToken);
  }

  const res = await getPublicCatalogData(slug, search, itemIds);

  if (!res.success || !res.shop) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 selection:bg-black selection:text-white">
      <PublicCatalogClient
        shop={res.shop}
        initialProducts={res.products || []}
        initialSearch={search || ""}
        token={rawToken || ""}
      />
    </div>
  );
}
