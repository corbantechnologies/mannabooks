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

  const [requests, policies] = await Promise.all([
    getApprovalRequests(shop.id),
    getApprovalPolicies(shop.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
          Governance &amp; Internal Controls
        </span>
        <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight font-sans text-black mt-0.5">
          Approvals &amp; Requests
        </h1>
        <p className="text-xs text-zinc-500 font-sans mt-1">
          Review, authorize, or submit purchase requisitions, expense claims, credit notes, and stock adjustments.
        </p>
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
