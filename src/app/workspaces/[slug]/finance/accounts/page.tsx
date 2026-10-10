import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { db } from "@/db";
import { shops, journalEntries } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { enforcePermission } from "@/lib/actions/rbac";
import { getChartOfAccounts } from "@/lib/actions/gl";
import ChartOfAccountsClient from "./ChartOfAccountsClient";

export default async function ChartOfAccountsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const { shop } = await getActiveWorkspaceContext(slug);
    if (!shop) redirect("/dashboard");

    try {
        await enforcePermission(shop.id, "manage_expenses");
    } catch {
        redirect(`/workspaces/${slug}`);
    }

    const accounts = shop.isGlEnabled ? await getChartOfAccounts(shop.id) : [];

    // Fetch journal entries to calculate real-time account balances
    const entries = shop.isGlEnabled
        ? await db.query.journalEntries.findMany({
            where: eq(journalEntries.shopId, shop.id),
            columns: {
                debitAccountId: true,
                creditAccountId: true,
                amount: true,
            },
        })
        : [];

    const balanceMap: Record<string, { debits: number; credits: number; count: number }> = {};
    for (const a of accounts) {
        balanceMap[a.id] = { debits: 0, credits: 0, count: 0 };
    }

    for (const e of entries) {
        const amt = parseFloat(e.amount || "0");
        if (balanceMap[e.debitAccountId]) {
            balanceMap[e.debitAccountId].debits += amt;
            balanceMap[e.debitAccountId].count += 1;
        }
        if (balanceMap[e.creditAccountId]) {
            balanceMap[e.creditAccountId].credits += amt;
            balanceMap[e.creditAccountId].count += 1;
        }
    }

    const detailedAccounts = accounts.map(a => {
        const stats = balanceMap[a.id] || { debits: 0, credits: 0, count: 0 };
        const debits = stats.debits;
        const credits = stats.credits;
        const isDebitNormal = a.accountType === "ASSET" || a.accountType === "EXPENSE";
        const netBalance = isDebitNormal ? debits - credits : credits - debits;

        return {
            id: a.id,
            code: a.code,
            name: a.name,
            accountType: a.accountType as "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE",
            isSystem: a.isSystem,
            parentCode: a.parentCode,
            debits,
            credits,
            netBalance,
            entriesCount: stats.count,
        };
    });

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalDebitsAll = 0;
    let totalCreditsAll = 0;

    for (const a of detailedAccounts) {
        totalDebitsAll += a.debits;
        totalCreditsAll += a.credits;
        if (a.accountType === "ASSET") totalAssets += a.netBalance;
        else if (a.accountType === "LIABILITY") totalLiabilities += a.netBalance;
        else if (a.accountType === "EQUITY") totalEquity += a.netBalance;
        else if (a.accountType === "REVENUE") totalRevenue += a.netBalance;
        else if (a.accountType === "EXPENSE") totalExpenses += a.netBalance;
    }

    const summary = {
        totalAssets,
        totalLiabilities,
        totalEquity,
        totalRevenue,
        totalExpenses,
        totalDebits: totalDebitsAll,
        totalCredits: totalCreditsAll,
        isBalanced: Math.abs(totalDebitsAll - totalCreditsAll) < 0.01,
    };

    return (
        <div className="p-5 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <span className="text-xs text-zinc-400 font-medium">Chart of Accounts</span>
                    <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Chart of Accounts</h1>
                    <p className="text-xs text-zinc-500 mt-1">
                        Master general ledger structure. Inspect live real-time debit and credit balances, category totals, and drill down to account journals.
                    </p>
                </div>
            </div>

            <ChartOfAccountsClient
                shopId={shop.id}
                shopSlug={slug}
                currency={shop.currency || "KES"}
                isGlEnabled={shop.isGlEnabled}
                glOnboardingMode={shop.glOnboardingMode}
                summary={summary}
                accounts={detailedAccounts}
            />
        </div>
    );
}
