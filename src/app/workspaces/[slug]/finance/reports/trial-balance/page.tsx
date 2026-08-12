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
        <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white">
            <div className="border-b border-zinc-200/80 pb-6">
                <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Trial Balance</span>
                <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Trial Balance</h1>
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
