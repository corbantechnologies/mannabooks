// src/app/workspaces/[slug]/clients/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { ClientFormClientSide } from "./ClientFormClientSide";
import { ClientFilterBar } from "./ClientFilterBar";
import { ClientsTableClient } from "./ClientsTableClient";

interface ClientsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceClientsPage({ params }: ClientsPageProps) {
  const { slug } = await params;
  const { shop } = await getActiveWorkspaceContext(slug);

  if (!shop) {
    notFound();
  }

  return (
    <div className="p-5 sm:p-7 space-y-6">
      {/* HEADER META STRIP */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs text-zinc-400 font-medium">Client Base</span>
          <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Client Directory</h1>
        </div>

        <ClientFormClientSide shopId={shop.id} shopSlug={slug} />
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <ClientFilterBar />

      {/* CLIENT LOG DATA TABLE (PURE CLIENT REACT QUERY) */}
      <ClientsTableClient shopId={shop.id} shopSlug={slug} />
    </div>
  );
}