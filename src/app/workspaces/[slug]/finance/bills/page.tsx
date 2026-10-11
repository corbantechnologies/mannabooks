import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { VendorBillsWrapper } from "./VendorBillsWrapper";

interface VendorBillsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function VendorBillsPage({ params }: VendorBillsPageProps) {
  const { slug } = await params;

  const { shop } = await getActiveWorkspaceContext(slug);

  if (!shop) {
    notFound();
  }

  return (
    <div className="p-5 sm:p-7 space-y-6">
      <div className="space-y-1">
        <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider">Accounts Payable &amp; 3-Way Match</span>
        <h1 className="text-[22px] font-semibold text-zinc-900 leading-tight">Vendor Bills &amp; 3-Way Matching</h1>
        <p className="text-sm text-zinc-500">
          Reconcile Purchase Orders (PO/LPO), Goods Received Notes (GRN), and Vendor Invoices with automated 3-Way Matching,
          detect price/quantity variances, manage multi-tier approvals, and issue remittance vouchers.
        </p>
      </div>

      <VendorBillsWrapper
        shopId={shop.id}
        shopSlug={slug}
        shopName={shop.name}
        currency={shop.currency}
        isGlEnabled={shop.isGlEnabled}
      />
    </div>
  );
}
