"use server";

import { db } from "@/db";
import { shops, users, subscriptions, billingTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { verifyAndGetSession } from "./auth";
import { PLAN_SPECS, getShopPlanDetails, getDynamicPlanSpecs } from "@/lib/paywall";
import { sendMpesaStkPush, formatMpesaPhoneNumber, queryMpesaStkPushStatus } from "@/lib/services/mpesa";
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
        const effectiveAnnual = (planSpec.discountedPriceAnnually && planSpec.discountedPriceAnnually > 0)
            ? planSpec.discountedPriceAnnually
            : planSpec.priceKesAnnually;
        const effectiveMonthly = (planSpec.discountedPriceMonthly && planSpec.discountedPriceMonthly > 0)
            ? planSpec.discountedPriceMonthly
            : planSpec.priceKesMonthly;

        if (months >= 12 && effectiveAnnual > 0) {
            amount = effectiveAnnual;
        } else {
            const discountMultiplier = months >= 12 ? 0.8 : (months >= 3 ? 0.9 : 1.0);
            amount = Math.round(effectiveMonthly * months * discountMultiplier);
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
        };
    } catch (error: any) {
        console.error("Failed to initiate subscription payment:", error);
        return { success: false, error: error.message || "Internal server error initiating payment." };
    }
}

/**
 * Checks the status of an ongoing M-Pesa STK Push transaction.
 * Live queries Safaricom Daraja STK Query endpoint if callback is delayed.
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

        // If completed already via webhook callback
        if (tx.status === "COMPLETED") {
            return {
                success: true,
                status: "COMPLETED",
                mpesaReceipt: tx.mpesaReceiptNumber || "CONFIRMED",
                targetPlan: tx.targetPlan,
            };
        }

        // If already failed or cancelled
        if (tx.status === "FAILED" || tx.status === "CANCELLED") {
            return {
                success: false,
                status: tx.status,
                error: tx.resultDesc || "Payment was cancelled or failed on the phone.",
            };
        }

        // Proactively query Daraja STK query endpoint to verify status
        if (tx.status === "PENDING" && tx.checkoutRequestId) {
            const queryRes = await queryMpesaStkPushStatus(tx.checkoutRequestId);

            if (queryRes.success && queryRes.resultCode === 0) {
                // PIN entered successfully!
                const receipt = tx.mpesaReceiptNumber || `MP${Date.now()}`;

                await db.transaction(async (trx) => {
                    await trx.update(billingTransactions).set({
                        status: "COMPLETED",
                        resultCode: 0,
                        resultDesc: queryRes.resultDesc || "The service request is processed successfully.",
                        mpesaReceiptNumber: receipt,
                        completedAt: new Date(),
                    }).where(eq(billingTransactions.id, tx.id));

                    const shop = await trx.query.shops.findFirst({
                        where: eq(shops.id, tx.shopId),
                    });

                    const currentExpiry = shop?.subscriptionExpiresAt ? new Date(shop.subscriptionExpiresAt) : new Date();
                    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
                    const newExpiry = new Date(baseDate);
                    newExpiry.setDate(newExpiry.getDate() + (tx.billingMonths * 30));

                    // Upgrade User & Owned Workspaces
                    if (shop?.ownerId) {
                        await trx.update(users).set({
                            plan: tx.targetPlan,
                            subscriptionStatus: "ACTIVE",
                            subscriptionExpiresAt: newExpiry,
                        }).where(eq(users.id, shop.ownerId));

                        await trx.update(shops).set({
                            plan: tx.targetPlan,
                            subscriptionStatus: "ACTIVE",
                            subscriptionExpiresAt: newExpiry,
                        }).where(eq(shops.ownerId, shop.ownerId));
                    } else {
                        await trx.update(shops).set({
                            plan: tx.targetPlan,
                            subscriptionStatus: "ACTIVE",
                            subscriptionExpiresAt: newExpiry,
                        }).where(eq(shops.id, tx.shopId));
                    }

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
                revalidatePath("/workspaces");

                return {
                    success: true,
                    status: "COMPLETED",
                    mpesaReceipt: receipt,
                    targetPlan: tx.targetPlan,
                };
            } else if (queryRes.resultCode === 1032) {
                // Customer cancelled prompt
                await db.update(billingTransactions).set({
                    status: "CANCELLED",
                    resultCode: 1032,
                    resultDesc: "Payment prompt was cancelled on the phone.",
                    completedAt: new Date(),
                }).where(eq(billingTransactions.id, tx.id));

                return {
                    success: false,
                    status: "CANCELLED",
                    error: "Payment prompt was cancelled on your phone.",
                };
            } else if (queryRes.resultCode === 1037) {
                // Timeout / no response
                await db.update(billingTransactions).set({
                    status: "FAILED",
                    resultCode: 1037,
                    resultDesc: "Payment prompt timed out on the phone.",
                    completedAt: new Date(),
                }).where(eq(billingTransactions.id, tx.id));

                return {
                    success: false,
                    status: "FAILED",
                    error: "Payment prompt timed out. M-Pesa PIN was not entered in time.",
                };
            } else if (queryRes.isPending) {
                return {
                    success: true,
                    status: "PENDING",
                    resultDesc: "Waiting for M-Pesa PIN entry on your phone...",
                };
            }
        }

        return {
            success: true,
            status: tx.status,
            resultDesc: tx.resultDesc || "Processing transaction...",
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
        const details = await getShopPlanDetails(shopId);
        const dynamicSpecs = await getDynamicPlanSpecs();

        // Fetch recent billing transactions
        const history = await db.query.billingTransactions.findMany({
            where: eq(billingTransactions.shopId, shopId),
            orderBy: [desc(billingTransactions.createdAt)],
            limit: 10,
        });

        return {
            success: true,
            planDetails: details,
            availablePlans: Object.values(dynamicSpecs),
            transactions: history,
        };
    } catch (error: any) {
        console.error("Failed to fetch billing data:", error);
        return { success: false, error: error.message || "Failed to load billing details." };
    }
}

export async function getShopBillingOverviewAction(shopId: string) {
    return getShopBillingData(shopId);
}
