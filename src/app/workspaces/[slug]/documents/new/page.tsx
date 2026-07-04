// src/app/workspaces/[slug]/documents/new/page.tsx
import { db } from "@/db";
import { clients, products, shops, suppliers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { DocumentBuilderClientForm } from "./DocumentBuilderClientForm";

import { Suspense } from "react";

interface NewDocumentPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewDocumentPage({ params }: NewDocumentPageProps) {
  // 1. Await params (required in Next.js 15+)
  const { slug } = await params;

  // 2. Resolve multi-tenant shop criteria
  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) {
    notFound();
  }

  // 2. Fetch active registries to feed lookup menus
  const clientRegistry = await db.query.clients.findMany({
    where: eq(clients.shopId, shop.id),
    orderBy: [desc(clients.createdAt)],
  });

  const supplierRegistry = await db.query.suppliers.findMany({
    where: eq(suppliers.shopId, shop.id),
    orderBy: [desc(suppliers.createdAt)],
  });

  const productRegistry = await db.query.products.findMany({
    where: eq(products.shopId, shop.id),
    orderBy: [desc(products.createdAt)],
  });

  return (
    <div className="p-8 max-w-6xl space-y-8 selection:bg-black selection:text-white">
      <div>
        <span className="font-mono text-xs text-zinc-400 font-semibold">COMPILER // TRANSACTION_ENTRY_NODE</span>
        <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Generate Document</h1>
      </div>

      <Suspense fallback={<div className="font-mono text-xs text-zinc-400 p-4 border border-black">&gt; LOADING DOCUMENT COMPILER...</div>}>
        <DocumentBuilderClientForm 
          shop={shop}
          shopSlug={slug}
          clients={clientRegistry}
          suppliers={supplierRegistry}
          products={productRegistry}
        />
      </Suspense>
    </div>
  );
}