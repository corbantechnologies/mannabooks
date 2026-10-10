import axios, { AxiosError } from "axios";

/**
 * Reads a cookie value by name from document.cookie in browser context.
 */
function getClientCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor: attach session token from cookie/storage
axiosClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token =
      getClientCookie("kenya-nzuri-kabisa") ||
      getClientCookie("manna_session_token") ||
      localStorage.getItem("manna_auth_token");

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor: extract clean error messages and handle 401
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error: AxiosError<{ detail?: string; error?: string; message?: string }>) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        // Clear any local tokens
        localStorage.removeItem("manna_auth_token");
      }
    }

    const errorMsg =
      error.response?.data?.detail ||
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Request failed. Please try again.";

    return Promise.reject(new Error(errorMsg));
  }
);

export default axiosClient;
