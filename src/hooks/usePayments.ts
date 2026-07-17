// src/hooks/usePayments.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addPaymentMethod, deletePaymentMethod, setDefaultPaymentMethod, updatePaymentMethod } from "@/lib/actions/payments";
import { toast } from "react-hot-toast";

export function useAddPaymentMethod(shopId: string, shopSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; details: string; isDefault: boolean }) => {
      const res = await addPaymentMethod({ shopId, shopSlug, ...data });
      if (!res.success) throw new Error(res.error || "Failed to add payment method.");
      return res;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods", shopId] });
      toast.success(`Payment method "${variables.name}" added!`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useDeletePaymentMethod(shopId: string, shopSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (methodId: string) => {
      const res = await deletePaymentMethod(methodId, shopId, shopSlug);
      if (!res.success) throw new Error(res.error || "Failed to delete payment method.");
      return res;
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

export function useSetDefaultPaymentMethod(shopId: string, shopSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (methodId: string) => {
      const res = await setDefaultPaymentMethod(methodId, shopId, shopSlug);
      if (!res.success) throw new Error(res.error || "Failed to set default payment method.");
      return res;
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

export function useUpdatePaymentMethod(shopId: string, shopSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; name: string; details: string; isDefault: boolean }) => {
      const res = await updatePaymentMethod({ shopId, shopSlug, ...data });
      if (!res.success) throw new Error(res.error || "Failed to update payment method.");
      return res;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods", shopId] });
      toast.success(`Payment method "${variables.name}" updated!`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
