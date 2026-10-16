"use client";

export function handleClientLogout() {
  // The session cookie is HttpOnly, so sign-out happens server-side.
  window.location.href = "/logout";
}
