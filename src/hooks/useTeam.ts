// src/hooks/useTeam.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "@/lib/api/axios";
import { toast } from "react-hot-toast";

export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  customPermissions: Record<string, boolean>;
}

export interface TeamInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export function useTeam(shopId: string) {
  return useQuery({
    queryKey: ["team", shopId],
    queryFn: async () => {
      const res: any = await axiosClient.get(`/workspaces/${shopId}/members`);
      return {
        members: (res.members || []) as TeamMember[],
        invitations: (res.invitations || []) as TeamInvite[],
      };
    },
    enabled: Boolean(shopId),
  });
}

export function useInviteMember(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      role: string;
      customPermissions?: Record<string, boolean>;
    }) => {
      return await axiosClient.post(`/workspaces/${shopId}/invitations`, {
        email: data.email,
        role: data.role,
        custom_permissions: data.customPermissions || {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", shopId] });
      toast.success("Team invitation sent successfully!");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateMember(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      memberId: string;
      role?: string;
      customPermissions?: Record<string, boolean>;
    }) => {
      return await axiosClient.patch(`/workspaces/${shopId}/members/${data.memberId}`, {
        role: data.role,
        custom_permissions: data.customPermissions,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", shopId] });
      toast.success("Team member updated successfully!");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useRemoveMember(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      return await axiosClient.delete(`/workspaces/${shopId}/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", shopId] });
      toast.success("Team member removed from workspace!");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useRevokeInvite(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      return await axiosClient.delete(`/workspaces/${shopId}/invitations/${inviteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", shopId] });
      toast.success("Invitation revoked!");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
