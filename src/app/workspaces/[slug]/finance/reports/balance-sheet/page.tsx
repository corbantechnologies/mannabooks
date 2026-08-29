import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getBalanceSheet } from "@/lib/actions/reports";
import BalanceSheetClient from "./BalanceSheetClient";

export default async function BalanceSheetPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
    if (!shop) redirect("/dashboard");

    const result = await getBalanceSheet(shop.id);
    const data = result.success ? result.data : null;

    return (
        <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white">
            <div className="border-b border-zinc-200/80 pb-6">
                <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Statement of Financial Position</span>
                <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Balance Sheet</h1>
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
