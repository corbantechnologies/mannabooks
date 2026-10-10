// src/app/workspaces/[slug]/settings/terms/page.tsx
import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { getShopTerms } from "@/lib/actions/terms";
import { TermsSettingsClient } from "./TermsSettingsClient";

interface TermsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceTermsPage({ params }: TermsPageProps) {
  const { slug } = await params;
  const { shop } = await getActiveWorkspaceContext(slug);

  const terms = await getShopTerms(shop.id);

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
