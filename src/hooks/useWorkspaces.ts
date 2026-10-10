// src/hooks/useWorkspaces.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "@/lib/api/axios";
import { toast } from "react-hot-toast";

export interface WorkspaceItem {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export interface WorkspaceContextData {
  shop: any;
  role: string;
  user: any;
}

export function useMyWorkspaces() {
  return useQuery({
    queryKey: ["my-workspaces"],
    queryFn: async () => {
      const res: any = await axiosClient.get("/workspaces/my-workspaces");
      return (res || []) as WorkspaceItem[];
    },
  });
}

export function useWorkspaceContext(slug: string) {
  return useQuery({
    queryKey: ["workspace-context", slug],
    queryFn: async () => {
      const res: any = await axiosClient.get(`/workspaces/by-slug/${slug}/context`);
      return res as WorkspaceContextData;
    },
    enabled: Boolean(slug),
  });
}

export function useUpdateWorkspaceSettings(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      return await axiosClient.patch(`/workspaces/${shopId}/settings`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-context"] });
      toast.success("Workspace configuration updated successfully.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update workspace configuration.");
    },
  });
}

export function useDeleteWorkspace(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (confirmation: string) => {
      const res: any = await axiosClient.delete(
        `/workspaces/${shopId}?confirmation=${encodeURIComponent(confirmation)}`
      );
      return res as { success: boolean; nextSlug?: string | null };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-workspaces"] });
      toast.success("Workspace deleted permanently.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete workspace.");
    },
  });
}
