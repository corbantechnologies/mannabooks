// src/app/workspaces/[slug]/crm/deals/new/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { NewDealForm } from "./NewDealForm";

interface NewDealPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewDealPage({ params }: NewDealPageProps) {
  const { slug } = await params;

  const { shop } = await getActiveWorkspaceContext(slug);
  if (!shop) notFound();

  const clientRes = await apiClient.get<any[]>(`/v1/clients?shop_id=${shop.id}`);
  const clientList = (clientRes.data || []).map((c: any) => ({ id: c.id, name: c.name, email: c.email }));

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">New Deal</h1>
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
