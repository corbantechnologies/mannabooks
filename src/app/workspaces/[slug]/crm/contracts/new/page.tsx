// src/app/workspaces/[slug]/crm/contracts/new/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { NewContractForm } from "./NewContractForm";

interface NewContractPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ dealId?: string }>;
}

export default async function NewContractPage({ params, searchParams }: NewContractPageProps) {
  const { slug } = await params;
  const { dealId } = await searchParams;

  const { shop } = await getActiveWorkspaceContext(slug);
  if (!shop) notFound();

  const [clientRes, dealRes] = await Promise.all([
    apiClient.get<any[]>(`/v1/clients?shop_id=${shop.id}`),
    apiClient.get<any>(`/v1/crm/deals?shop_id=${shop.id}`),
  ]);
  const clientList = (clientRes.data || []).map((c: any) => ({ id: c.id, name: c.name }));
  const dealList = (dealRes.data?.deals || dealRes.data || []).map((d: any) => ({ id: d.id, title: d.title, stage: d.stage }));

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
