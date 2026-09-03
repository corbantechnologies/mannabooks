import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getTrialBalance } from "@/lib/actions/reports";
import TrialBalanceClient from "./TrialBalanceClient";

export default async function TrialBalancePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
    if (!shop) redirect("/dashboard");

    const result = shop.isGlEnabled ? await getTrialBalance(shop.id) : null;
    const data = result?.success ? result : null;

    return (
        <div className="p-5 sm:p-7 space-y-6">
            <div className="space-y-2">
                <span className="text-xs text-zinc-400 font-medium">Trial Balance</span>
                <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Trial Balance</h1>
                <p className="text-sm text-zinc-500 mt-1">Verifies that total debits equal total credits across all accounts. Must balance to zero.</p>
            </div>
            <TrialBalanceClient
                shopId={shop.id}
                isGlEnabled={shop.isGlEnabled}
                currency={shop.currency || "KES"}
                initialRows={data?.data ?? []}
                totalDebits={data?.totalDebits ?? 0}
                totalCredits={data?.totalCredits ?? 0}
                isBalanced={data?.isBalanced ?? true}
            />
        </div>
    );
}
