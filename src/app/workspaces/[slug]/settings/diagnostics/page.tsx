import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { apiClient } from "@/lib/api/client";
import { DiagnosticsClient } from "./DiagnosticsClient";

interface DiagnosticsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceDiagnosticsPage({ params }: DiagnosticsPageProps) {
  const { slug } = await params;

  // Fetch workspace details server-side
  const { shop } = await getActiveWorkspaceContext(slug);
  const snapshotsRes = await apiClient.get<any>(`/v1/workspaces/${shop.id}/snapshots`);
  const snapshots = snapshotsRes.data?.snapshots || (Array.isArray(snapshotsRes.data) ? snapshotsRes.data : []);

  return (
    <div className="p-8 max-w-7xl space-y-8 selection:bg-black selection:text-white">
      <DiagnosticsClient
        shopId={shop.id}
        shopSlug={slug}
        shopCode={shop.code || shop.slug}
        shopName={shop.name}
        initialIsGlEnabled={shop.isGlEnabled}
        ledgerSnapshots={snapshots as any}
      />
    </div>
  );
}
