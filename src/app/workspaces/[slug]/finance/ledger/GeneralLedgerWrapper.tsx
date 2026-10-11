"use client";

import { useAccounts, useJournalEntries, useCostCenters } from "@/hooks/useFinance";
import GeneralLedgerClient from "./GeneralLedgerClient";
import { Spinner } from "@/components/Spinner";

interface GeneralLedgerWrapperProps {
  shopId: string;
  shopSlug: string;
  glOnboardingMode: boolean;
  initialSearch?: string;
}

export function GeneralLedgerWrapper({
  shopId,
  shopSlug,
  glOnboardingMode,
  initialSearch = "",
}: GeneralLedgerWrapperProps) {
  const { data: accountsData = [], isLoading: isLoadingAccounts } = useAccounts(shopId);
  const { data: entriesData = [], isLoading: isLoadingEntries } = useJournalEntries(shopId, 200);
  const { data: costCentersData = [], isLoading: isLoadingCostCenters } = useCostCenters(shopId);

  if (isLoadingAccounts || isLoadingEntries || isLoadingCostCenters) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3">
        <Spinner size={24} />
        <p className="text-xs text-zinc-500 font-mono tracking-wider uppercase">Loading general ledger entries...</p>
      </div>
    );
  }

  const accounts = (Array.isArray(accountsData) ? accountsData : []).map((a: any) => ({
    id: a.id,
    code: a.code,
    name: a.name,
    accountType: a.accountType || a.account_type,
  }));

  const costCenters = (Array.isArray(costCentersData) ? costCentersData : []).map((c: any) => ({
    id: c.id,
    code: c.code,
    name: c.name,
  }));

  const entries = (Array.isArray(entriesData) ? entriesData : []).map((e: any) => ({
    id: String(e.id),
    entryDate: typeof e.entryDate === "string" ? e.entryDate : (e.entry_date ? String(e.entry_date) : new Date().toISOString().split("T")[0]),
    description: e.description || "",
    amount: String(e.amount || "0"),
    debitAccountCode: e.debitAccountCode || e.debit_account_code || e.debitAccount?.code || "",
    debitAccountName: e.debitAccountName || e.debit_account_name || e.debitAccount?.name || "",
    creditAccountCode: e.creditAccountCode || e.credit_account_code || e.creditAccount?.code || "",
    creditAccountName: e.creditAccountName || e.credit_account_name || e.creditAccount?.name || "",
    sourceType: e.sourceType || e.source_type || "manual",
    periodName: e.periodName || e.period_name || null,
    isBackdated: Boolean(e.isBackdated ?? e.is_backdated),
    backdatedReason: e.backdatedReason || e.backdated_reason || null,
    createdByName: e.createdByName || e.created_by_name || null,
    costCenterCode: e.costCenterCode || e.cost_center_code || e.costCenter?.code || null,
    costCenterName: e.costCenterName || e.cost_center_name || e.costCenter?.name || null,
  }));

  return (
    <GeneralLedgerClient
      shopId={shopId}
      shopSlug={shopSlug}
      glOnboardingMode={glOnboardingMode}
      initialSearch={initialSearch}
      accounts={accounts}
      costCenters={costCenters}
      entries={entries}
    />
  );
}
