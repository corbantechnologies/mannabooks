// src/hooks/useSuppliers.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSupplierProfile, updateSupplierProfile, deleteSupplierProfile } from "@/lib/actions/suppliers";
import { toast } from "react-hot-toast";

export function useCreateSupplier(shopId: string, shopSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      phone?: string;
      supplierType: "WALK_IN" | "INDIVIDUAL" | "CORPORATE";
      taxPin?: string;
      requiresEtims?: boolean;
      paymentTerms?: string;
    }) => {
      const res = await createSupplierProfile({ shopId, shopSlug, ...data });
      if (!res.success) throw new Error(res.error || "Failed to register supplier.");
      return res;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["suppliers", shopId] });
      toast.success(`Supplier "${variables.name}" registered successfully!`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateSupplier(shopId: string, shopSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name?: string;
      email?: string;
      phone?: string;
      supplierType?: "WALK_IN" | "INDIVIDUAL" | "CORPORATE";
      taxPin?: string;
      requiresEtims?: boolean;
      paymentTerms?: string;
    }) => {
      const res = await updateSupplierProfile({ shopId, shopSlug, ...data });
      if (!res.success) throw new Error(res.error || "Failed to update supplier.");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers", shopId] });
      toast.success("Supplier profile updated!");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useDeleteSupplier(shopId: string, shopSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplierId: string) => {
      const res = await deleteSupplierProfile(supplierId, shopId, shopSlug);
      if (!res.success) throw new Error(res.error || "Failed to delete supplier.");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers", shopId] });
      toast.success("Supplier profile removed!");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
