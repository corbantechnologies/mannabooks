// src/app/workspaces/[slug]/crm/deals/new/page.tsx
import { db } from "@/db";
import { shops, clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { NewDealForm } from "./NewDealForm";

interface NewDealPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewDealPage({ params }: NewDealPageProps) {
  const { slug } = await params;

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (!shop) notFound();

  const clientList = await db.query.clients.findMany({
    where: eq(clients.shopId, shop.id),
    columns: { id: true, name: true, email: true },
    orderBy: [clients.name],
  });

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">New Deal</h1>
        <p className="text-sm text-gray-500 mt-0.5">Add a new lead or opportunity to the pipeline.</p>
      </div>
      <NewDealForm
        shopId={shop.id}
        shopSlug={slug}
        clients={clientList}
        currency={shop.currency || "KES"}
        brandColor={shop.primaryColor || "#064e3b"}
      />
    </div>
  );
}
