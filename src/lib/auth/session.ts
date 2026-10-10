import { apiClient } from "@/lib/api/client";
import { cache } from "react";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  isSuperAdmin: boolean;
  plan?: string;
  subscriptionStatus?: string;
}

export interface UserSession {
  user: SessionUser;
}

/**
 * Validates the current user session against the FastAPI backend.
 */
export const verifyAndGetSession = cache(async function verifyAndGetSession(): Promise<UserSession | null> {
  try {
    const res = await apiClient.get<{ success: boolean; user?: SessionUser }>("/v1/auth/me");
    if (res.data?.success && res.data.user) {
      return { user: res.data.user };
    }
    return null;
  } catch (err) {
    return null;
  }
});

/**
 * Validates current session and returns the user only if they are a super admin.
 */
export async function enforceSuperAdmin(): Promise<SessionUser | null> {
  const session = await verifyAndGetSession();
  if (!session || !session.user || !session.user.isSuperAdmin) {
    return null;
  }
  return session.user;
}
