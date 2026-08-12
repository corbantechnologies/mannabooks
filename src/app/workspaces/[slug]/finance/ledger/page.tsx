import { db } from "@/db";
import { shops, journalEntries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getChartOfAccounts } from "@/lib/actions/gl";
import GeneralLedgerClient from "./GeneralLedgerClient";

export default async function GeneralLedgerPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
    if (!shop) redirect("/dashboard");

    if (!shop.isGlEnabled) redirect(`/workspaces/${slug}/finance/accounts`);

    const [accounts, entries] = await Promise.all([
        getChartOfAccounts(shop.id),
        db.query.journalEntries.findMany({
            where: eq(journalEntries.shopId, shop.id),
            with: {
                debitAccount: true,
                creditAccount: true,
                period: true,
                createdBy: true,
            },
            orderBy: [desc(journalEntries.entryDate), desc(journalEntries.createdAt)],
            limit: 200,
        }),
    ]);

    return (
        <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white">
            <div className="border-b border-zinc-200/80 pb-6">
                <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Journal Entries</span>
                <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Journal Entries</h1>
                <p className="text-sm text-zinc-500 mt-1">
                    Complete double-entry journal. Use <strong>Post Manual Entry</strong> to record historical transactions
                    (e.g. Railway, Google Cloud subscriptions paid before Manna Books go-live).
                </p>
            </div>

            <GeneralLedgerClient
                shopId={shop.id}
                shopSlug={slug}
                glOnboardingMode={shop.glOnboardingMode}
                accounts={accounts.map(a => ({ id: a.id, code: a.code, name: a.name, accountType: a.accountType }))}
                entries={entries.map(e => ({
                    id: e.id,
                    entryDate: e.entryDate.toISOString(),
                    description: e.description,
                    debitAccountCode: e.debitAccount?.code || "",
                    debitAccountName: e.debitAccount?.name || "",
                    creditAccountCode: e.creditAccount?.code || "",
                    creditAccountName: e.creditAccount?.name || "",
                    amount: e.amount,
                    sourceType: e.sourceType,
                    periodName: e.period?.periodName || null,
                    isBackdated: e.isBackdated,
                    backdatedReason: e.backdatedReason,
                    createdByName: e.createdBy?.name || null,
                }))}
            />
        </div>
    );
}
