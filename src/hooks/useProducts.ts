// src/hooks/useProducts.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "@/lib/api/axios";
import { toast } from "react-hot-toast";

export interface ProductItem {
  id: string;
  shop_id: string;
  name: string;
  sku?: string | null;
  item_type: "PRODUCT" | "SERVICE";
  unit_price: number | string;
  cost_price?: number | string | null;
  default_tax_type: "V_16" | "V_0" | "EXEMPT";
  track_stock: boolean;
  stock_quantity: number | string;
  reorder_threshold?: number | string | null;
  default_location_id?: string | null;
  item_cls_cd?: string | null;
  pkg_unit_cd?: string | null;
  created_at: string;
}

export function useProducts(shopId: string, itemType?: string, search?: string) {
  return useQuery({
    queryKey: ["products", shopId, itemType, search],
    queryFn: async () => {
      const params: any = { shop_id: shopId };
      if (itemType && itemType !== "ALL") params.item_type = itemType;
      if (search) params.search = search;
      const res = await axiosClient.get<any, ProductItem[]>("/items", { params });
      return res;
    },
    enabled: Boolean(shopId),
  });
}

export function useStockLocations(shopId: string) {
  return useQuery({
    queryKey: ["stock-locations", shopId],
    queryFn: async () => {
      const res = await axiosClient.get<any, any[]>("/items/locations", {
        params: { shop_id: shopId },
      });
      return res;
    },
    enabled: Boolean(shopId),
  });
}

export function useCreateProduct(shopId: string, _shopSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      sku?: string;
      itemType?: "PRODUCT" | "SERVICE";
      unitPrice: number;
      costPrice?: number;
      defaultTaxType?: "V_16" | "V_0" | "EXEMPT";
      trackStock?: boolean;
      stockQuantity?: number;
      reorderThreshold?: number;
      locationId?: string;
    }) => {
      const payload = {
        name: data.name,
        sku: data.sku || null,
        item_type: data.itemType || "PRODUCT",
        unit_price: data.unitPrice,
        cost_price: data.costPrice || 0,
        default_tax_type: data.defaultTaxType || "V_16",
        track_stock: Boolean(data.trackStock),
        stock_quantity: data.stockQuantity || 0,
        reorder_threshold: data.reorderThreshold || 0,
        default_location_id: data.locationId || null,
      };
      return await axiosClient.post("/items", payload, {
        params: { shop_id: shopId },
      });
    },
    onSuccess: (data: any, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products", shopId] });
      toast.success(`Catalog item "${variables.name}" created!`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateProduct(shopId: string, _shopSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name?: string;
      sku?: string;
      itemType?: "PRODUCT" | "SERVICE";
      unitPrice?: number;
      costPrice?: number;
      defaultTaxType?: "V_16" | "V_0" | "EXEMPT";
      trackStock?: boolean;
      stockQuantity?: number;
      reorderThreshold?: number;
      locationId?: string;
    }) => {
      const payload: any = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.sku !== undefined) payload.sku = data.sku || null;
      if (data.itemType !== undefined) payload.item_type = data.itemType;
      if (data.unitPrice !== undefined) payload.unit_price = data.unitPrice;
      if (data.costPrice !== undefined) payload.cost_price = data.costPrice;
      if (data.defaultTaxType !== undefined) payload.default_tax_type = data.defaultTaxType;
      if (data.trackStock !== undefined) payload.track_stock = data.trackStock;
      if (data.reorderThreshold !== undefined) payload.reorder_threshold = data.reorderThreshold;
      if (data.locationId !== undefined) payload.default_location_id = data.locationId;

      return await axiosClient.patch(`/items/${data.id}`, payload, {
        params: { shop_id: shopId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", shopId] });
      toast.success("Catalog item updated!");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useDeleteProduct(shopId: string, _shopSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      return await axiosClient.delete(`/items/${productId}`, {
        params: { shop_id: shopId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", shopId] });
      toast.success("Catalog item deleted!");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useAdjustStock(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      productId: string;
      locationId: string;
      movementType: "ADJUSTMENT_IN" | "ADJUSTMENT_OUT" | "DAMAGE" | "RETURN";
      quantity: number;
      adjustmentReason?: string;
      notes?: string;
    }) => {
      const payload = {
        product_id: data.productId,
        location_id: data.locationId,
        movement_type: data.movementType,
        quantity: data.quantity,
        adjustment_reason: data.adjustmentReason || null,
        notes: data.notes || null,
      };
      return await axiosClient.post("/items/inventory/adjust", payload, {
        params: { shop_id: shopId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", shopId] });
      toast.success("Stock adjustment recorded!");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
