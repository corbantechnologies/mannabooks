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
