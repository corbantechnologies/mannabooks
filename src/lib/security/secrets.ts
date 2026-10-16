// src/lib/security/secrets.ts
import { timingSafeEqual } from "crypto";

/** Constant-time string comparison; false when either side is empty. */
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. No query-string secrets, no dev bypass. */
export function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") || "";
  return safeEqual(header, secret ? `Bearer ${secret}` : null);
}
