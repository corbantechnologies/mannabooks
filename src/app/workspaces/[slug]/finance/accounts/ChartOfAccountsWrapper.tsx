"use client";

import { useMemo } from "react";
import { useAccounts, useTrialBalance } from "@/hooks/useFinance";
import ChartOfAccountsClient, { DetailedAccount, Summary } from "./ChartOfAccountsClient";
import { Spinner } from "@/components/Spinner";

interface ChartOfAccountsWrapperProps {
  shopId: string;
  shopSlug: string;
  currency?: string;
  isGlEnabled: boolean;
  glOnboardingMode: boolean;
}

export function ChartOfAccountsWrapper({
  shopId,
  shopSlug,
  currency = "KES",
  isGlEnabled,
  glOnboardingMode,
}: ChartOfAccountsWrapperProps) {
  const { data: accountsData = [], isLoading: isLoadingAccounts } = useAccounts(shopId);
  const { data: trialBalanceData, isLoading: isLoadingTB } = useTrialBalance(shopId);

  const { detailedAccounts, summary } = useMemo(() => {
    const rawAccounts: any[] = Array.isArray(accountsData) ? accountsData : [];
    const tbMap = new Map<string, any>(
      ((trialBalanceData as any)?.rows || []).map((r: any) => [r.account_id, r])
    );

    const accounts: DetailedAccount[] = rawAccounts.map((a: any) => {
      const row = tbMap.get(a.id);
      const debits = row ? Number(row.total_debits) : 0;
      const credits = row ? Number(row.total_credits) : 0;
      const isDebitNormal = a.account_type === "ASSET" || a.account_type === "EXPENSE";
      const netBalance = isDebitNormal ? debits - credits : credits - debits;

      return {
        id: a.id,
        code: a.code,
        name: a.name,
        accountType: (a.account_type || a.accountType) as DetailedAccount["accountType"],
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

    for (const a of accounts) {
      if (a.accountType === "ASSET") totalAssets += a.netBalance;
      else if (a.accountType === "LIABILITY") totalLiabilities += a.netBalance;
      else if (a.accountType === "EQUITY") totalEquity += a.netBalance;
      else if (a.accountType === "REVENUE") totalRevenue += a.netBalance;
      else if (a.accountType === "EXPENSE") totalExpenses += a.netBalance;
    }

    const totalDebits = Number((trialBalanceData as any)?.total_debits || 0);
    const totalCredits = Number((trialBalanceData as any)?.total_credits || 0);
    const isBalanced = Boolean((trialBalanceData as any)?.is_balanced ?? Math.abs(totalDebits - totalCredits) < 0.01);

    const sum: Summary = {
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalRevenue,
      totalExpenses,
      totalDebits,
      totalCredits,
      isBalanced,
    };

    return { detailedAccounts: accounts, summary: sum };
  }, [accountsData, trialBalanceData]);

  if (isGlEnabled && (isLoadingAccounts || isLoadingTB)) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3">
        <Spinner size={24} />
        <p className="text-xs text-zinc-500 font-mono tracking-wider uppercase">Loading chart of accounts...</p>
      </div>
    );

  }

  return (
    <ChartOfAccountsClient
      shopId={shopId}
      shopSlug={shopSlug}
      currency={currency}
      isGlEnabled={isGlEnabled}
      glOnboardingMode={glOnboardingMode}
      summary={summary}
      accounts={detailedAccounts}
    />
  );
}
