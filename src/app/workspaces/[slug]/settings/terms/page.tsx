// src/app/workspaces/[slug]/settings/terms/page.tsx
import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { db } from "@/db";
import { shopTerms } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { TermsSettingsClient } from "./TermsSettingsClient";

interface TermsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceTermsPage({ params }: TermsPageProps) {
  const { slug } = await params;
  const { shop } = await getActiveWorkspaceContext(slug);

  const terms = await db.query.shopTerms.findMany({
    where: eq(shopTerms.shopId, shop.id),
    orderBy: [asc(shopTerms.displayOrder), asc(shopTerms.createdAt)],
  });

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
