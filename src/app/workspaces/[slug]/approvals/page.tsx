import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { getApprovalRequests, getApprovalPolicies } from "@/lib/actions/approvals";
import { ApprovalsClient } from "./ApprovalsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Approvals & Requests | Manna Books",
  description: "Unified governance and supervisory approval workflows",
};

interface ApprovalsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ApprovalsPage({ params }: ApprovalsPageProps) {
  const { slug } = await params;
  const { shop, user, role } = await getActiveWorkspaceContext(slug);

  let requests: any[] = [];
  let policies: any[] = [];

  try {
    [requests, policies] = await Promise.all([
      getApprovalRequests(shop.id),
      getApprovalPolicies(shop.id),
    ]);
  } catch (err) {
    console.error("Failed to load approvals data for workspace:", slug, err);
  }

  return (
    <div className="p-5 sm:p-7 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs text-zinc-400 font-medium">Governance &amp; Internal Controls</span>
          <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">
            Approvals &amp; Requests
          </h1>
          <p className="text-xs text-zinc-500 font-sans mt-1">
            Review, authorize, or submit purchase requisitions, expense claims, credit notes, and stock adjustments.
          </p>
        </div>
      </div>

      <ApprovalsClient
        shopId={shop.id}
        shopSlug={shop.slug}
        currency={shop.currency || "KES"}
        currentUser={user}
        userRole={role}
        initialRequests={requests}
        initialPolicies={policies}
      />
    </div>
  );
}
