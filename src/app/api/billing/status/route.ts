// src/app/api/billing/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { queryMpesaStkPushStatus } from "@/lib/services/mpesa";
import { apiClient } from "@/lib/api/client";

export async function GET(req: NextRequest) {
  const transactionId = req.nextUrl.searchParams.get("transactionId");
  if (!transactionId) {
    return NextResponse.json({ success: false, error: "Missing transactionId" }, { status: 400 });
  }

  try {
    const statusRes = await apiClient<{
      success: boolean;
      status: string;
      mpesaReceipt?: string;
      targetPlan: string;
      resultDesc?: string;
    }>(`/v1/billing/status/${transactionId}`);

    if (!statusRes.data?.success) {
      return NextResponse.json({ success: false, error: statusRes.error || "Transaction not found" }, { status: 404 });
    }

    const tx = statusRes.data;

    if (tx.status === "COMPLETED") {
      return NextResponse.json({
        success: true,
        status: "COMPLETED",
        mpesaReceipt: tx.mpesaReceipt || "CONFIRMED",
        targetPlan: tx.targetPlan,
      });
    }

    if (tx.status === "FAILED" || tx.status === "CANCELLED") {
      return NextResponse.json({
        success: false,
        status: tx.status,
        error: tx.resultDesc || "Payment failed or was cancelled.",
      });
    }

    // Try fallback query against Safaricom if checkout ID is known
    return NextResponse.json({
      success: true,
      status: tx.status || "PENDING",
      targetPlan: tx.targetPlan,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
