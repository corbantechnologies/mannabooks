// src/hooks/useGroupConsolidation.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/lib/api/axios";
import { toast } from "react-hot-toast";

export interface CreateGroupInput {
  name: string;
  code: string;
  reporting_currency?: string;
  description?: string;
  initial_shop_id?: string;
}

export interface AddShopToGroupInput {
  shop_id: string;
  entity_type?: "PARENT" | "SUBSIDIARY" | "SISTER" | "DIVISION";
  ownership_percentage?: number;
}

export interface RecordInterCompanyTxInput {
  group_id: string;
  source_shop_id: string;
  target_shop_id: string;
  source_document_id?: string;
  target_bill_id?: string;
  amount: number;
  currency?: string;
  transaction_type?: string;
  notes?: string;
}

export function useGroups() {
  return useQuery({
    queryKey: ["group-consolidation", "groups"],
    queryFn: async () => {
      const res: any = await axiosClient.get("/group-consolidation/groups");
      return res?.groups || [];
    },
  });
}

export function useGroupDetails(groupId?: string | null) {
  return useQuery({
    queryKey: ["group-consolidation", "group", groupId],
    queryFn: async () => {
      if (!groupId) return null;
      const res: any = await axiosClient.get(`/group-consolidation/groups/${groupId}`);
      return res?.group || null;
    },
    enabled: Boolean(groupId),
  });
}

export function useConsolidatedPnL(groupId?: string | null, period: string = "THIS_MONTH") {
  return useQuery({
    queryKey: ["group-consolidation", "pnl", groupId, period],
    queryFn: async () => {
      if (!groupId) return null;
      const res: any = await axiosClient.get("/group-consolidation/pnl", {
        params: { group_id: groupId, period },
      });
      return res;
    },
    enabled: Boolean(groupId),
  });
}

export function useConsolidatedBalanceSheet(groupId?: string | null) {
  return useQuery({
    queryKey: ["group-consolidation", "balance-sheet", groupId],
    queryFn: async () => {
      if (!groupId) return null;
      const res: any = await axiosClient.get("/group-consolidation/balance-sheet", {
        params: { group_id: groupId },
      });
      return res;
    },
    enabled: Boolean(groupId),
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateGroupInput) => {
      const res: any = await axiosClient.post("/group-consolidation/groups", input);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-consolidation"] });
      toast.success("Holding group created successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create group.");
    },
  });
}

export function useAddGroupMember(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddShopToGroupInput) => {
      const res: any = await axiosClient.post(`/group-consolidation/groups/${groupId}/members`, input);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-consolidation"] });
      toast.success("Subsidiary workspace enrolled successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to enroll subsidiary.");
    },
  });
}

export function useRecordInterCompanyTx() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RecordInterCompanyTxInput) => {
      const res: any = await axiosClient.post("/group-consolidation/transactions", input);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-consolidation"] });
      toast.success("Inter-company transaction recorded!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to record transaction.");
    },
  });
}
