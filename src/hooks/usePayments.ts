// src/hooks/usePayments.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "@/lib/api/axios";
import { toast } from "react-hot-toast";

export interface PaymentMethodItem {
  id: string;
  shopId: string;
  type?: string;
  name: string;
  details: string;
  isDefault: boolean;
  instructions?: string | null;
  createdAt?: string | null;
}

export function usePaymentMethods(shopId: string) {
  return useQuery({
    queryKey: ["payment-methods", shopId],
    queryFn: async () => {
      const res: any = await axiosClient.get(`/workspaces/${shopId}/payment-methods`);
      return (res.paymentMethods || []) as PaymentMethodItem[];
    },
    enabled: Boolean(shopId),
  });
}

export function useAddPaymentMethod(shopId: string, _shopSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      details: string;
      isDefault: boolean;
      type?: string;
      instructions?: string;
    }) => {
      return await axiosClient.post(`/workspaces/${shopId}/payment-methods`, {
        name: data.name,
        details: data.details,
        is_default: data.isDefault,
        type: data.type || "OTHER",
        instructions: data.instructions || null,
      });
    },
    onSuccess: (data: any, variables) => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods", shopId] });
      toast.success(`Payment method "${variables.name}" added!`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdatePaymentMethod(shopId: string, _shopSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id?: string;
      methodId?: string;
      name?: string;
      details?: string;
      isDefault?: boolean;
      type?: string;
    }) => {
      const mid = data.methodId || data.id;
      return await axiosClient.patch(`/workspaces/${shopId}/payment-methods/${mid}`, {
        name: data.name,
        details: data.details,
        is_default: data.isDefault,
        type: data.type,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods", shopId] });
      toast.success("Payment method updated!");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useDeletePaymentMethod(shopId: string, _shopSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (methodId: string) => {
      return await axiosClient.delete(`/workspaces/${shopId}/payment-methods/${methodId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods", shopId] });
      toast.success("Payment method deleted!");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useSetDefaultPaymentMethod(shopId: string, _shopSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (methodId: string) => {
      return await axiosClient.patch(`/workspaces/${shopId}/payment-methods/${methodId}`, {
        is_default: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods", shopId] });
      toast.success("Default payment method updated!");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
