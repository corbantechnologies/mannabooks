import axios, { AxiosError } from "axios";

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

// Request interceptor – attach JWT
axiosClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token =
      localStorage.getItem("manna_access_token") ||
      localStorage.getItem("manna_auth_token") ||
      getClientCookie("manna_access_token") ||
      getClientCookie("kenya-nzuri-kabisa") ||
      getClientCookie("manna_session_token");

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<{ detail?: string; error?: string; message?: string }>) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        localStorage.removeItem("manna_access_token");
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