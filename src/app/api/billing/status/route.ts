// src/app/api/billing/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";
import { verifyAndGetSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const session = await verifyAndGetSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
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
    }>(`/v1/billing/status/${encodeURIComponent(transactionId)}`);

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
    console.error("Billing status error:", error);
    return NextResponse.json({ success: false, error: "Could not check payment status." }, { status: 500 });
  }
}
