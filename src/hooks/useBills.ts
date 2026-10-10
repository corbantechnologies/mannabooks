// src/hooks/useBills.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/lib/api/axios";
import { toast } from "react-hot-toast";

export interface BillItemInput {
  account_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  po_item_id?: string;
  po_unit_price?: number;
  grn_quantity?: number;
}

export interface CreateBillInput {
  supplier_id: string;
  reference?: string;
  bill_date?: string;
  due_date?: string;
  wht_rate: number;
  notes?: string;
  source_po_id?: string;
  source_grn_id?: string;
  variance_notes?: string;
  allow_variance_override?: boolean;
  attachment_url?: string;
  attachment_name?: string;
  attachment_size?: number;
  items: BillItemInput[];
}

export interface PayBillInput {
  payment_amount: number;
  payment_channel: string;
  payment_reference: string;
  payment_date?: string;
  notes?: string;
}

export function useBills(shopId: string, status?: string, supplierId?: string) {
  return useQuery({
    queryKey: ["bills", shopId, status, supplierId],
    queryFn: async () => {
      const res: any = await axiosClient.get("/bills", {
        params: {
          shop_id: shopId,
          status: status && status !== "ALL" ? status : undefined,
          supplier_id: supplierId && supplierId !== "ALL" ? supplierId : undefined,
        },
      });
      return res?.bills || [];
    },
    enabled: Boolean(shopId),
  });
}

export function useApprovedPosAndGrns(shopId: string, supplierId?: string) {
  return useQuery({
    queryKey: ["approved-pos-grns", shopId, supplierId],
    queryFn: async () => {
      const res: any = await axiosClient.get("/bills/approved-pos-grns", {
        params: {
          shop_id: shopId,
          supplier_id: supplierId && supplierId !== "ALL" ? supplierId : undefined,
        },
      });
      return { pos: res?.pos || [], grns: res?.grns || [] };
    },
    enabled: Boolean(shopId),
  });
}

export function useCreateBill(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBillInput) => {
      const res: any = await axiosClient.post(`/bills?shop_id=${shopId}`, input);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills", shopId] });
      toast.success("Vendor bill recorded successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to record vendor bill.");
    },
  });
}

export function usePayBill(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ billId, data }: { billId: string; data: PayBillInput }) => {
      const res: any = await axiosClient.post(`/bills/${billId}/pay?shop_id=${shopId}`, data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills", shopId] });
      toast.success("Vendor payment processed successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to process payment.");
    },
  });
}
