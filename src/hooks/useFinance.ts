// src/hooks/useFinance.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/lib/api/axios";
import { toast } from "react-hot-toast";

export interface AccountInput {
  code: string;
  name: string;
  account_type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  parent_code?: string;
  is_system?: boolean;
}

export interface JournalEntryInput {
  entry_date?: string;
  description: string;
  debit_account_id: string;
  credit_account_id: string;
  amount: number;
  reference_number?: string;
  cost_center_id?: string;
  backdated_reason?: string;
}

export function useAccounts(shopId: string, accountType?: string) {
  return useQuery({
    queryKey: ["accounts", shopId, accountType],
    queryFn: async () => {
      const data: any = await axiosClient.get("/accounts", {
        params: { shop_id: shopId, account_type: accountType },
      });
      return Array.isArray(data) ? data : data?.accounts || [];
    },
    enabled: Boolean(shopId),
  });
}

export function useCreateAccount(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AccountInput) => {
      return await axiosClient.post(`/accounts?shop_id=${shopId}`, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", shopId] });
      toast.success("Account created in Chart of Accounts!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create account.");
    },
  });
}

export function useFiscalYears(shopId: string) {
  return useQuery({
    queryKey: ["fiscal-years", shopId],
    queryFn: async () => {
      const res: any = await axiosClient.get("/accounts/fiscal-years", {
        params: { shop_id: shopId },
      });
      return res?.fiscalYears || [];
    },
    enabled: Boolean(shopId),
  });
}

export function useJournalEntries(shopId: string, limit = 200) {
  return useQuery({
    queryKey: ["journal-entries", shopId, limit],
    queryFn: async () => {
      const res: any = await axiosClient.get("/accounts/journal-entries", {
        params: { shop_id: shopId, limit },
      });
      return res?.entries || [];
    },
    enabled: Boolean(shopId),
  });
}

export function useCreateJournalEntry(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: JournalEntryInput) => {
      return await axiosClient.post(`/accounts/journal-entries?shop_id=${shopId}`, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries", shopId] });
      queryClient.invalidateQueries({ queryKey: ["accounts", shopId] });
      toast.success("Journal entry posted successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to post journal entry.");
    },
  });
}

export function useTrialBalance(shopId: string, periodId?: string) {
  return useQuery({
    queryKey: ["trial-balance", shopId, periodId],
    queryFn: async () => {
      return await axiosClient.get("/reports/trial-balance", {
        params: { shop_id: shopId, period_id: periodId },
      });
    },
    enabled: Boolean(shopId),
  });
}

export function useProfitLoss(shopId: string, period = "THIS_MONTH") {
  return useQuery({
    queryKey: ["profit-loss", shopId, period],
    queryFn: async () => {
      return await axiosClient.get("/reports/profit-loss", {
        params: { shop_id: shopId, period },
      });
    },
    enabled: Boolean(shopId),
  });
}

export function useBalanceSheet(shopId: string) {
  return useQuery({
    queryKey: ["balance-sheet", shopId],
    queryFn: async () => {
      return await axiosClient.get("/reports/balance-sheet", {
        params: { shop_id: shopId },
      });
    },
    enabled: Boolean(shopId),
  });
}

export function usePayablesAging(shopId: string) {
  return useQuery({
    queryKey: ["payables-aging", shopId],
    queryFn: async () => {
      const res: any = await axiosClient.get("/reports/payables-aging", {
        params: { shop_id: shopId },
      });
      return res?.agingData || [];
    },
    enabled: Boolean(shopId),
  });
}

export function useCostCenters(shopId: string) {
  return useQuery({
    queryKey: ["cost-centers", shopId],
    queryFn: async () => {
      const res: any = await axiosClient.get("/operations/cost-centers", {
        params: { shop_id: shopId },
      });
      return res?.costCenters || [];
    },
    enabled: Boolean(shopId),
  });
}

export function useCreateCostCenter(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { code: string; name: string; description?: string; budget_amount?: number }) => {
      return await axiosClient.post("/operations/cost-centers", { shop_id: shopId, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-centers", shopId] });
      toast.success("Cost center created!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create cost center.");
    },
  });
}

export function useBudgets(shopId: string) {
  return useQuery({
    queryKey: ["budgets", shopId],
    queryFn: async () => {
      const res: any = await axiosClient.get("/operations/budgets", {
        params: { shop_id: shopId },
      });
      return res?.budgets || [];
    },
    enabled: Boolean(shopId),
  });
}

export function useCreateBudget(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { account_id: string; budget_amount: number; fiscal_year_id?: string; period?: string; notes?: string }) => {
      return await axiosClient.post("/operations/budgets", { shop_id: shopId, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets", shopId] });
      toast.success("Budget allocated successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to allocate budget.");
    },
  });
}
