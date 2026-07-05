// src/app/workspaces/[slug]/products/bulk/page.tsx
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BulkProductForm } from "./BulkProductForm";
import Link from "next/link";

interface BulkProductsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BulkProductsPage({ params }: BulkProductsPageProps) {
  const { slug } = await params;

  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) {
    notFound();
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/80 pb-6">
        <div>
          <span className="font-mono text-xs text-zinc-400 font-semibold">CATALOG // BULK_PROVISIONING</span>
          <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">
            Bulk Catalog Import
          </h1>
        </div>
        <Link 
          href={`/workspaces/${slug}/products`}
          className="btn-secondary-modern px-4 py-2 font-mono text-xs font-semibold uppercase"
        >
          ← Back to Catalog
        </Link>
      </div>

      <BulkProductForm shopId={shop.id} shopSlug={slug} />
    </div>
  );
}
