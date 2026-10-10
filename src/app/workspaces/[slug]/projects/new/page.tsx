// src/app/workspaces/[slug]/projects/new/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { NewProjectForm } from "./NewProjectForm";

interface NewProjectPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ dealId?: string; contractId?: string; clientId?: string }>;
}

export default async function NewProjectPage({ params, searchParams }: NewProjectPageProps) {
  const { slug } = await params;
  const { dealId, contractId, clientId } = await searchParams;

  const { shop } = await getActiveWorkspaceContext(slug);
  if (!shop) notFound();

  const [clientRes, dealRes, contractRes] = await Promise.all([
    apiClient.get<any[]>(`/v1/clients?shop_id=${shop.id}`),
    apiClient.get<any>(`/v1/crm/deals?shop_id=${shop.id}`),
    apiClient.get<any>(`/v1/crm/contracts?shop_id=${shop.id}`),
  ]);
  const clientList = (clientRes.data || []).map((c: any) => ({ id: c.id, name: c.name }));
  const dealList = (dealRes.data?.deals || dealRes.data || []).map((d: any) => ({ id: d.id, title: d.title }));
  const contractList = (contractRes.data?.contracts || contractRes.data || []).map((c: any) => ({
    id: c.id,
    contractNumber: c.contract_number || c.contractNumber,
    title: c.title,
  }));

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
