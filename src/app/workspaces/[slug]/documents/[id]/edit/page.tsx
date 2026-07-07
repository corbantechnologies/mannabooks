import { db } from "@/db";
import { clients, products, shops, suppliers, documents } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { DocumentBuilderClientForm } from "../../new/DocumentBuilderClientForm";
import Link from "next/link";
import { Suspense } from "react";

interface EditDocumentPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function EditDocumentPage({ params }: EditDocumentPageProps) {
  // 1. Await params
  const { slug, id } = await params;

  // 2. Resolve shop
  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) {
    notFound();
  }

  // 3. Fetch target document
  const doc = await db.query.documents.findFirst({
    where: and(eq(documents.id, id), eq(documents.shopId, shop.id)),
    with: {
      items: true,
    },
  });

  if (!doc) {
    notFound();
  }

  // Statutory Audit Protection: Block modifying non-drafts
  if (doc.status !== "DRAFT") {
    notFound();
  }

  // 4. Fetch active registries to feed lookup menus
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
    <div className="p-4 sm:p-8 max-w-7xl space-y-8 selection:bg-black selection:text-white font-mono text-xs">
      
      {/* PAGE HEADER WITH BACK LINK */}
      <div className="border-b border-zinc-200/80 pb-6 space-y-2">
        <Link
          href={`/workspaces/${slug}/documents/${doc.id}`}
          className="text-xs font-semibold text-zinc-400 hover:text-black transition-colors block"
        >
          ← BACK TO {doc.docNumber}
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">COMPILER // TRANSACTION_MUTATOR</span>
            <h1 className="text-2xl font-bold uppercase tracking-tight text-black font-sans mt-0.5">
              Edit Draft {doc.docNumber}
            </h1>
            <p className="font-sans text-xs text-zinc-500 mt-1">
              Modify elements of this draft transaction ledger for {shop.name}.
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
          initialDocument={doc}
        />
      </Suspense>
    </div>
  );
}
