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
        <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white">
            <div className="border-b border-zinc-200/80 pb-6">
                <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Accounting Periods</span>
                <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Accounting Periods</h1>
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
