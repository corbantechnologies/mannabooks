// src/hooks/useIncomes.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "@/lib/api/axios";
import { toast } from "react-hot-toast";

export interface IncomeItem {
  id: string;
  shopId: string;
  description: string;
  amount: string | number;
  currency: string;
  category: string;
  incomeDate: string;
  paymentChannel?: string | null;
  paymentReference?: string | null;
  attachmentUrl?: string | null;
  createdAt?: string;
}

export function useIncomes(shopId: string, limit = 100) {
  return useQuery({
    queryKey: ["incomes", shopId, limit],
    queryFn: async () => {
      const res: any = await axiosClient.get(`/incomes?shop_id=${shopId}&limit=${limit}`);
      return (res || []) as IncomeItem[];
    },
    enabled: Boolean(shopId),
  });
}

export function useCreateIncome(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      description: string;
      amount: number;
      category?: string;
      incomeDate?: Date | string;
      attachmentUrl?: string;
      currency?: string;
      paymentChannel?: string;
      paymentReference?: string;
    }) => {
      const dateVal = data.incomeDate
        ? data.incomeDate instanceof Date
          ? data.incomeDate.toISOString()
          : data.incomeDate
        : new Date().toISOString();

      return await axiosClient.post("/incomes", {
        shop_id: shopId,
        description: data.description,
        amount: data.amount,
        category: data.category || "OTHER",
        income_date: dateVal,
        attachment_url: data.attachmentUrl || null,
        currency: data.currency || "KES",
        payment_channel: data.paymentChannel || null,
        payment_reference: data.paymentReference || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes", shopId] });
      toast.success("Income recorded successfully!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to record income.");
    },
  });
}

export function useDeleteIncome(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (incomeId: string) => {
      return await axiosClient.delete(`/incomes/${incomeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes", shopId] });
      toast.success("Income deleted successfully.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete income.");
    },
  });
}
