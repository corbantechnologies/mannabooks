import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { redirect } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import AccountingPeriodsClient from "./AccountingPeriodsClient";

export default async function AccountingPeriodsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const { shop } = await getActiveWorkspaceContext(slug);
    if (!shop) redirect("/dashboard");

    let periods: any[] = [];
    if (shop.isGlEnabled) {
        const res = await apiClient.get<any>(`/v1/accounts/periods`, { params: { shop_id: shop.id } });
        periods = res.data?.periods || (Array.isArray(res.data) ? res.data : []);
    }

    return (
        <div className="p-5 sm:p-7 space-y-6">
            <div className="space-y-2">
                <span className="text-xs text-zinc-400 font-medium">Accounting Periods</span>
                <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Accounting Periods</h1>
                <p className="text-sm text-zinc-500 mt-1">Close a period to lock entries and prevent backdating. Only Owners and Admins can reopen a closed period.</p>
            </div>

            <AccountingPeriodsClient
                shopId={shop.id}
                shopSlug={slug}
                isGlEnabled={shop.isGlEnabled}
                glOnboardingMode={shop.glOnboardingMode}
                periods={periods.map(p => ({
                    id: p.id,
                    periodName: p.periodName,
                    startDate: p.startDate,
                    endDate: p.endDate,
                    status: p.status,
                    closedAt: p.closedAt?.toISOString() || null,
                    closedByName: p.closedBy?.name || null,
                    fiscalYearId: p.fiscalYear?.id || null,
                    fiscalYearLabel: p.fiscalYear?.label || "Unassigned / Historical",
                }))}
            />
        </div>
    );
}
