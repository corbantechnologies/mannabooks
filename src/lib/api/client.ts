// src/lib/api/client.ts
// Server-side client for the FastAPI backend (Server Components, Route Handlers, Server Actions).
import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";

const API_BASE_URL = (process.env.API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "";

if (!INTERNAL_API_KEY && process.env.NODE_ENV === "production") {
  console.error("[API Client] INTERNAL_API_KEY is not set; backend calls will be rejected.");
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
  /** Do not forward the signed-in user's session (public pages, login, registration). */
  anonymous?: boolean;
}

async function readSessionToken(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(SESSION_COOKIE_NAME)?.value || undefined;
  } catch (err) {
    // Let Next.js mark the route as dynamic; otherwise cookies() is simply unavailable (build time).
    unstable_rethrow(err);
    return undefined;
  }
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<{ data?: T; error?: string; status: number }> {
  const { params, anonymous, ...init } = options;
  try {
    const url = new URL(`${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Internal-Key": INTERNAL_API_KEY,
      ...(init.headers as Record<string, string>),
    };

    if (!anonymous && !headers["Authorization"]) {
      const sessionToken = await readSessionToken();
      if (sessionToken) {
        headers["Authorization"] = `Bearer ${sessionToken}`;
      }
    }

    const res = await fetch(url.toString(), {
      ...init,
      headers,
      cache: init.cache ?? "no-store",
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        status: res.status,
        error: json?.detail || json?.error || "Backend service request failed.",
      };
    }

    return {
      status: res.status,
      data: json as T,
    };
  } catch (err: any) {
    unstable_rethrow(err);
    console.error(`[API Client Error: ${endpoint}]`, err);
    return {
      status: 500,
      error: "Failed to communicate with the backend service.",
    };
  }
}

apiClient.get = function <T = any>(endpoint: string, options?: RequestOptions) {
  return apiClient<T>(endpoint, { ...options, method: "GET" });
};

apiClient.post = function <T = any>(endpoint: string, body?: any, options?: RequestOptions) {
  return apiClient<T>(endpoint, {
    ...options,
    method: "POST",
    body: body !== undefined ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
  });
};

apiClient.put = function <T = any>(endpoint: string, body?: any, options?: RequestOptions) {
  return apiClient<T>(endpoint, {
    ...options,
    method: "PUT",
    body: body !== undefined ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
  });
};

apiClient.patch = function <T = any>(endpoint: string, body?: any, options?: RequestOptions) {
  return apiClient<T>(endpoint, {
    ...options,
    method: "PATCH",
    body: body !== undefined ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
  });
};

apiClient.delete = function <T = any>(endpoint: string, options?: RequestOptions) {
  return apiClient<T>(endpoint, { ...options, method: "DELETE" });
};

export const apiCall = apiClient;
