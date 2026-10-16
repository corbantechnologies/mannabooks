// src/lib/auth/session-constants.ts
// Cookie names/options shared by server code and proxy.ts (no next/headers import here).
export const SESSION_COOKIE_NAME = "access_token";
export const REFRESH_COOKIE_NAME = "mb_refresh";

export interface SessionTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
}

export const baseCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function accessCookieOptions(expiresIn: number) {
  return { ...baseCookie, maxAge: Math.max(60, expiresIn) };
}

export function refreshCookieOptions(refreshExpiresIn: number) {
  return { ...baseCookie, maxAge: Math.max(60, refreshExpiresIn) };
}

