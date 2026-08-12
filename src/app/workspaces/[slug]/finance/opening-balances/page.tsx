import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getChartOfAccounts } from "@/lib/actions/gl";
import OpeningBalancesClient from "./OpeningBalancesClient";

export default async function OpeningBalancesPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
    if (!shop) redirect("/dashboard");

    if (!shop.isGlEnabled) redirect(`/workspaces/${slug}/finance/accounts`);

    const accounts = await getChartOfAccounts(shop.id);

    // Exclude the Opening Balances contra account itself from the list
    const filteredAccounts = accounts.filter(a => a.code !== "3200");

    return (
        <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white">
            <div className="border-b border-zinc-200/80 pb-6">
                <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Declare Opening Balances</span>
                <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Opening Balances</h1>
                <p className="text-sm text-zinc-500 mt-1 max-w-2xl">
                    Enter the balance of each account <strong>as of a specific date</strong> — typically the last day before your go-live on Manna Books.
                    These post as journal entries against account <strong>3200 Opening Balances</strong>.
                    This sets your starting position without re-entering every historical transaction.
                </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-1">
                <p className="font-bold font-mono text-xs uppercase">When to use this vs. Manual Journal Entries</p>
                <ul className="list-disc pl-4 space-y-1 mt-1">
                    <li><strong>Opening Balances</strong> → For account totals you already know (e.g. "My bank account had KES 240,000 on September 30, 2025")</li>
                    <li><strong>Manual Journal Entries</strong> (GL Ledger page) → For individual historical transactions you want recorded (e.g. "Paid Railway KES 3,200 on Nov 1, 2025"; "Paid Google Cloud KES 4,800 on Dec 1, 2025")</li>
                </ul>
            </div>

            <OpeningBalancesClient
                shopId={shop.id}
                shopSlug={slug}
                accounts={filteredAccounts.map(a => ({
                    id: a.id,
                    code: a.code,
                    name: a.name,
                    accountType: a.accountType,
                }))}
            />
        </div>
    );
}
