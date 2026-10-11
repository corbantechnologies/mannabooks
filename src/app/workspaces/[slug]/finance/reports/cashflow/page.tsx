import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { redirect } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import CashFlowClient from "./CashFlowClient";

export default async function CashFlowPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const { shop } = await getActiveWorkspaceContext(slug);
    if (!shop) redirect("/dashboard");

    const res = await apiClient.get<any>(`/v1/reports/cashflow`, {
        params: { shop_id: shop.id, timeframe: "THIS_MONTH" },
    });
    const data = res.data?.data || (res.data?.success !== false ? res.data : null);

    return (
        <div className="p-5 sm:p-7 space-y-6">
            <div className="space-y-2">
                <span className="text-xs text-zinc-400 font-medium">Statement of Cash Flows</span>
                <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Cash Flow Statement</h1>
                <p className="text-sm text-zinc-500 mt-1">A structured view of cash movement across operating and investing activities.</p>
            </div>
            <CashFlowClient shopId={shop.id} initialData={data} currency={shop.currency || "KES"} />
        </div>
    );
}
