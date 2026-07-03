// src/hooks/useDocuments.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateDocumentStatus, deleteDocument, duplicateDocument } from "@/lib/actions/documents";
import { toast } from "react-hot-toast";

export function useUpdateDocumentStatus(shopId: string, shopSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { documentId: string; status: "DRAFT" | "SENT" | "OVERDUE" | "PAID" }) => {
      const res = await updateDocumentStatus({ shopId, shopSlug, ...data });
      if (!res.success) throw new Error(res.error || "Failed to update document status.");
      return res;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents", shopId] });
      toast.success(`Document status set to ${variables.status}!`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useDeleteDocument(shopId: string, shopSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const res = await deleteDocument(documentId, shopId, shopSlug);
      if (!res.success) throw new Error(res.error || "Failed to delete document.");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", shopId] });
      toast.success("Document purged!");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useDuplicateDocument(shopId: string, shopSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const res = await duplicateDocument(documentId, shopId, shopSlug);
      if (!res.success) throw new Error(res.error || "Failed to duplicate document.");
      return res;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["documents", shopId] });
      if (data.serial) {
        toast.success(`Duplicated into ${data.serial}!`);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
