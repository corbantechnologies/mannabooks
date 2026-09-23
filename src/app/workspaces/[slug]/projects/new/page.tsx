// src/app/workspaces/[slug]/projects/new/page.tsx
import { db } from "@/db";
import { shops, clients, deals, contracts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { NewProjectForm } from "./NewProjectForm";

interface NewProjectPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ dealId?: string; contractId?: string; clientId?: string }>;
}

export default async function NewProjectPage({ params, searchParams }: NewProjectPageProps) {
  const { slug } = await params;
  const { dealId, contractId, clientId } = await searchParams;

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (!shop) notFound();

  const [clientList, dealList, contractList] = await Promise.all([
    db.query.clients.findMany({
      where: eq(clients.shopId, shop.id),
      columns: { id: true, name: true },
      orderBy: [clients.name],
    }),
    db.query.deals.findMany({
      where: eq(deals.shopId, shop.id),
      columns: { id: true, title: true },
    }),
    db.query.contracts.findMany({
      where: eq(contracts.shopId, shop.id),
      columns: { id: true, contractNumber: true, title: true },
    }),
  ]);

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">New Project</h1>
        <p className="text-sm text-gray-500 mt-0.5">Set up a project with budget tracking, timesheets, and milestone invoicing.</p>
      </div>
      <NewProjectForm
        shopId={shop.id}
        shopSlug={slug}
        clients={clientList}
        deals={dealList}
        contracts={contractList}
        currency={shop.currency || "KES"}
        brandColor={shop.primaryColor || "#064e3b"}
        initialDealId={dealId}
        initialContractId={contractId}
        initialClientId={clientId}
      />
    </div>
  );
}
