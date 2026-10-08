import { NextRequest, NextResponse } from "next/server";
import { isApiModuleEnabled } from "@/lib/api/flags";
import { apiClient } from "@/lib/api/client";

/**
 * Daraja C2B Confirmation Webhook Handler.
 * Proxies incoming payments from Safaricom Paybill / Till Number directly to FastAPI.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (isApiModuleEnabled("payments")) {
      const res = await apiClient.post<any>("/v1/payments/mpesa/c2b-callback", body);
      if (!res.error && res.data) {
        return NextResponse.json(res.data);
      }
    }

    // Default acknowledgement to avoid Safaricom queue jams if offline
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error: any) {
    console.error("C2B Callback webhook error:", error);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted with error log" });
  }
}
