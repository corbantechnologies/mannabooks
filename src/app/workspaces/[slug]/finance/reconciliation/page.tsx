import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getBankReconciliationData } from "@/lib/actions/reconciliation";
import { getShopPlanDetails } from "@/lib/paywall";
import { PaywallLockedCard } from "@/components/PaywallLockedCard";
import ReconciliationClient from "./ReconciliationClient";

export default async function BankReconciliationPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
    if (!shop) redirect("/dashboard");

    const planDetails = await getShopPlanDetails(shop.id);

    if (planDetails && !planDetails.canAccessReconciliation) {
        return (
            <div className="p-4 sm:p-8">
                <PaywallLockedCard
                    shopSlug={slug}
                    featureName="Bank & M-Pesa Cash Account Reconciliation"
                    requiredPlan="PRO"
                    description="Automate matching of NCBA, Equity, KCB, or M-Pesa Till CSV statements directly against internal double-entry GL Cash & Bank Account 1200 with live variance tracking."
                    benefits={[
                        "CSV Statement Parser for Kenyan Banks & M-Pesa Statements",
                        "One-click Auto-Matching Engine against GL Account 1200",
                        "Side-by-side External vs. Internal GL Reconciliation Matrix",
                        "Audit Trail & CSV Export of Reconciled Ledgers",
                    ]}
                />
            </div>
        );
    }

    const result = await getBankReconciliationData(shop.id);
    const data = result.success ? result.data : null;

    return (
        <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white">
            <div className="border-b border-zinc-200/80 pb-6">
                <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Treasury &amp; Cash Management</span>
                <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Bank &amp; M-Pesa Reconciliation</h1>
                <p className="text-sm text-zinc-500 mt-1">
                    Match external bank or M-Pesa statements with internal GL journal entries in account 1200 (Cash &amp; Bank).
                </p>
            </div>
            <ReconciliationClient
                shopId={shop.id}
                shopSlug={slug}
                isGlEnabled={shop.isGlEnabled}
                currency={shop.currency || "KES"}
                initialData={data}
            />
        </div>
    );
}
