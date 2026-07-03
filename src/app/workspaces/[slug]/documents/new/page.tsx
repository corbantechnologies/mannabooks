// src/app/workspaces/[slug]/documents/new/page.tsx
import { db } from "@/db";
import { clients, products, shops } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { DocumentBuilderClientForm } from "./DocumentBuilderClientForm";

interface NewDocumentPageProps {
  params: { slug: string };
}

export default async function NewDocumentPage({ params }: NewDocumentPageProps) {
  // 1. Resolve multi-tenant shop criteria
  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, params.slug),
  });

  if (!shop) {
    notFound();
  }

  // 2. Fetch active registries to feed lookup menus
  const clientRegistry = await db.query.clients.findMany({
    where: eq(clients.shopId, shop.id),
    orderBy: [desc(clients.createdAt)],
  });

  const productRegistry = await db.query.products.findMany({
    where: eq(products.shopId, shop.id),
    orderBy: [desc(products.createdAt)],
  });

  return (
    <div className="p-8 max-w-6xl space-y-8 selection:bg-black selection:text-white">
      <div>
        <span className="font-mono text-xs text-zinc-400">COMPILER // TRANSACTION_ENTRY_NODE</span>
        <h1 className="text-3xl font-bold uppercase tracking-tighter mt-1">Generate Document</h1>
      </div>

      <DocumentBuilderClientForm 
        shop={shop}
        clients={clientRegistry}
        products={productRegistry}
      />
    </div>
  );
}