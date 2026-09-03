import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getAccountingPeriods } from "@/lib/actions/gl";
import AccountingPeriodsClient from "./AccountingPeriodsClient";

export default async function AccountingPeriodsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
    if (!shop) redirect("/dashboard");

    const periods = shop.isGlEnabled ? await getAccountingPeriods(shop.id) : [];

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
                    fiscalYearLabel: p.fiscalYear?.label || "Unassigned / Historical",
                }))}
            />
        </div>
    );
}
