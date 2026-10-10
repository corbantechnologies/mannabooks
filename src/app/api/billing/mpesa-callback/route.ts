import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const res = await apiClient<{ ResultCode: number; ResultDesc: string }>("/v1/billing/mpesa-callback", {
            method: "POST",
            body: JSON.stringify(body),
        });

        return NextResponse.json(res.data || { ResultCode: 0, ResultDesc: "Accepted" });
    } catch (err: any) {
        console.error("M-Pesa callback forwarding error:", err);
        return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted with warnings" });
    }
}
