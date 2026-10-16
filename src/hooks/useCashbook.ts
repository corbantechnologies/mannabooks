// src/hooks/useCashbook.ts
"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosClient from "@/lib/api/axios";

export type CashbookKind = "expense" | "income";

export interface CashbookEntry {
  id: string;
  shopId: string;
  description: string;
  amount: string;
  currency: string;
  category: string;
  date: string;
  paymentChannel?: string | null;
  paymentReference?: string | null;
  attachmentUrl?: string | null;
  isNonDeductible?: boolean;
}

export interface CashbookFilters {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  q?: string;
  limit: number;
}

export interface CashbookPage {
  items: CashbookEntry[];
  total: number;
  summary: { count: number; totalAmount: string; byCategory: { category: string; amount: string }[] };
}

export interface CashbookInput {
  description: string;
  amount: string;
  category: string;
  date: string;
  paymentChannel?: string;
  paymentReference?: string;
  attachmentUrl?: string | null;
  isNonDeductible?: boolean;
}

const path = (kind: CashbookKind) => (kind === "expense" ? "/expenses" : "/incomes");

export function useCashbook(kind: CashbookKind, shopId: string, filters: CashbookFilters) {
  return useQuery<CashbookPage>({
    queryKey: ["cashbook", kind, shopId, filters],
    queryFn: () =>
      axiosClient.get(path(kind), {
        params: {
          shop_id: shopId,
          date_from: filters.dateFrom || undefined,
          date_to: filters.dateTo ? `${filters.dateTo}T23:59:59` : undefined,
          category: filters.category || undefined,
          q: filters.q || undefined,
          limit: filters.limit,
        },
      }) as Promise<CashbookPage>,
    enabled: Boolean(shopId),
    placeholderData: keepPreviousData,
  });
}

export function useSaveCashbookEntry(kind: CashbookKind, shopId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: CashbookInput }) => {
      const body = {
        shop_id: shopId,
        description: input.description,
        amount: input.amount,
        category: input.category,
        date: input.date,
        paymentChannel: input.paymentChannel || null,
        paymentReference: input.paymentReference || null,
        attachmentUrl: input.attachmentUrl || null,
        ...(kind === "expense" ? { isNonDeductible: Boolean(input.isNonDeductible) } : {}),
      };
      return id ? axiosClient.patch(`${path(kind)}/${id}`, body) : axiosClient.post(path(kind), body);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cashbook", kind, shopId] }),
  });
}

export function useDeleteCashbookEntry(kind: CashbookKind, shopId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => axiosClient.delete(`${path(kind)}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cashbook", kind, shopId] }),
  });
}
