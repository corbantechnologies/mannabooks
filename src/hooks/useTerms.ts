// src/hooks/useTerms.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "@/lib/api/axios";
import { toast } from "react-hot-toast";

export interface ShopTermItem {
  id: string;
  shopId: string;
  title: string;
  content: string;
  displayOrder?: number;
  isDefaultInvoice: boolean;
  isDefaultQuote: boolean;
  isDefaultReceipt: boolean;
  isDefaultDelivery: boolean;
  isDefaultCatalog: boolean;
  createdAt?: string | null;
}

export function useShopTerms(shopId: string) {
  return useQuery({
    queryKey: ["shop-terms", shopId],
    queryFn: async () => {
      const res: any = await axiosClient.get(`/workspaces/${shopId}/terms`);
      return (res.terms || []) as ShopTermItem[];
    },
    enabled: Boolean(shopId),
  });
}

export function useCreateShopTerm(shopId: string, _shopSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      isDefaultInvoice?: boolean;
      isDefaultCatalog?: boolean;
      isDefaultQuote?: boolean;
      isDefaultReceipt?: boolean;
      isDefaultDelivery?: boolean;
    }) => {
      return await axiosClient.post(`/workspaces/${shopId}/terms`, {
        title: data.title,
        content: data.content,
        is_default_invoice: Boolean(data.isDefaultInvoice),
        is_default_catalog: Boolean(data.isDefaultCatalog),
        is_default_quote: Boolean(data.isDefaultQuote),
        is_default_receipt: Boolean(data.isDefaultReceipt),
        is_default_delivery: Boolean(data.isDefaultDelivery),
      });
    },
    onSuccess: (data: any, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shop-terms", shopId] });
      toast.success(`Term "${variables.title}" saved to library!`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateShopTerm(shopId: string, _shopSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      title?: string;
      content?: string;
      isDefaultInvoice?: boolean;
      isDefaultCatalog?: boolean;
      isDefaultQuote?: boolean;
      isDefaultReceipt?: boolean;
      isDefaultDelivery?: boolean;
    }) => {
      return await axiosClient.patch(`/workspaces/${shopId}/terms/${data.id}`, {
        title: data.title,
        content: data.content,
        is_default_invoice: data.isDefaultInvoice,
        is_default_catalog: data.isDefaultCatalog,
        is_default_quote: data.isDefaultQuote,
        is_default_receipt: data.isDefaultReceipt,
        is_default_delivery: data.isDefaultDelivery,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-terms", shopId] });
      toast.success("Term updated successfully!");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useDeleteShopTerm(shopId: string, _shopSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (termId: string) => {
      return await axiosClient.delete(`/workspaces/${shopId}/terms/${termId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-terms", shopId] });
      toast.success("Term deleted from library!");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useSeedDefaultTerms(shopId: string, _shopSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await axiosClient.post(`/workspaces/${shopId}/terms/seed`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-terms", shopId] });
      toast.success("Default commercial terms seeded!");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
