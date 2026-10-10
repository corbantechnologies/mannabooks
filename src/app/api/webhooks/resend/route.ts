import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";

/**
 * Resend Webhook handler for email lifecycle tracking (Delivered, Opened, Bounced).
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const res = await apiClient<{ success: boolean; processedType?: string }>("/v1/documents/webhooks/resend", {
            method: "POST",
            body: JSON.stringify(body),
        });

        return NextResponse.json(res.data || { success: true });
    } catch (err: any) {
        console.error("Resend webhook error:", err);
        return NextResponse.json({ success: false, error: err?.message || "Webhook processing error." }, { status: 500 });
    }
}
