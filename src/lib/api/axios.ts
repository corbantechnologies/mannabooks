import axios, { AxiosError } from "axios";

// Browser client. Requests go through the same-origin Next.js rewrite (/api/v1 -> FastAPI /v1),
// so the HttpOnly session cookie is sent automatically; JavaScript never sees the token.
const API_BASE_URL = "/api/v1";

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    // Required by the API for cookie-authenticated writes (CSRF protection).
    "X-Requested-With": "XMLHttpRequest",
  },
  timeout: 30000,
});

axiosClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<{ detail?: string | { msg?: string }[]; error?: string; message?: string }>) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      if (!path.startsWith("/login") && !path.startsWith("/portal") && !path.startsWith("/signup")) {
        window.location.href = `/login?callbackUrl=${encodeURIComponent(path)}`;
      }
    }

    const detail = error.response?.data?.detail;
    const errorMsg =
      (typeof detail === "string" ? detail : Array.isArray(detail) ? detail[0]?.msg : undefined) ||
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Request failed. Please try again.";

    return Promise.reject(new Error(errorMsg));
  }
);

export default axiosClient;
