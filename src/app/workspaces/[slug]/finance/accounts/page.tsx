import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { enforcePermission } from "@/lib/actions/rbac";
import { getChartOfAccounts, activateGeneralLedger } from "@/lib/actions/gl";
import ChartOfAccountsClient from "./ChartOfAccountsClient";

export default async function ChartOfAccountsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
    if (!shop) redirect("/dashboard");

    try {
        await enforcePermission(shop.id, "manage_expenses");
    } catch {
        redirect(`/workspaces/${slug}`);
    }

    const accounts = shop.isGlEnabled ? await getChartOfAccounts(shop.id) : [];

    return (
        <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/80 pb-6">
                <div>
                    <span className="font-mono text-xs text-zinc-400 font-semibold">FINANCE // CHART_OF_ACCOUNTS</span>
                    <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Chart of Accounts</h1>
                </div>
            </div>

            <ChartOfAccountsClient
                shopId={shop.id}
                shopSlug={slug}
                isGlEnabled={shop.isGlEnabled}
                glOnboardingMode={shop.glOnboardingMode}
                accounts={accounts.map(a => ({
                    id: a.id,
                    code: a.code,
                    name: a.name,
                    accountType: a.accountType,
                    isSystem: a.isSystem,
                    parentCode: a.parentCode,
                }))}
            />
        </div>
    );
}
