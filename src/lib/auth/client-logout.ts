"use client";

import { signOut } from "next-auth/react";

export async function handleClientLogout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("manna_access_token");
    localStorage.removeItem("manna_auth_token");

    // Clear all cookies we might have set
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  }
  await signOut({ callbackUrl: "/login" });
}