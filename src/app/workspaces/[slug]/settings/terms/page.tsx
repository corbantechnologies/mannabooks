// src/app/workspaces/[slug]/settings/terms/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { apiClient } from "@/lib/api/client";
import { TermsSettingsClient } from "./TermsSettingsClient";

interface TermsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceTermsPage({ params }: TermsPageProps) {
  const { slug } = await params;
  const { shop } = await getActiveWorkspaceContext(slug);

  let terms: any[] = [];
  try {
    const res = await apiClient.get<any>(`/v1/workspaces/${shop.id}/terms`);
    terms = res.data?.terms || [];
  } catch (err) {
    console.warn("Failed to fetch shop terms:", err);
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl space-y-8 selection:bg-black selection:text-white">
      <TermsSettingsClient
        shopId={shop.id}
        shopSlug={slug}
        shopName={shop.name}
        initialTerms={terms}
      />
    </div>
  );
}
