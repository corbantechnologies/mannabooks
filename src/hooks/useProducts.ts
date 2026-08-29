// src/hooks/useProducts.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProductItem, updateProductItem, deleteProductItem } from "@/lib/actions/products";
import { toast } from "react-hot-toast";

export function useCreateProduct(shopId: string, shopSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      sku?: string;
      itemType?: "PRODUCT" | "SERVICE";
      unitPrice: number;
      costPrice?: number;
      defaultTaxType: "V_16" | "V_0" | "EXEMPT";
      trackStock?: boolean;
      stockQuantity?: number;
      reorderThreshold?: number;
      locationId?: string;
    }) => {
      const res = await createProductItem({ shopId, shopSlug, ...data });
      if (!res.success) throw new Error(('error' in res ? res.error : undefined) || "Failed to create catalog item.");
      return res;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products", shopId] });
      toast.success(`Catalog item "${variables.name}" created!`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateProduct(shopId: string, shopSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name?: string;
      sku?: string;
      itemType?: "PRODUCT" | "SERVICE";
      unitPrice?: number;
      costPrice?: number;
      defaultTaxType?: "V_16" | "V_0" | "EXEMPT";
      trackStock?: boolean;
      stockQuantity?: number;
      reorderThreshold?: number;
      locationId?: string;
    }) => {
      const res = await updateProductItem({ shopId, shopSlug, ...data });
      if (!res.success) throw new Error(('error' in res ? res.error : undefined) || "Failed to update catalog item.");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", shopId] });
      toast.success("Catalog item updated!");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useDeleteProduct(shopId: string, shopSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const res = await deleteProductItem(productId, shopId, shopSlug);
      if (!res.success) throw new Error(res.error || "Failed to delete product.");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", shopId] });
      toast.success("Catalog item deleted!");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
