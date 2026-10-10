// src/hooks/useBilling.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import axiosClient from "@/lib/api/axios";

export interface BillingOverviewData {
  success: boolean;
  planDetails: any;
  availablePlans: any[];
  transactions: any[];
}

export function useBillingOverview(shopId: string) {
  return useQuery<BillingOverviewData>({
    queryKey: ["billing-overview", shopId],
    queryFn: async () => {
      const res: any = await axiosClient.get(`/workspaces/${shopId}/billing/overview`);
      return res as BillingOverviewData;
    },
    enabled: Boolean(shopId),
  });
}
