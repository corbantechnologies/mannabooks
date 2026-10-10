"use client";

import { signOut } from "next-auth/react";

export async function handleClientLogout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("manna_auth_token");
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  }
  await signOut({ callbackUrl: "/login" });
}
