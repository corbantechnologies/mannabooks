"use client";

import { signOut } from "next-auth/react";

export async function handleClientLogout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";

    // Clear any residual cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  }
  await signOut({ callbackUrl: "/login" });
}