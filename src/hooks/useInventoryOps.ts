// src/hooks/useInventoryOps.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/lib/api/axios";
import { toast } from "react-hot-toast";

export function useStockLocations(shopId: string) {
  return useQuery({
    queryKey: ["inventory", "locations", shopId],
    queryFn: async () => {
      const res: any = await axiosClient.get("/items/locations", { params: { shop_id: shopId } });
      return Array.isArray(res) ? res : res?.locations || [];
    },
    enabled: Boolean(shopId),
  });
}

export function useCreateStockTransfer(shopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      return await axiosClient.post("/items/transfers", { shop_id: shopId, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Stock transfer recorded!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to transfer stock.");
    },
  });
}

export function useStocktakes(shopId: string) {
  return useQuery({
    queryKey: ["inventory", "stocktakes", shopId],
    queryFn: async () => {
      const res: any = await axiosClient.get("/operations/stocktakes", { params: { shop_id: shopId } });
      return res?.stocktakes || [];
    },
    enabled: Boolean(shopId),
  });
}

export function useCreateStocktake(shopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      return await axiosClient.post("/operations/stocktakes", { shop_id: shopId, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "stocktakes", shopId] });
      toast.success("Stocktake session created!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create stocktake session.");
    },
  });
}

export function useBoms(shopId: string) {
  return useQuery({
    queryKey: ["inventory", "boms", shopId],
    queryFn: async () => {
      const res: any = await axiosClient.get("/operations/boms", { params: { shop_id: shopId } });
      return res?.boms || [];
    },
    enabled: Boolean(shopId),
  });
}

export function useCreateBom(shopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      return await axiosClient.post("/operations/boms", { shop_id: shopId, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "boms", shopId] });
      toast.success("Bill of Materials created!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create BOM.");
    },
  });
}

export function useCreateLocation(shopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; code?: string; isDefault?: boolean }) => {
      return await axiosClient.post("/items/locations", {
        shop_id: shopId,
        name: data.name,
        code: data.code,
        is_default: data.isDefault,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "locations", shopId] });
      queryClient.invalidateQueries({ queryKey: ["stock-locations", shopId] });
      toast.success("Location created successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create location.");
    },
  });
}

export function useUpdateLocation(shopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { locationId: string; name: string; code?: string; isDefault?: boolean; isActive?: boolean }) => {
      return await axiosClient.patch(`/items/locations/${data.locationId}`, {
        name: data.name,
        code: data.code,
        is_default: data.isDefault,
        is_active: data.isActive,
      }, { params: { shop_id: shopId } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "locations", shopId] });
      queryClient.invalidateQueries({ queryKey: ["stock-locations", shopId] });
      toast.success("Location updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update location.");
    },
  });
}

export function useDeleteLocation(shopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (locationId: string) => {
      return await axiosClient.delete(`/items/locations/${locationId}`, {
        params: { shop_id: shopId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "locations", shopId] });
      queryClient.invalidateQueries({ queryKey: ["stock-locations", shopId] });
      toast.success("Location deleted.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete location.");
    },
  });
}

