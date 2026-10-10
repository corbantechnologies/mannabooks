// src/hooks/useCurrencies.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/lib/api/axios";
import { toast } from "react-hot-toast";

export interface ShopCurrencyRecord {
  id: string;
  shopId: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: string;
  isEnabled: boolean;
  isBaseCurrency?: boolean;
}

export interface SaveCurrencyInput {
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isEnabled?: boolean;
}

/**
 * Fetch workspace currencies via pure Axios + TanStack Query.
 */
export function useCurrencies(shopId: string) {
  return useQuery<ShopCurrencyRecord[]>({
    queryKey: ["currencies", shopId],
    queryFn: async () => {
      const data: any = await axiosClient.get(`/workspaces/${shopId}/currencies`);
      return Array.isArray(data) ? data : data?.currencies || [];
    },
    enabled: Boolean(shopId),
  });
}

/**
 * Add or update currency via pure Axios mutation.
 */
export function useSaveCurrency(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveCurrencyInput) => {
      return await axiosClient.post(`/workspaces/${shopId}/currencies`, {
        code: input.code.toUpperCase().trim(),
        name: input.name.trim(),
        symbol: input.symbol.trim(),
        exchange_rate: input.exchangeRate,
        is_enabled: input.isEnabled ?? true,
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["currencies", shopId] });
      toast.success(`${variables.code} saved to portfolio!`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save currency.");
    },
  });
}

/**
 * Remove currency via pure Axios mutation.
 */
export function useDeleteCurrency(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (currencyId: string) => {
      return await axiosClient.delete(`/workspaces/${shopId}/currencies/${currencyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currencies", shopId] });
      toast.success("Currency removed from portfolio.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to remove currency.");
    },
  });
}
