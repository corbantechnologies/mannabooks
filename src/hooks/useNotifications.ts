// src/hooks/useNotifications.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "@/lib/api/axios";

export interface NotificationItem {
  id: string;
  user_id?: string;
  shop_id?: string | null;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  is_read?: boolean;
  isRead?: boolean;
  created_at?: string;
  createdAt?: string;
}

export function useNotifications(shopId?: string) {
  return useQuery({
    queryKey: ["notifications", shopId],
    queryFn: async () => {
      const res: any = await axiosClient.get("/governance/notifications", {
        params: shopId ? { shop_id: shopId } : undefined,
      });
      const list: NotificationItem[] = res.notifications || [];
      const unreadCount = list.filter((n) => !n.is_read && !n.isRead).length;
      return {
        notifications: list,
        unreadCount,
      };
    },
    refetchInterval: 30000, // Poll notifications every 30 seconds
  });
}

export function useMarkNotificationRead(shopId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      return await axiosClient.patch(`/governance/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", shopId] });
    },
  });
}

export function useMarkAllNotificationsRead(shopId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await axiosClient.patch("/governance/notifications/read-all", {}, {
        params: shopId ? { shop_id: shopId } : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", shopId] });
    },
  });
}
