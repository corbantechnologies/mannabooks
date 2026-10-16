import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";
import { safeEqual } from "@/lib/security/secrets";

/**
 * Daraja STK Push callback. Safaricom posts here using the callback URL we registered in
 * sendMpesaStkPush(), which carries MPESA_CALLBACK_SECRET. Anything without it is rejected.
 * The backend then verifies the amount and only updates PENDING transactions (idempotent).
 */
export async function POST(req: NextRequest) {
    if (!safeEqual(req.nextUrl.searchParams.get("secret"), process.env.MPESA_CALLBACK_SECRET)) {
        console.warn("Rejected M-Pesa STK callback with invalid secret");
        return NextResponse.json({ ResultCode: 1, ResultDesc: "Rejected" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const res = await apiClient<{ ResultCode: number; ResultDesc: string }>("/v1/billing/mpesa-callback", {
            method: "POST",
            anonymous: true,
            body: JSON.stringify(body),
        });
        if (res.error) {
            console.error("M-Pesa callback processing failed:", res.status, res.error);
            // Non-zero result asks Safaricom to retry later.
            return NextResponse.json({ ResultCode: 1, ResultDesc: "Temporary failure" }, { status: 500 });
        }
        return NextResponse.json(res.data || { ResultCode: 0, ResultDesc: "Accepted" });
    } catch (err) {
        console.error("M-Pesa callback forwarding error:", err);
        return NextResponse.json({ ResultCode: 1, ResultDesc: "Temporary failure" }, { status: 500 });
    }
}
