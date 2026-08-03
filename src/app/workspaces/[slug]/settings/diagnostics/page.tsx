// src/app/workspaces/[slug]/settings/diagnostics/page.tsx
import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { getLedgerSnapshotsAction } from "@/lib/actions/documents";
import { DiagnosticsClient } from "./DiagnosticsClient";

interface DiagnosticsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceDiagnosticsPage({ params }: DiagnosticsPageProps) {
  const { slug } = await params;

  // Fetch workspace details server-side
  const { shop } = await getActiveWorkspaceContext(slug);
  const snapshotsRes = await getLedgerSnapshotsAction(shop.id);
  const snapshots = snapshotsRes.success && snapshotsRes.data ? snapshotsRes.data : [];

  return (
    <div className="p-8 max-w-7xl space-y-8 selection:bg-black selection:text-white">
      <DiagnosticsClient
        shopId={shop.id}
        shopSlug={slug}
        initialIsGlEnabled={shop.isGlEnabled}
        ledgerSnapshots={snapshots as any}
      />
    </div>
  );
}
