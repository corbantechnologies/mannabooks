// src/hooks/useDocuments.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/lib/api/axios";
import { toast } from "react-hot-toast";

export interface DocumentItemInput {
  productId?: string | null;
  description: string;
  notes?: string | null;
  quantity: number;
  unitPrice: number;
  taxType: "V_16" | "V_0" | "EXEMPT";
}

export interface CreateDocumentInput {
  clientId?: string | null;
  supplierId?: string | null;
  type: string;
  status?: string;
  requiresEtims?: boolean;
  notes?: string | null;
  termsAndConditions?: string | null;
  currency?: string;
  locationId?: string | null;
  paymentChannel?: string | null;
  paymentReference?: string | null;
  items: DocumentItemInput[];
}

/**
 * Fetch documents list for a shop using pure Axios.
 */
export function useDocuments(shopId: string, docType?: string, docStatus?: string) {
  return useQuery<any[]>({
    queryKey: ["documents", shopId, docType, docStatus],
    queryFn: async () => {
      const data = await axiosClient.get("/documents", {
        params: {
          shop_id: shopId,
          doc_type: docType || undefined,
          doc_status: docStatus || undefined,
        },
      });
      return Array.isArray(data) ? data : (data as any)?.documents || [];
    },
    enabled: Boolean(shopId),
  });
}

/**
 * Create commercial document (Invoice, Quote, Receipt, etc.) via pure Axios.
 */
export function useCreateDocument(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDocumentInput) => {
      return await axiosClient.post(
        "/documents",
        {
          client_id: input.clientId || null,
          supplier_id: input.supplierId || null,
          type: input.type === "QUOTATION" ? "QUOTE" : input.type,
          status: input.status || "DRAFT",
          requires_etims: Boolean(input.requiresEtims),
          notes: input.notes || null,
          terms_and_conditions: input.termsAndConditions || null,
          currency: input.currency || "KES",
          location_id: input.locationId || null,
          payment_channel: input.paymentChannel || null,
          payment_reference: input.paymentReference || null,
          items: input.items.map((it) => ({
            product_id: it.productId || null,
            description: it.description,
            notes: it.notes || null,
            quantity: it.quantity,
            unit_price: it.unitPrice,
            tax_type: it.taxType,
          })),
        },
        { params: { shop_id: shopId } }
      );
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["documents", shopId] });
      toast.success(`Document ${data?.doc_number || data?.docNumber || "created"} successfully!`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create document.");
    },
  });
}

/**
 * Update document status via pure Axios.
 */
export function useUpdateDocumentStatus(shopId: string, _shopSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      documentId: string;
      status: string;
      paymentChannel?: string;
      paymentReference?: string;
    }) => {
      return await axiosClient.patch(
        `/documents/${data.documentId}/status`,
        { status: data.status },
        { params: { shop_id: shopId } }
      );
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents", shopId] });
      toast.success(`Document status updated to ${variables.status}!`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update document status.");
    },
  });
}

/**
 * Delete document via pure Axios.
 */
export function useDeleteDocument(shopId: string, _shopSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      return await axiosClient.delete(`/documents/${documentId}`, {
        params: { shop_id: shopId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", shopId] });
      toast.success("Document deleted.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete document.");
    },
  });
}

/**
 * Duplicate document via pure Axios.
 */
export function useDuplicateDocument(shopId: string, _shopSlug?: string) {
  const queryClient = useQueryClient();

  return useMutation<{ documentId?: string; serial?: string; success: boolean }, Error, string>({
    mutationFn: async (documentId: string) => {
      const data: any = await axiosClient.post(`/documents/${documentId}/duplicate`, {}, {
        params: { shop_id: shopId },
      });
      return {
        success: true,
        documentId: data?.id || data?.documentId,
        serial: data?.doc_number || data?.serial,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["documents", shopId] });
      if (data?.serial) {
        toast.success(`Duplicated into ${data.serial}!`);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to duplicate document.");
    },
  });
}
