// src/hooks/useSuppliers.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "@/lib/api/axios";
import { toast } from "react-hot-toast";

export interface SupplierItem {
  id: string;
  shop_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  supplier_type: string;
  tax_pin?: string | null;
  requires_etims: boolean;
  payment_terms?: string | null;
  created_at: string;
}

export function useSuppliers(shopId: string, search?: string) {
  return useQuery({
    queryKey: ["suppliers", shopId, search],
    queryFn: async () => {
      const params: any = { shop_id: shopId };
      if (search) params.search = search;
      const res = await axiosClient.get<any, SupplierItem[]>("/suppliers", { params });
      return res;
    },
    enabled: Boolean(shopId),
  });
}

export function useCreateSupplier(shopId: string, _shopSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      email?: string;
      phone?: string;
      supplierType?: "WALK_IN" | "INDIVIDUAL" | "CORPORATE";
      taxPin?: string;
      requiresEtims?: boolean;
      paymentTerms?: string;
    }) => {
      const payload = {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        supplier_type: data.supplierType || "CORPORATE",
        tax_pin: data.taxPin || null,
        requires_etims: Boolean(data.requiresEtims),
        payment_terms: data.paymentTerms || "NET_30",
      };
      return await axiosClient.post("/suppliers", payload, {
        params: { shop_id: shopId },
      });
    },
    onSuccess: (data: any, variables) => {
      queryClient.invalidateQueries({ queryKey: ["suppliers", shopId] });
      toast.success(`Supplier "${variables.name}" registered successfully!`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateSupplier(shopId: string, _shopSlug?: string) {
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
      const payload: any = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.email !== undefined) payload.email = data.email || null;
      if (data.phone !== undefined) payload.phone = data.phone || null;
      if (data.supplierType !== undefined) payload.supplier_type = data.supplierType;
      if (data.taxPin !== undefined) payload.tax_pin = data.taxPin || null;
      if (data.requiresEtims !== undefined) payload.requires_etims = data.requiresEtims;
      if (data.paymentTerms !== undefined) payload.payment_terms = data.paymentTerms;

      return await axiosClient.patch(`/suppliers/${data.id}`, payload, {
        params: { shop_id: shopId },
      });
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

export function useDeleteSupplier(shopId: string, _shopSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (supplierId: string) => {
      return await axiosClient.delete(`/suppliers/${supplierId}`, {
        params: { shop_id: shopId },
      });
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
