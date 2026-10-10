// src/hooks/useLoyalty.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "@/lib/api/axios";
import { toast } from "react-hot-toast";

export interface LoyaltyProgramData {
  id: string;
  isEnabled: boolean;
  engineMode: "OFF" | "POINTS_ONLY" | "TIERS_ONLY" | "HYBRID";
  programName: string;
  earnRateKes: string;
  pointValueKes: string;
  minRedeemPoints: number;
  pointsExpiryDays?: number | null;
}

export interface LoyaltyTierData {
  id: string;
  name: string;
  minSpendKes: string;
  discountPercent: string;
  pointsMultiplier: string;
  badgeColor: string;
  displayOrder: number;
}

export function useLoyaltyProgram(shopId: string) {
  return useQuery<{ program: any; tiers: LoyaltyTierData[] }>({
    queryKey: ["loyalty-program", shopId],
    queryFn: async () => {
      const res: any = await axiosClient.get(`/operations/loyalty/program?shop_id=${shopId}`);
      return res as { program: any; tiers: LoyaltyTierData[] };
    },
    enabled: Boolean(shopId),
  });
}

export function useUpdateLoyaltyProgram(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      name?: string;
      pointsPerKes?: number;
      kesPerPoint?: number;
      minRedeemPoints?: number;
      pointsExpiryDays?: number | null;
      isActive?: boolean;
    }) => {
      return await axiosClient.post("/operations/loyalty/program", {
        shop_id: shopId,
        name: payload.name || "Rewards Club",
        points_per_kes: payload.pointsPerKes ?? 0.01,
        kes_per_point: payload.kesPerPoint ?? 1.0,
        min_redeem_points: payload.minRedeemPoints ?? 50,
        points_expiry_days: payload.pointsExpiryDays ?? null,
        is_active: payload.isActive ?? true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-program", shopId] });
      toast.success("Loyalty program rules committed!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update loyalty program.");
    },
  });
}

export function useAdjustLoyaltyPoints(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      clientId: string;
      points: number;
      movementType: "EARN" | "REDEEM" | "EXPIRE" | "ADJUST";
      reason?: string;
      sourceDocumentId?: string;
    }) => {
      return await axiosClient.post("/operations/loyalty/adjust", {
        shop_id: shopId,
        client_id: payload.clientId,
        points: payload.points,
        movement_type: payload.movementType,
        reason: payload.reason || "Manual adjustment",
        source_document_id: payload.sourceDocumentId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-program", shopId] });
      toast.success("Loyalty points updated!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to adjust points.");
    },
  });
}

export function useCreateTier(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      minSpendKes?: string | number;
      discountPercent?: string | number;
      displayOrder?: number;
    }) => {
      const res: any = await axiosClient.post("/operations/loyalty/tiers", {
        shop_id: shopId,
        name: payload.name,
        min_points: parseInt(String(payload.minSpendKes || 0), 10) || 0,
        discount_percentage: parseFloat(String(payload.discountPercent || 0)) || 0,
        display_order: payload.displayOrder || 0,
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-program", shopId] });
      toast.success("Membership tier created!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create tier.");
    },
  });
}

export function useDeleteTier(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tierId: string) => {
      return await axiosClient.delete(`/operations/loyalty/tiers/${tierId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-program", shopId] });
      toast.success("Membership tier deleted!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete tier.");
    },
  });
}

