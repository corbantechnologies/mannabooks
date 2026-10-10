// src/hooks/useAdmin.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/lib/api/axios";
import { toast } from "react-hot-toast";

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const res: any = await axiosClient.get("/admin/stats");
      return res?.stats;
    },
  });
}

export function useAdminUsers(search?: string, plan?: string, limit = 100) {
  return useQuery({
    queryKey: ["admin", "users", search, plan, limit],
    queryFn: async () => {
      const res: any = await axiosClient.get("/admin/users", {
        params: { search, plan, limit },
      });
      return res?.users || [];
    },
  });
}

export function useAdminWorkspaces(search?: string, plan?: string, limit = 100) {
  return useQuery({
    queryKey: ["admin", "workspaces", search, plan, limit],
    queryFn: async () => {
      const res: any = await axiosClient.get("/admin/workspaces", {
        params: { search, plan_filter: plan, limit },
      });
      return res?.workspaces || [];
    },
  });
}

export function useUpdateWorkspacePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ shopId, data }: { shopId: string; data: any }) => {
      const res: any = await axiosClient.patch(`/admin/workspaces/${shopId}/plan`, data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "workspaces"] });
      toast.success("Workspace plan updated!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update workspace plan.");
    },
  });
}

export function useToggleWorkspaceSuspension() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ shopId, isSuspended, reason }: { shopId: string; isSuspended: boolean; reason?: string }) => {
      const res: any = await axiosClient.post(`/admin/workspaces/${shopId}/toggle-suspension`, {
        is_suspended: isSuspended,
        reason,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "workspaces"] });
      toast.success("Workspace suspension status updated!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update suspension status.");
    },
  });
}

export function useUpdateUserSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
      const res: any = await axiosClient.patch(`/admin/users/${userId}/subscription`, data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User subscription updated!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update user subscription.");
    },
  });
}

export function useToggleLifetimePro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, isLifetimePro }: { userId: string; isLifetimePro: boolean }) => {
      const res: any = await axiosClient.post(`/admin/users/${userId}/toggle-lifetime-pro`, {
        is_lifetime_pro: isLifetimePro,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Lifetime PRO status updated!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update Lifetime PRO.");
    },
  });
}

export function useToggleSuperAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, isSuperAdmin }: { userId: string; isSuperAdmin: boolean }) => {
      const res: any = await axiosClient.post(`/admin/users/${userId}/toggle-super-admin`, {
        is_super_admin: isSuperAdmin,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Super Admin privileges updated!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update privileges.");
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res: any = await axiosClient.delete(`/admin/users/${userId}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User deleted successfully.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete user.");
    },
  });
}
