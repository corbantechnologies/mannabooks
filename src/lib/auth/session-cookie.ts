// src/lib/auth/session-cookie.ts
// Server-only helpers for the session cookies. Tokens live ONLY in HttpOnly cookies:
// they are never returned to, or readable by, browser JavaScript.
//   access_token  – 15-minute JWT sent to the API
//   mb_refresh    – rotating refresh token (30-day session, 12-hour idle timeout enforced by the API)
// proxy.ts silently swaps an expired access token for a new one using the refresh token.
import { cookies, headers } from "next/headers";

import {
  REFRESH_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  accessCookieOptions,
  baseCookie,
  refreshCookieOptions,
  type SessionTokens,
} from "@/lib/auth/session-constants";

export { REFRESH_COOKIE_NAME, SESSION_COOKIE_NAME, accessCookieOptions, refreshCookieOptions };
export type { SessionTokens };

export async function setSessionCookies(tokens: SessionTokens): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, tokens.access_token, accessCookieOptions(tokens.expires_in));
  cookieStore.set(REFRESH_COOKIE_NAME, tokens.refresh_token, refreshCookieOptions(tokens.refresh_expires_in));
}

export async function getRefreshToken(): Promise<string | undefined> {
  try {
    return (await cookies()).get(REFRESH_COOKIE_NAME)?.value || undefined;
  } catch {
    return undefined;
  }
}

export async function clearSessionCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", { ...baseCookie, maxAge: 0 });
  cookieStore.set(REFRESH_COOKIE_NAME, "", { ...baseCookie, maxAge: 0 });
  // Leftovers from the removed NextAuth integration.
  for (const legacy of [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.csrf-token",
    "__Host-next-auth.csrf-token",
    "next-auth.callback-url",
    "__Secure-next-auth.callback-url",
  ]) {
    if (cookieStore.get(legacy)) cookieStore.delete(legacy);
  }
}

/** Browser IP and user agent as seen by the Next.js server, forwarded to the API. */
export async function getClientMeta(): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip");
    if (ip) out["X-Client-IP"] = ip;
    const ua = h.get("user-agent");
    if (ua) out["X-Client-User-Agent"] = ua.slice(0, 255);
  } catch {
    // Outside a request.
  }
  return out;
}
