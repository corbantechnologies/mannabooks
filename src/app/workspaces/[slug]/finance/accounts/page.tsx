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
        <div className="p-5 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <span className="text-xs text-zinc-400 font-medium">Chart of Accounts</span>
                    <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Chart of Accounts</h1>
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
