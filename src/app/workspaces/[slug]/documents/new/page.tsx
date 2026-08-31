// src/app/workspaces/[slug]/documents/new/page.tsx
import { db } from "@/db";
import { clients, products, shops, suppliers, shopTerms } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { DocumentBuilderClientForm } from "./DocumentBuilderClientForm";
import Link from "next/link";
import { Suspense } from "react";

import { getShopCurrencies } from "@/lib/actions/currencies";

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

  // 3. Fetch active registries to feed lookup menus
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

  const termsRegistry = await db.query.shopTerms.findMany({
    where: eq(shopTerms.shopId, shop.id),
    orderBy: [asc(shopTerms.displayOrder), asc(shopTerms.createdAt)],
  });

  const currenciesRegistry = await getShopCurrencies(shop.id, shop.currency || "KES");

  return (
    <div className="p-4 sm:p-8 max-w-7xl space-y-8 selection:bg-black selection:text-white font-mono text-xs">
      
      {/* PAGE HEADER WITH BACK LINK */}
      <div className="border-b border-zinc-200/80 pb-6 space-y-2">
        <Link
          href={`/workspaces/${slug}/documents`}
          className="text-xs font-sans font-bold text-zinc-400 hover:text-black transition-colors block"
        >
          ← Back to Billing & Invoices
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider block">Create Transaction</span>
            <h1 className="text-2xl font-bold uppercase tracking-tight text-black font-sans mt-0.5">
              Issue Financial Document
            </h1>
            <p className="font-sans text-xs text-zinc-500 mt-1">
              Create eTIMS compliant invoices, receipts, quotations, purchase orders, and financial vouchers for {shop.name}.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 border border-zinc-300 px-3 py-1.5 bg-zinc-50 rounded text-[10px] font-semibold text-zinc-700 uppercase">
            <span className={`w-2 h-2 rounded-full ${shop.isVatRegistered ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
            <span>{shop.isVatRegistered ? "eTIMS 16% VAT Active" : "Non-VAT Account"}</span>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="font-mono text-xs text-zinc-400 p-8 border border-zinc-200 bg-zinc-50 rounded text-center">&gt; LOADING DOCUMENT COMPILER...</div>}>
        <DocumentBuilderClientForm 
          shop={shop}
          shopSlug={slug}
          clients={clientRegistry}
          suppliers={supplierRegistry}
          products={productRegistry}
          shopTerms={termsRegistry}
          currencies={currenciesRegistry}
        />
      </Suspense>
    </div>
  );
}