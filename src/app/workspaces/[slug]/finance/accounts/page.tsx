import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { redirect } from "next/navigation";
import { ChartOfAccountsWrapper } from "./ChartOfAccountsWrapper";

export default async function ChartOfAccountsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const { shop } = await getActiveWorkspaceContext(slug);
    if (!shop) redirect("/dashboard");

    return (
        <div className="p-5 sm:p-7 space-y-6">
            <div className="space-y-2">
                <span className="text-xs text-zinc-400 font-medium">General Ledger</span>
                <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Chart of Accounts</h1>
                <p className="text-sm text-zinc-500 mt-1">
                    The accounts your transactions post to, with live balances from the general ledger.
                </p>
            </div>

            <ChartOfAccountsWrapper
                shopId={shop.id}
                shopSlug={slug}
                currency={shop.currency}
                isGlEnabled={Boolean(shop.isGlEnabled)}
                glOnboardingMode={Boolean(shop.glOnboardingMode)}
            />
        </div>
    );
}
