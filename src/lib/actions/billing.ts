"use server";

import { db } from "@/db";
import { shops, subscriptions, billingTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { verifyAndGetSession } from "./auth";
import { PLAN_SPECS, getShopPlanDetails, getDynamicPlanSpecs } from "@/lib/paywall";
import { sendMpesaStkPush, formatMpesaPhoneNumber } from "@/lib/services/mpesa";
import { revalidatePath } from "next/cache";

export interface InitiatePaymentInput {
    shopId: string;
    plan: "BASIC" | "PRO" | "ENTERPRISE";
    months: number; // 1, 3, 12
    phoneNumber: string;
}

/**
 * Initiates an M-Pesa STK Push subscription payment for a workspace.
 */
export async function initiateSubscriptionPaymentAction(input: InitiatePaymentInput) {
    const session = await verifyAndGetSession();
    if (!session || !session.user) {
        return { success: false, error: "Unauthorized. Please log in." };
    }

    try {
        const targetPlan = input.plan.toUpperCase();
        const dynamicSpecs = await getDynamicPlanSpecs();
        const planSpec = dynamicSpecs[targetPlan] || PLAN_SPECS[targetPlan];
        if (!planSpec) {
            return { success: false, error: "Invalid subscription plan selected." };
        }

        const months = Math.max(1, input.months || 1);
        let amount = 0;
        if (months >= 12 && planSpec.priceKesAnnually > 0) {
            amount = planSpec.priceKesAnnually;
        } else {
            const discountMultiplier = months >= 12 ? 0.8 : (months >= 3 ? 0.9 : 1.0);
            amount = Math.round(planSpec.priceKesMonthly * months * discountMultiplier);
        }

        const shop = await db.query.shops.findFirst({
            where: eq(shops.id, input.shopId),
        });

        if (!shop) {
            return { success: false, error: "Target workspace not found." };
        }

        const cleanPhone = formatMpesaPhoneNumber(input.phoneNumber);
        if (!cleanPhone || cleanPhone.length !== 12) {
            return { success: false, error: "Please enter a valid Safaricom phone number (e.g. 0712345678)." };
        }

        const accountRef = `MB-${shop.slug.substring(0, 5).toUpperCase()}-${targetPlan}`;
        const stkRes = await sendMpesaStkPush({
            phoneNumber: cleanPhone,
            amount,
            accountReference: accountRef,
            transactionDesc: `MannaBooks ${planSpec.name}`,
        });

        if (!stkRes.success || !stkRes.checkoutRequestId) {
            return { success: false, error: stkRes.error || "Failed to trigger M-Pesa STK prompt." };
        }

        // Record the pending transaction in database
        const [record] = await db.insert(billingTransactions).values({
            shopId: shop.id,
            checkoutRequestId: stkRes.checkoutRequestId,
            merchantRequestId: stkRes.merchantRequestId,
            phoneNumber: cleanPhone,
            amount: amount.toString(),
            status: "PENDING",
            targetPlan: targetPlan,
            billingMonths: months,
        }).returning();

        return {
            success: true,
            transactionId: record.id,
            checkoutRequestId: stkRes.checkoutRequestId,
            customerMessage: stkRes.customerMessage,
            amount,
            isSimulated: stkRes.isSimulated || false,
        };
    } catch (error: any) {
        console.error("Failed to initiate subscription payment:", error);
        return { success: false, error: error.message || "Internal server error initiating payment." };
    }
}

/**
 * Checks the status of an ongoing M-Pesa STK Push transaction.
 * Automatically resolves simulated transactions in development environments.
 */
export async function checkPaymentStatusAction(transactionId: string) {
    const session = await verifyAndGetSession();
    if (!session) {
        return { success: false, error: "Unauthorized." };
    }

    try {
        const tx = await db.query.billingTransactions.findFirst({
            where: eq(billingTransactions.id, transactionId),
        });

        if (!tx) {
            return { success: false, error: "Transaction record not found." };
        }

        // If completed already
        if (tx.status === "COMPLETED") {
            return {
                success: true,
                status: "COMPLETED",
                mpesaReceipt: tx.mpesaReceiptNumber,
                targetPlan: tx.targetPlan,
            };
        }

        // If simulated in test mode, complete after 4 seconds automatically
        if (tx.checkoutRequestId.includes("SIM") && tx.status === "PENDING") {
            const ageMs = Date.now() - new Date(tx.createdAt).getTime();
            if (ageMs > 3500) {
                const mockReceipt = `SIM${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
                
                await db.transaction(async (trx) => {
                    await trx.update(billingTransactions).set({
                        status: "COMPLETED",
                        resultCode: 0,
                        resultDesc: "The service request is processed successfully.",
                        mpesaReceiptNumber: mockReceipt,
                        completedAt: new Date(),
                    }).where(eq(billingTransactions.id, tx.id));

                    const shop = await trx.query.shops.findFirst({
                        where: eq(shops.id, tx.shopId),
                    });

                    const currentExpiry = shop?.subscriptionExpiresAt ? new Date(shop.subscriptionExpiresAt) : new Date();
                    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
                    const newExpiry = new Date(baseDate);
                    newExpiry.setDate(newExpiry.getDate() + (tx.billingMonths * 30));

                    await trx.update(shops).set({
                        plan: tx.targetPlan,
                        subscriptionStatus: "ACTIVE",
                        subscriptionExpiresAt: newExpiry,
                    }).where(eq(shops.id, tx.shopId));

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

                revalidatePath("/admin");
                revalidatePath("/admin/workspaces");
                return {
                    success: true,
                    status: "COMPLETED",
                    mpesaReceipt: mockReceipt,
                    targetPlan: tx.targetPlan,
                };
            }
        }

        return {
            success: true,
            status: tx.status,
            resultDesc: tx.resultDesc,
        };
    } catch (error: any) {
        console.error("Failed to check payment status:", error);
        return { success: false, error: error.message || "Failed to query status." };
    }
}

/**
 * Fetches billing history and plan data for a tenant's billing hub.
 */
export async function getShopBillingData(shopId: string) {
    const session = await verifyAndGetSession();
    if (!session) {
        return { success: false, error: "Unauthorized." };
    }

    try {
        const [planDetails, transactions, activeSubscription, dynamicSpecs] = await Promise.all([
            getShopPlanDetails(shopId),
            db.query.billingTransactions.findMany({
                where: eq(billingTransactions.shopId, shopId),
                orderBy: [desc(billingTransactions.createdAt)],
                limit: 20,
            }),
            db.query.subscriptions.findFirst({
                where: eq(subscriptions.shopId, shopId),
                orderBy: [desc(subscriptions.createdAt)],
            }),
            getDynamicPlanSpecs(),
        ]);

        if (!planDetails) {
            return { success: false, error: "Workspace not found." };
        }

        return {
            success: true,
            planDetails,
            transactions,
            activeSubscription,
            availablePlans: Object.values(dynamicSpecs),
        };
    } catch (error) {
        console.error("Failed to get shop billing data:", error);
        return { success: false, error: "Failed to retrieve billing records." };
    }
}
