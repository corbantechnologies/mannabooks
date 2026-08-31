// src/app/workspaces/[slug]/pos/page.tsx
import { db } from "@/db";
import { products, shops } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { WalkInSalesTerminal } from "./WalkInSalesTerminal";
import Link from "next/link";
import { Suspense } from "react";

interface WalkInSalesPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WalkInSalesPage({ params }: WalkInSalesPageProps) {
  // 1. Await params (required in Next.js 15+)
  const { slug } = await params;

  // 2. Resolve active tenant shop
  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) {
    notFound();
  }

  // 3. Fetch active product catalog for instant selection
  const productRegistry = await db.query.products.findMany({
    where: eq(products.shopId, shop.id),
    orderBy: [desc(products.createdAt)],
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl space-y-8 selection:bg-black selection:text-white font-mono text-xs">
      
      {/* PAGE HEADER */}
      <div className="border-b border-zinc-200/80 pb-6 space-y-2">
        <Link
          href={`/workspaces/${slug}/documents`}
          className="text-xs font-sans font-bold text-zinc-400 hover:text-black transition-colors block"
        >
          ← Back to Billing & Invoices
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider block">Walk-in POS Terminal</span>
            <h1 className="text-2xl font-bold uppercase tracking-tight text-black font-sans mt-0.5 flex items-center gap-2">
              <span>⚡ Walk-in Sales (POS Terminal)</span>
            </h1>
            <p className="font-sans text-xs text-zinc-500 mt-1">
              Rapid point-of-sale terminal for counter sales at {shop.name}. Creates official receipts and automatically decrements stock.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 border border-emerald-300 px-3 py-1.5 bg-emerald-50 rounded text-[10px] font-bold text-emerald-900 uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Instant Receipt &amp; Stock Deduction Active</span>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="font-sans text-xs text-zinc-500 p-8 border border-zinc-200 bg-zinc-50 rounded-lg text-center">Loading Point of Sale...</div>}>
        <WalkInSalesTerminal 
          shop={shop}
          shopSlug={slug}
          products={productRegistry}
        />
      </Suspense>
    </div>
  );
}
