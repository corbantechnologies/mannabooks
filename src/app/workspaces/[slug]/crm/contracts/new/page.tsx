// src/app/workspaces/[slug]/crm/contracts/new/page.tsx
import { db } from "@/db";
import { shops, clients, deals } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { NewContractForm } from "./NewContractForm";

interface NewContractPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ dealId?: string }>;
}

export default async function NewContractPage({ params, searchParams }: NewContractPageProps) {
  const { slug } = await params;
  const { dealId } = await searchParams;

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (!shop) notFound();

  const [clientList, dealList] = await Promise.all([
    db.query.clients.findMany({
      where: eq(clients.shopId, shop.id),
      columns: { id: true, name: true },
      orderBy: [clients.name],
    }),
    db.query.deals.findMany({
      where: eq(deals.shopId, shop.id),
      columns: { id: true, title: true, stage: true },
      orderBy: [deals.updatedAt],
    }),
  ]);

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">New Contract / SLA</h1>
        <p className="text-sm text-gray-500 mt-0.5">Set up a retainer, SLA, or recurring service agreement.</p>
      </div>
      <NewContractForm
        shopId={shop.id}
        shopSlug={slug}
        clients={clientList}
        deals={dealList}
        currency={shop.currency || "KES"}
        brandColor={shop.primaryColor || "#064e3b"}
        initialDealId={dealId}
      />
    </div>
  );
}
