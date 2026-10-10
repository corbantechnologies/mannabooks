// src/hooks/useCRM.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/lib/api/axios";
import { toast } from "react-hot-toast";

export function useDeals(shopId: string) {
  return useQuery({
    queryKey: ["crm", "deals", shopId],
    queryFn: async () => {
      const res: any = await axiosClient.get("/crm/deals", { params: { shop_id: shopId } });
      return res?.deals || [];
    },
    enabled: Boolean(shopId),
  });
}

export function useCreateDeal(shopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      return await axiosClient.post("/crm/deals", { shop_id: shopId, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm", "deals", shopId] });
      toast.success("Deal created successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create deal.");
    },
  });
}

export function useUpdateDealStage(shopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ dealId, stage }: { dealId: string; stage: string }) => {
      return await axiosClient.patch(`/crm/deals/${dealId}/stage`, { stage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm", "deals", shopId] });
      toast.success("Deal stage updated!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update deal stage.");
    },
  });
}

export function useContracts(shopId: string) {
  return useQuery({
    queryKey: ["crm", "contracts", shopId],
    queryFn: async () => {
      const res: any = await axiosClient.get("/crm/contracts", { params: { shop_id: shopId } });
      return res?.contracts || [];
    },
    enabled: Boolean(shopId),
  });
}

export function useCreateContract(shopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      return await axiosClient.post("/crm/contracts", { shop_id: shopId, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm", "contracts", shopId] });
      toast.success("Contract created!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create contract.");
    },
  });
}

export function useProposals(shopId: string) {
  return useQuery({
    queryKey: ["crm", "proposals", shopId],
    queryFn: async () => {
      const res: any = await axiosClient.get("/crm/proposals", { params: { shop_id: shopId } });
      return res?.proposals || [];
    },
    enabled: Boolean(shopId),
  });
}

export function useCreateProposal(shopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      return await axiosClient.post("/crm/proposals", { shop_id: shopId, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm", "proposals", shopId] });
      toast.success("Proposal created!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create proposal.");
    },
  });
}

export function useProjects(shopId: string) {
  return useQuery({
    queryKey: ["crm", "projects", shopId],
    queryFn: async () => {
      const res: any = await axiosClient.get("/crm/projects", { params: { shop_id: shopId } });
      return res?.projects || [];
    },
    enabled: Boolean(shopId),
  });
}

export function useCreateProject(shopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      return await axiosClient.post("/crm/projects", { shop_id: shopId, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm", "projects", shopId] });
      toast.success("Project created!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create project.");
    },
  });
}
