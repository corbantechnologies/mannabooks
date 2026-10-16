// src/app/api/billing/initiate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { formatMpesaPhoneNumber, sendMpesaStkPush } from "@/lib/services/mpesa";
import { PLAN_SPECS, getDynamicPlanSpecs } from "@/lib/paywall";
import { apiClient } from "@/lib/api/client";
import { verifyAndGetSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAndGetSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const input = await req.json();
    if (typeof input.shopId !== "string" || !input.shopId) {
      return NextResponse.json({ success: false, error: "shopId is required" }, { status: 400 });
    }
    const targetPlan = (input.plan || "PRO").toUpperCase();
    const dynamicSpecs = await getDynamicPlanSpecs();
    const planSpec = dynamicSpecs[targetPlan] || PLAN_SPECS[targetPlan];
    if (!planSpec) {
      return NextResponse.json({ success: false, error: "Invalid plan" }, { status: 400 });
    }

    const months = Math.min(24, Math.max(1, Math.floor(Number(input.months) || 1)));
    let amount = 0;
    const effectiveAnnual =
      planSpec.discountedPriceAnnually && planSpec.discountedPriceAnnually > 0
        ? planSpec.discountedPriceAnnually
        : planSpec.priceKesAnnually;
    const effectiveMonthly =
      planSpec.discountedPriceMonthly && planSpec.discountedPriceMonthly > 0
        ? planSpec.discountedPriceMonthly
        : planSpec.priceKesMonthly;

    if (months >= 12 && effectiveAnnual > 0) {
      amount = effectiveAnnual;
    } else {
      const discountMultiplier = months >= 12 ? 0.8 : months >= 3 ? 0.9 : 1.0;
      amount = Math.round(effectiveMonthly * months * discountMultiplier);
    }

    const cleanPhone = formatMpesaPhoneNumber(input.phoneNumber || "");
    if (!cleanPhone || cleanPhone.length !== 12) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid Safaricom number (e.g. 0712345678)" },
        { status: 400 }
      );
    }

    const shopRes = await apiClient<{ success: boolean; shop: any }>(
      `/v1/workspaces/${encodeURIComponent(input.shopId)}`
    );
    if (!shopRes.data?.shop) {
      return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });
    }
    const shop = shopRes.data.shop;

    const accountRef = `MB-${(shop.slug || "SHOP").substring(0, 5).toUpperCase()}-${targetPlan}`;
    const stkRes = await sendMpesaStkPush({
      phoneNumber: cleanPhone,
      amount,
      accountReference: accountRef,
      transactionDesc: `MannaBooks ${planSpec.name}`,
    });

    if (!stkRes.success || !stkRes.checkoutRequestId) {
      return NextResponse.json(
        { success: false, error: stkRes.error || "STK trigger failed" },
        { status: 400 }
      );
    }

    const initRes = await apiClient<{ success: boolean; transactionId: string }>(
      "/v1/billing/initiate",
      {
        method: "POST",
        body: JSON.stringify({
          shop_id: shop.id,
          checkout_request_id: stkRes.checkoutRequestId,
          merchant_request_id: stkRes.merchantRequestId,
          phone_number: cleanPhone,
          amount,
          target_plan: targetPlan,
          billing_months: months,
        }),
      }
    );

    return NextResponse.json({
      success: true,
      transactionId: initRes.data?.transactionId || stkRes.checkoutRequestId,
      customerMessage: stkRes.customerMessage,
      amount,
    });
  } catch (error: any) {
    console.error("Billing initiate error:", error);
    return NextResponse.json({ success: false, error: "Could not start the payment. Please try again." }, { status: 500 });
  }
}
