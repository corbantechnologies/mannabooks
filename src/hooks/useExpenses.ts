// src/hooks/useExpenses.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "@/lib/api/axios";
import { toast } from "react-hot-toast";

export type ExpenseCategory =
  | "RENT"
  | "UTILITIES"
  | "FUEL"
  | "MARKETING"
  | "SALARIES"
  | "OFFICE_SUPPLIES"
  | "OTHER";

export interface ExpenseItem {
  id: string;
  shopId: string;
  description: string;
  amount: string | number;
  currency: string;
  category: ExpenseCategory;
  expenseDate: string;
  paymentChannel?: string | null;
  paymentReference?: string | null;
  receiptUrl?: string | null;
  isNonDeductible?: boolean;
  createdAt?: string;
}

export function useExpenses(shopId: string, limit = 100) {
  return useQuery({
    queryKey: ["expenses", shopId, limit],
    queryFn: async () => {
      const res: any = await axiosClient.get(`/expenses?shop_id=${shopId}&limit=${limit}`);
      return (res || []) as ExpenseItem[];
    },
    enabled: Boolean(shopId),
  });
}

export function useCreateExpense(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      description: string;
      amount: number;
      category: ExpenseCategory;
      expenseDate?: Date | string;
      receiptUrl?: string;
      currency?: string;
      paymentChannel?: string;
      paymentReference?: string;
      isNonDeductible?: boolean;
    }) => {
      const dateVal = data.expenseDate
        ? data.expenseDate instanceof Date
          ? data.expenseDate.toISOString()
          : data.expenseDate
        : new Date().toISOString();

      return await axiosClient.post("/expenses", {
        shop_id: shopId,
        description: data.description,
        amount: data.amount,
        category: data.category,
        expense_date: dateVal,
        receipt_url: data.receiptUrl || null,
        currency: data.currency || "KES",
        payment_channel: data.paymentChannel || null,
        payment_reference: data.paymentReference || null,
        is_non_deductible: data.isNonDeductible || false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", shopId] });
      toast.success("Expense recorded successfully!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to record expense.");
    },
  });
}

export function useDeleteExpense(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseId: string) => {
      return await axiosClient.delete(`/expenses/${expenseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", shopId] });
      toast.success("Expense deleted successfully.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete expense.");
    },
  });
}
