import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getBalanceSheet } from "@/lib/actions/reports";
import { getShopPlanDetails } from "@/lib/paywall";
import { PaywallLockedCard } from "@/components/PaywallLockedCard";
import BalanceSheetClient from "./BalanceSheetClient";

export default async function BalanceSheetPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
    if (!shop) redirect("/dashboard");

    const planDetails = await getShopPlanDetails(shop.id);

    if (planDetails && !planDetails.canAccessGL) {
        return (
            <div className="p-4 sm:p-8">
                <PaywallLockedCard
                    shopSlug={slug}
                    featureName="Balance Sheet & Statement of Financial Position"
                    requiredPlan="PRO"
                    description="The Balance Sheet aggregates real-time Cash & Bank, Accounts Receivable, FIFO Inventory Stock Valuation, Fixed Assets WDV, and Equity under the double-entry accounting equation (Assets = Liabilities + Equity)."
                    benefits={[
                        "Real-time Statement of Financial Position (Assets = Liabilities + Equity)",
                        "Dynamic Retained Earnings & P&L Derivation",
                        "FIFO Inventory Asset Valuation Integration",
                        "One-click CSV & PDF Financial Statements",
                    ]}
                />
            </div>
        );
    }

    const result = await getBalanceSheet(shop.id);
    const data = result.success ? result.data : null;

    return (
        <div className="p-5 sm:p-7 space-y-6">
            <div className="space-y-2">
                <span className="text-xs text-zinc-400 font-medium">Statement of Financial Position</span>
                <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Balance Sheet</h1>
                <p className="text-sm text-zinc-500 mt-1">Assets, Liabilities &amp; Equity as of today. The accounting equation must hold: Assets = Liabilities + Equity.</p>
            </div>
            <BalanceSheetClient
                shopId={shop.id}
                shopSlug={slug}
                isGlEnabled={shop.isGlEnabled}
                currency={shop.currency || "KES"}
                initialData={data}
            />
        </div>
    );
}
