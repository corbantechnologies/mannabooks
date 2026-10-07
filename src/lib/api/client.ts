// src/lib/api/client.ts
import { cookies } from "next/headers";

const API_BASE_URL = (process.env.API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "";
const SESSION_COOKIE_NAME = process.env.COOKIE_NAME || "kenya-nzuri-kabisa";

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<{ data?: T; error?: string; status: number }> {
  try {
    const url = new URL(`${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`);
    if (options.params) {
      Object.entries(options.params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    // Forward session cookie token if present
    let sessionToken: string | undefined;
    try {
      const cookieStore = await cookies();
      sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    } catch {
      // In static or build environments cookies() might fail
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Internal-Key": INTERNAL_API_KEY,
      ...(options.headers as Record<string, string>),
    };

    if (sessionToken && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${sessionToken}`;
    }

    const res = await fetch(url.toString(), {
      ...options,
      headers,
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
    console.error(`[API Client Error: ${endpoint}]`, err);
    return {
      status: 500,
      error: err.message || "Failed to communicate with FastAPI backend.",
    };
  }
}

export const apiCall = apiClient;

