// src/hooks/useClients.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/lib/api/axios";
import { toast } from "react-hot-toast";

export interface ClientRecord {
  id: string;
  shopId: string;
  name: string;
  email: string;
  phone: string | null;
  clientType: "WALK_IN" | "INDIVIDUAL" | "CORPORATE";
  taxPin: string | null;
  requiresEtims: boolean;
  createdAt: string;
}

export interface ClientInput {
  name: string;
  email?: string;
  phone?: string;
  clientType: "WALK_IN" | "INDIVIDUAL" | "CORPORATE";
  taxPin?: string;
  requiresEtims?: boolean;
}

/**
 * Fetch all clients for a workspace using pure Axios + TanStack Query.
 */
export function useClients(shopId: string, search?: string) {
  return useQuery<ClientRecord[]>({
    queryKey: ["clients", shopId, search],
    queryFn: async () => {
      const data = await axiosClient.get("/clients", {
        params: { shop_id: shopId, search: search || undefined },
      });
      return Array.isArray(data) ? data : (data as any)?.clients || [];
    },
    enabled: Boolean(shopId),
  });
}

/**
 * Register a new partner/client using pure Axios mutation.
 */
export function useCreateClient(shopId: string, _shopSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ClientInput) => {
      return await axiosClient.post(
        "/clients",
        {
          name: input.name.trim(),
          email: input.email ? input.email.toLowerCase().trim() : "",
          phone: input.phone?.trim() || null,
          client_type: input.clientType,
          tax_pin: input.taxPin?.toUpperCase().trim() || null,
          requires_etims: Boolean(input.requiresEtims),
        },
        { params: { shop_id: shopId } }
      );
    },
    onSuccess: (data: any, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clients", shopId] });
      toast.success(`Partner "${variables.name}" registered successfully!`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create partner profile.");
    },
  });
}

/**
 * Modify an existing client profile using pure Axios mutation.
 */
export function useUpdateClient(shopId: string, _shopSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClientInput> & { id: string }) => {
      return await axiosClient.patch(
        `/clients/${id}`,
        {
          name: updates.name?.trim(),
          email: updates.email ? updates.email.toLowerCase().trim() : undefined,
          phone: updates.phone?.trim() || null,
          client_type: updates.clientType,
          tax_pin: updates.taxPin?.toUpperCase().trim() || null,
          requires_etims: updates.requiresEtims,
        },
        { params: { shop_id: shopId } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", shopId] });
      toast.success("Partner profile updated!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update partner profile.");
    },
  });
}

/**
 * Remove a client profile using pure Axios mutation.
 */
export function useDeleteClient(shopId: string, _shopSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      return await axiosClient.delete(`/clients/${clientId}`, {
        params: { shop_id: shopId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", shopId] });
      toast.success("Partner removed from directory.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete partner.");
    },
  });
}

export function useClient(shopId: string, clientId: string) {
  return useQuery<any>({
    queryKey: ["client", shopId, clientId],
    queryFn: async () => {
      return await axiosClient.get(`/clients/${clientId}`, {
        params: { shop_id: shopId },
      });
    },
    enabled: Boolean(shopId && clientId),
  });
}

export function useClientStatement(
  shopId: string,
  clientId: string,
  startDate?: string,
  endDate?: string
) {
  return useQuery<any>({
    queryKey: ["client-statement", shopId, clientId, startDate, endDate],
    queryFn: async () => {
      const res: any = await axiosClient.get(`/clients/${clientId}/statement`, {
        params: {
          shop_id: shopId,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        },
      });
      return res?.data || res;
    },
    enabled: Boolean(shopId && clientId),
  });
}

