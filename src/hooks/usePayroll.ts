// src/hooks/usePayroll.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/lib/api/axios";
import { toast } from "react-hot-toast";

export function useEmployees(shopId: string) {
  return useQuery({
    queryKey: ["employees", shopId],
    queryFn: async () => {
      const res: any = await axiosClient.get("/employees", { params: { shop_id: shopId } });
      return res?.employees || [];
    },
    enabled: Boolean(shopId),
  });
}

export function useCreateEmployee(shopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      return await axiosClient.post("/employees", { shop_id: shopId, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", shopId] });
      toast.success("Employee registered successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to register employee.");
    },
  });
}

export function useUpdateEmployee(shopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, data }: { employeeId: string; data: any }) => {
      return await axiosClient.patch(`/employees/${employeeId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", shopId] });
      toast.success("Employee profile updated!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update employee.");
    },
  });
}

export function useDeleteEmployee(shopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (employeeId: string) => {
      return await axiosClient.delete(`/employees/${employeeId}`, { params: { shop_id: shopId } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", shopId] });
      toast.success("Employee removed successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to remove employee.");
    },
  });
}

export function useGeneratePayrollRun(shopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      return await axiosClient.post("/payroll/generate", { shop_id: shopId, ...data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", shopId] });
      toast.success("Payroll run calculated and saved!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to generate payroll run.");
    },
  });
}

export function useFinalizePayrollRun(shopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (docId: string) => {
      return await axiosClient.post(`/payroll/${docId}/finalize`, {}, { params: { shop_id: shopId } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", shopId] });
      toast.success("Payroll run finalized and booked into General Ledger!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to finalize payroll run.");
    },
  });
}

export function useEmailPayslips(shopId: string) {
  return useMutation({
    mutationFn: async (docId: string) => {
      return await axiosClient.post(`/payroll/${docId}/email`, {}, { params: { shop_id: shopId } });
    },
    onSuccess: () => {
      toast.success("Statutory payslips emailed to all staff!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to email payslips.");
    },
  });
}
