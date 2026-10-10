import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { apiClient } from "@/lib/api/client";
import { notFound } from "next/navigation";
import { PayablesAgingClient, type SupplierAgingItem } from "./PayablesAgingClient";

interface PayablesAgingPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PayablesAgingPage({ params }: PayablesAgingPageProps) {
  const { slug } = await params;

  const { shop } = await getActiveWorkspaceContext(slug);

  if (!shop) {
    notFound();
  }

  const res = await apiClient<{ success: boolean; agingData: SupplierAgingItem[] }>(
    `/v1/reports/payables-aging?shop_id=${shop.id}`
  );

  const agingData = res.data?.agingData || [];

  return (
    <div className="p-5 sm:p-7 space-y-6">
      <div className="space-y-1">
        <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider">Financial Reports & Accounts Payable</span>
        <h1 className="text-[22px] font-semibold text-zinc-900 leading-tight">Payables Aging Analysis</h1>
        <p className="text-sm text-zinc-500">
          Monitor outstanding liabilities to vendors, grouped across statutory aging buckets (0–30, 31–60, 61–90, 90+ days),
          to prevent liquidity traps and optimize working capital outflows.
        </p>
      </div>

      <PayablesAgingClient
        shopSlug={slug}
        shopName={shop.name}
        currency={shop.currency}
        agingData={agingData}
      />
    </div>
  );
}
