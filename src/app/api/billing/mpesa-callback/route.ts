import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shops, subscriptions, billingTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log("📥 Daraja M-Pesa Callback Payload:", JSON.stringify(body, null, 2));

        const stkCallback = body?.Body?.stkCallback;
        if (!stkCallback) {
            return NextResponse.json({ ResultCode: 1, ResultDesc: "Missing stkCallback" }, { status: 400 });
        }

        const {
            MerchantRequestID,
            CheckoutRequestID,
            ResultCode,
            ResultDesc,
            CallbackMetadata,
        } = stkCallback;

        const tx = await db.query.billingTransactions.findFirst({
            where: eq(billingTransactions.checkoutRequestId, CheckoutRequestID),
        });

        if (!tx) {
            console.warn("⚠️ No matching billing transaction for CheckoutRequestID:", CheckoutRequestID);
            return NextResponse.json({ ResultCode: 0, ResultDesc: "Ignored (no match)" });
        }

        // On Failure or User Cancelled
        if (ResultCode !== 0) {
            await db.update(billingTransactions).set({
                status: "FAILED",
                resultCode: ResultCode,
                resultDesc: ResultDesc || "M-Pesa payment cancelled or failed.",
                completedAt: new Date(),
            }).where(eq(billingTransactions.id, tx.id));

            return NextResponse.json({ ResultCode: 0, ResultDesc: "Processed failure" });
        }

        // On Success: Extract M-Pesa Receipt Number & Amount
        let receiptNumber = `MP${Date.now()}`;
        if (CallbackMetadata?.Item) {
            for (const item of CallbackMetadata.Item) {
                if (item.Name === "MpesaReceiptNumber" && item.Value) {
                    receiptNumber = String(item.Value);
                }
            }
        }

        await db.transaction(async (trx) => {
            // 1. Mark transaction completed
            await trx.update(billingTransactions).set({
                status: "COMPLETED",
                resultCode: 0,
                resultDesc: ResultDesc || "Payment processed successfully.",
                mpesaReceiptNumber: receiptNumber,
                completedAt: new Date(),
            }).where(eq(billingTransactions.id, tx.id));

            // 2. Fetch current shop to compute expiration
            const shop = await trx.query.shops.findFirst({
                where: eq(shops.id, tx.shopId),
            });

            const currentExpiry = shop?.subscriptionExpiresAt ? new Date(shop.subscriptionExpiresAt) : new Date();
            const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
            const newExpiry = new Date(baseDate);
            newExpiry.setDate(newExpiry.getDate() + (tx.billingMonths * 30));

            // 3. Upgrade shop plan
            await trx.update(shops).set({
                plan: tx.targetPlan,
                subscriptionStatus: "ACTIVE",
                subscriptionExpiresAt: newExpiry,
            }).where(eq(shops.id, tx.shopId));

            // 4. Create active subscription record
            await trx.insert(subscriptions).values({
                shopId: tx.shopId,
                plan: tx.targetPlan,
                status: "ACTIVE",
                amount: tx.amount,
                currency: "KES",
                billingInterval: tx.billingMonths >= 12 ? "ANNUALLY" : (tx.billingMonths >= 3 ? "QUARTERLY" : "MONTHLY"),
                startDate: new Date(),
                endDate: newExpiry,
            });
        });

        console.log(`✅ M-Pesa STK Push Success: Upgraded Shop ${tx.shopId} to ${tx.targetPlan} (Receipt: ${receiptNumber})`);
        return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });
    } catch (error: any) {
        console.error("Fatal error processing Daraja M-Pesa callback:", error);
        return NextResponse.json({ ResultCode: 1, ResultDesc: error.message || "Internal error" }, { status: 500 });
    }
}
