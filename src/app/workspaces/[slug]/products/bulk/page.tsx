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
    <div className="p-5 sm:p-7 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs text-zinc-400 font-medium">Bulk Provisioning</span>
          <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">
            Bulk Catalog Import
          </h1>
        </div>
        <Link 
          href={`/workspaces/${slug}/products`}
          className="btn-secondary-modern px-4 py-2 font-sans text-xs font-bold text-zinc-400 hover:text-black transition-colors"
        >
          ← Back to Catalog
        </Link>
      </div>

      <BulkProductForm shopId={shop.id} shopSlug={slug} />
    </div>
  );
}
