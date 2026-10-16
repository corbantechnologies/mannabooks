import { NextResponse } from "next/server";

/**
 * Disabled: MannaBooks' Daraja integration only collects subscription payments (STK Push to the
 * MannaBooks paybill, see /api/billing/mpesa-callback). Workspaces don't have their own M-Pesa
 * collection yet, so there is nothing for a C2B confirmation to update.
 */
export async function POST() {
  return NextResponse.json({ ResultCode: 1, ResultDesc: "C2B collection is not enabled" }, { status: 410 });
}
