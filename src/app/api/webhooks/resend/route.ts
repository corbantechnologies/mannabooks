import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { apiClient } from "@/lib/api/client";

const TOLERANCE_SECONDS = 5 * 60;

/** Verify a Resend (Svix) webhook signature. See https://docs.svix.com/receiving/verifying-payloads/how-manual */
function verifySvixSignature(rawBody: string, headers: Headers, secret: string): boolean {
    const id = headers.get("svix-id");
    const timestamp = headers.get("svix-timestamp");
    const signatureHeader = headers.get("svix-signature");
    if (!id || !timestamp || !signatureHeader) return false;

    const ts = Number(timestamp);
    if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > TOLERANCE_SECONDS) return false;

    const key = Buffer.from(secret.startsWith("whsec_") ? secret.slice(6) : secret, "base64");
    const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${rawBody}`).digest();

    return signatureHeader.split(" ").some((part) => {
        const [version, sig] = part.split(",");
        if (version !== "v1" || !sig) return false;
        const given = Buffer.from(sig, "base64");
        return given.length === expected.length && timingSafeEqual(given, expected);
    });
}

/**
 * Resend webhook for email lifecycle tracking (Delivered, Opened, Bounced).
 */
export async function POST(req: NextRequest) {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (!secret) {
        console.error("RESEND_WEBHOOK_SECRET is not set; rejecting webhook.");
        return NextResponse.json({ success: false }, { status: 503 });
    }

    const rawBody = await req.text();
    if (!verifySvixSignature(rawBody, req.headers, secret)) {
        return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
    }

    try {
        const res = await apiClient<{ success: boolean; processedType?: string }>("/v1/documents/webhooks/resend", {
            method: "POST",
            anonymous: true,
            body: rawBody,
        });
        if (res.error) {
            return NextResponse.json({ success: false }, { status: 500 });
        }
        return NextResponse.json(res.data || { success: true });
    } catch (err) {
        console.error("Resend webhook error:", err);
        return NextResponse.json({ success: false, error: "Webhook processing error." }, { status: 500 });
    }
}
