import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { notFound } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { RecurringInvoicesClient, type RecurringInvoiceItem } from "./RecurringInvoicesClient";

interface RecurringInvoicesPageProps {
  params: Promise<{ slug: string }>;
}

export default async function RecurringInvoicesPage({ params }: RecurringInvoicesPageProps) {
  const { slug } = await params;

  const { shop } = await getActiveWorkspaceContext(slug);

  if (!shop) {
    notFound();
  }

  let recurringInvoices: RecurringInvoiceItem[] = [];
  try {
    const res = await apiClient<{ success: boolean; recurringInvoices: RecurringInvoiceItem[] }>(
      `/v1/workspaces/${shop.id}/recurring-invoices`
    );
    if (res.data?.success && Array.isArray(res.data.recurringInvoices)) {
      recurringInvoices = res.data.recurringInvoices;
    }
  } catch (error) {
    console.error("Failed to load recurring invoices:", error);
  }

  return (
    <div className="p-5 sm:p-7 space-y-6">
      <RecurringInvoicesClient
        shopId={shop.id}
        shopSlug={slug}
        currency={shop.currency || "KES"}
        recurringInvoices={recurringInvoices}
      />
    </div>
  );
}

