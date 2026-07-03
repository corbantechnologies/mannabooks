// src/hooks/useClients.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClientProfile, updateClientProfile, deleteClientProfile } from "@/lib/actions/clients";
import { toast } from "react-hot-toast";

export function useCreateClient(shopId: string, shopSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; email: string; phone?: string; clientType: "WALK_IN" | "INDIVIDUAL" | "CORPORATE"; taxPin?: string }) => {
      const res = await createClientProfile({ shopId, shopSlug, ...data });
      if (!res.success) throw new Error(res.error || "Failed to create client.");
      return res;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clients", shopId] });
      toast.success(`Client "${variables.name}" registered!`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateClient(shopId: string, shopSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; name?: string; email?: string; phone?: string; clientType?: "WALK_IN" | "INDIVIDUAL" | "CORPORATE"; taxPin?: string }) => {
      const res = await updateClientProfile({ shopId, shopSlug, ...data });
      if (!res.success) throw new Error(res.error || "Failed to update client.");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", shopId] });
      toast.success("Client profile updated!");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useDeleteClient(shopId: string, shopSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      const res = await deleteClientProfile(clientId, shopId, shopSlug);
      if (!res.success) throw new Error(res.error || "Failed to delete client.");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", shopId] });
      toast.success("Client profile deleted!");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
