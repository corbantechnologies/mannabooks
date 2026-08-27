// src/hooks/useTerms.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createShopTerm, updateShopTerm, deleteShopTerm, seedDefaultShopTerms } from "@/lib/actions/terms";
import { toast } from "react-hot-toast";

export function useCreateShopTerm(shopId: string, shopSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      isDefaultInvoice?: boolean;
      isDefaultCatalog?: boolean;
    }) => {
      const res = await createShopTerm({ shopId, shopSlug, ...data });
      if (!res.success) throw new Error(res.error || "Failed to create term.");
      return res;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shop-terms", shopId] });
      toast.success(`Term "${variables.title}" saved to library!`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateShopTerm(shopId: string, shopSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      title: string;
      content: string;
      isDefaultInvoice?: boolean;
      isDefaultCatalog?: boolean;
    }) => {
      const res = await updateShopTerm({ shopId, shopSlug, ...data });
      if (!res.success) throw new Error(res.error || "Failed to update term.");
      return res;
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

export function useDeleteShopTerm(shopId: string, shopSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteShopTerm({ id, shopId, shopSlug });
      if (!res.success) throw new Error(res.error || "Failed to delete term.");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-terms", shopId] });
      toast.success("Term removed from library!");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useSeedDefaultTerms(shopId: string, shopSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await seedDefaultShopTerms(shopId, shopSlug);
      if (!res.success) throw new Error(res.error || "Failed to load preset terms.");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-terms", shopId] });
      toast.success("Standard Kenyan SME terms loaded into your library!");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
