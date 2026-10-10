// src/lib/workspace-context.ts
import { apiClient } from "@/lib/api/client";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

export interface WorkspaceContextResult {
  shop: any;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    isSuperAdmin: boolean;
  };
}

export const getActiveWorkspaceContext = cache(async function getActiveWorkspaceContext(
  slug: string
): Promise<WorkspaceContextResult> {
  const res = await apiClient<{ success: boolean; role: string; shop: any; user?: any }>(
    `/v1/workspaces/by-slug/${slug}/context`
  );

  if (!res.data?.success || !res.data.shop) {
    if (res.status === 404) {
      notFound();
    }
    redirect("/workspaces");
  }

  return {
    shop: res.data.shop,
    role: res.data.role,
    user: res.data.user || {
      id: "",
      name: "Operator",
      email: "",
      isSuperAdmin: false,
    },
  };
});
