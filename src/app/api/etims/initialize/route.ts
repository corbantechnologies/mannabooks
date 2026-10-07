// src/app/api/etims/initialize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAndGetSession } from "@/lib/actions/auth";
import { apiClient } from "@/lib/api/client";

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAndGetSession();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const res = await apiClient<{ success: boolean; sdcId?: string; mrcNo?: string; taxpayerName?: string; error?: string }>(
      "/v1/etims/initialize",
      {
        method: "POST",
        body: JSON.stringify({
          shop_id: body.shopId,
          kra_pin: body.kraPin,
          branch_id: body.branchId,
          device_serial: body.deviceSerial,
          communication_key: body.communicationKey,
          environment: body.environment || "SANDBOX",
        }),
      }
    );

    if (res.error || !res.data?.success) {
      return NextResponse.json({
        success: false,
        error: res.data?.error || res.error || "Failed to initialize eTIMS device with KRA.",
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      sdcId: res.data.sdcId,
      mrcNo: res.data.mrcNo,
      taxpayerName: res.data.taxpayerName,
    });
  } catch (err: any) {
    console.error("[eTIMS Proxy Init Error]", err);
    return NextResponse.json({
      success: false,
      error: err.message || "Internal server error during eTIMS handshake.",
    }, { status: 500 });
  }
}
