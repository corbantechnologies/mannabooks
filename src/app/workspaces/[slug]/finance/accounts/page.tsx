import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { apiClient } from "@/lib/api/client";
import { redirect } from "next/navigation";
import ChartOfAccountsClient, { DetailedAccount, Summary } from "./ChartOfAccountsClient";

export default async function ChartOfAccountsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const { shop } = await getActiveWorkspaceContext(slug);
    if (!shop) redirect("/dashboard");

    let accounts: any[] = [];
    let trialBalance: any = null;

    if (shop.isGlEnabled) {
        const [accRes, tbRes] = await Promise.all([
            apiClient.get<any[]>(`/v1/accounts?shop_id=${shop.id}`),
            apiClient.get<any>(`/v1/reports/trial-balance?shop_id=${shop.id}`),
        ]);
        accounts = accRes.data || [];
        trialBalance = tbRes.data || null;
    }

    const tbMap = new Map<string, any>(
        (trialBalance?.rows || []).map((r: any) => [r.account_id, r])
    );

    const detailedAccounts: DetailedAccount[] = accounts.map((a: any) => {
        const row = tbMap.get(a.id);
        const debits = row ? Number(row.total_debits) : 0;
        const credits = row ? Number(row.total_credits) : 0;
        const isDebitNormal = a.account_type === "ASSET" || a.account_type === "EXPENSE";
        const netBalance = isDebitNormal ? debits - credits : credits - debits;

        return {
            id: a.id,
            code: a.code,
            name: a.name,
            accountType: (a.account_type || a.accountType) as "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE",
            isSystem: Boolean(a.is_system ?? a.isSystem),
            parentCode: a.parent_code ?? a.parentCode ?? null,
            debits,
            credits,
            netBalance,
            entriesCount: 0,
        };
    });

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;

    for (const a of detailedAccounts) {
        if (a.accountType === "ASSET") totalAssets += a.netBalance;
        else if (a.accountType === "LIABILITY") totalLiabilities += a.netBalance;
        else if (a.accountType === "EQUITY") totalEquity += a.netBalance;
        else if (a.accountType === "REVENUE") totalRevenue += a.netBalance;
        else if (a.accountType === "EXPENSE") totalExpenses += a.netBalance;
    }

    const summary: Summary = {
        totalAssets,
        totalLiabilities,
        totalEquity,
        totalRevenue,
        totalExpenses,
        totalDebits: trialBalance ? Number(trialBalance.total_debits) : 0,
        totalCredits: trialBalance ? Number(trialBalance.total_credits) : 0,
        isBalanced: trialBalance ? Boolean(trialBalance.is_balanced) : true,
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
