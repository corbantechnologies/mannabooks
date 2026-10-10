// src/app/workspaces/[slug]/crm/proposals/new/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { NewProposalForm } from "./NewProposalForm";

interface NewProposalPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ dealId?: string; clientId?: string }>;
}

export default async function NewProposalPage({ params, searchParams }: NewProposalPageProps) {
  const { slug } = await params;
  const { dealId, clientId } = await searchParams;

  const { shop } = await getActiveWorkspaceContext(slug);
  if (!shop) notFound();

  const [clientRes, dealRes] = await Promise.all([
    apiClient.get<any[]>(`/v1/clients?shop_id=${shop.id}`),
    apiClient.get<any>(`/v1/crm/deals?shop_id=${shop.id}`),
  ]);
  const clientList = (clientRes.data || []).map((c: any) => ({ id: c.id, name: c.name, email: c.email }));
  const dealList = (dealRes.data?.deals || dealRes.data || []).map((d: any) => ({ id: d.id, title: d.title, contactName: d.contact_name || d.contactName }));

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">New Proposal</h1>
        <p className="text-sm text-gray-500 mt-0.5">Create an interactive proposal with e-signature support.</p>
      </div>
      <NewProposalForm
        shopId={shop.id}
        shopSlug={slug}
        clients={clientList}
        deals={dealList}
        currency={shop.currency || "KES"}
        brandColor={shop.primaryColor || "#064e3b"}
        initialDealId={dealId}
        initialClientId={clientId}
      />
    </div>
  );
}
