import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, shops, platformPlans, billingTransactions } from "@/db/schema";
import { eq, and, sql, isNotNull, lte, gt } from "drizzle-orm";
import { Resend } from "resend";
import { sendMpesaStkPush, formatMpesaPhoneNumber } from "@/lib/services/mpesa";
import { PLAN_SPECS, getDynamicPlanSpecs } from "@/lib/paywall";
import { formatCurrency } from "@/lib/utils";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Manna Books <billing@corbantechnologies.org>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.mannabooks.co.ke";

export async function GET(req: NextRequest) {
    return handleCron(req);
}

export async function POST(req: NextRequest) {
    return handleCron(req);
}

async function handleCron(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const urlSecret = req.nextUrl.searchParams.get("secret");

    // Allow execution if CRON_SECRET matches, or in development mode
    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && urlSecret !== cronSecret) {
        return NextResponse.json({ success: false, error: "Unauthorized cron execution." }, { status: 401 });
    }

    const now = new Date();
    const dynamicSpecs = await getDynamicPlanSpecs();

    const summary = {
        preRenewalAlertsSent: 0,
        renewalStkPromptsTriggered: 0,
        gracePeriodsEntered: 0,
        softLocksExecuted: 0,
        errors: [] as string[],
    };

    try {
        // Fetch all paying, non-lifetime user accounts with active subscriptions
        const payingUsers = await db.query.users.findMany({
            where: and(
                eq(users.isLifetimePro, false),
                eq(users.isSuperAdmin, false),
                isNotNull(users.subscriptionExpiresAt)
            ),
        });

        for (const u of payingUsers) {
            if (!u.subscriptionExpiresAt || u.plan === "FREE") continue;

            const expiry = new Date(u.subscriptionExpiresAt);
            const diffMs = expiry.getTime() - now.getTime();
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            const planSpec = dynamicSpecs[u.plan.toUpperCase()] || PLAN_SPECS[u.plan.toUpperCase()] || PLAN_SPECS.FREE;

            // Resolve preferred phone for M-Pesa renewal
            let renewalPhone = u.autoRenewPhone;
            if (!renewalPhone) {
                const firstShop = await db.query.shops.findFirst({
                    where: eq(shops.ownerId, u.id),
                });
                renewalPhone = firstShop?.phone || null;
            }

            // =========================================================================
            // PHASE 1: PRE-RENEWAL ALERTS (3 Days & 1 Day Prior)
            // =========================================================================
            if (diffDays <= 3 && diffDays > 0) {
                try {
                    await resend.emails.send({
                        from: FROM_EMAIL,
                        to: u.email,
                        subject: `Upcoming MannaBooks ${planSpec.name} Renewal Reminder (${diffDays} Day${diffDays > 1 ? "s" : ""} Left)`,
                        html: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #18181b;">
                                <div style="border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 24px;">
                                    <h2 style="margin: 0; font-size: 20px; font-weight: 900; text-transform: uppercase;">MannaBooks Platform</h2>
                                </div>
                                <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">Subscription Renewal Notice</h3>
                                <p style="font-size: 14px; color: #52525b; line-height: 1.6;">
                                    Hello <strong>${u.name}</strong>,<br/>
                                    Your workspace subscription for the <strong>${planSpec.name}</strong> tier will renew on <strong>${expiry.toLocaleDateString("en-KE", { dateStyle: "long" })}</strong>.
                                </p>
                                <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 20px 0; font-family: monospace; font-size: 13px;">
                                    <div>Plan: <strong>${planSpec.name}</strong></div>
                                    <div>Amount: <strong>${formatCurrency(planSpec.priceKesMonthly, "KES")} / month</strong></div>
                                    <div>Effective Expiry: <strong>${expiry.toLocaleDateString("en-KE")}</strong></div>
                                </div>
                                <p style="font-size: 13px; color: #71717a;">
                                    To renew seamlessly without service disruption, click the link below to authorize with M-Pesa.
                                </p>
                                <div style="margin-top: 24px;">
                                    <a href="${APP_URL}/workspaces" style="background: #000; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">
                                        Renew Subscription with M-Pesa &rarr;
                                    </a>
                                </div>
                            </div>
                        `,
                    });
                    summary.preRenewalAlertsSent++;
                } catch (err: any) {
                    summary.errors.push(`Pre-renewal email error for ${u.email}: ${err.message}`);
                }
            }

            // =========================================================================
            // PHASE 2: RENEWAL DAY AUTOMATED STK PUSH (0 Days / Due Today)
            // =========================================================================
            if (diffDays <= 0 && diffDays >= -1 && u.autoRenewEnabled && renewalPhone) {
                const cleanPhone = formatMpesaPhoneNumber(renewalPhone);
                const lastPrompt = u.lastRenewalPromptAt ? new Date(u.lastRenewalPromptAt) : null;
                const hoursSinceLastPrompt = lastPrompt ? (now.getTime() - lastPrompt.getTime()) / (1000 * 60 * 60) : 999;

                // Send STK prompt at most once every 24 hours
                if (cleanPhone && hoursSinceLastPrompt > 20) {
                    try {
                        const stkRes = await sendMpesaStkPush({
                            phoneNumber: cleanPhone,
                            amount: planSpec.priceKesMonthly,
                            accountReference: `MB-RNW-${u.plan}`,
                            transactionDesc: `Manna Renewal ${planSpec.name}`,
                        });

                        if (stkRes.success && stkRes.checkoutRequestId) {
                            // Find primary shop
                            const primaryShop = await db.query.shops.findFirst({
                                where: eq(shops.ownerId, u.id),
                            });

                            if (primaryShop) {
                                await db.insert(billingTransactions).values({
                                    shopId: primaryShop.id,
                                    checkoutRequestId: stkRes.checkoutRequestId,
                                    merchantRequestId: stkRes.merchantRequestId,
                                    phoneNumber: cleanPhone,
                                    amount: planSpec.priceKesMonthly.toString(),
                                    status: "PENDING",
                                    targetPlan: u.plan,
                                    billingMonths: 1,
                                });
                            }

                            await db.update(users).set({
                                lastRenewalPromptAt: now,
                            }).where(eq(users.id, u.id));

                            summary.renewalStkPromptsTriggered++;
                        }
                    } catch (err: any) {
                        summary.errors.push(`STK trigger error for ${u.email}: ${err.message}`);
                    }
                }
            }

            // =========================================================================
            // PHASE 3: GRACE PERIOD TRANSITION (1 to 5 Days Overdue)
            // =========================================================================
            if (diffDays < 0 && diffDays >= -5 && u.subscriptionStatus !== "GRACE_PERIOD") {
                try {
                    const graceEnd = new Date(expiry.getTime() + (5 * 24 * 60 * 60 * 1000));

                    await db.update(users).set({
                        subscriptionStatus: "GRACE_PERIOD",
                        gracePeriodEndsAt: graceEnd,
                    }).where(eq(users.id, u.id));

                    await db.update(shops).set({
                        subscriptionStatus: "GRACE_PERIOD",
                        gracePeriodEndsAt: graceEnd,
                    }).where(eq(shops.ownerId, u.id));

                    await resend.emails.send({
                        from: FROM_EMAIL,
                        to: u.email,
                        subject: `⚠️ Grace Period Active: Renew your MannaBooks ${planSpec.name} Subscription`,
                        html: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #18181b;">
                                <h2 style="margin: 0; font-size: 20px; font-weight: 900; text-transform: uppercase; color: #b45309;">⚠️ Grace Period Notice</h2>
                                <p style="font-size: 14px; color: #52525b; line-height: 1.6; margin-top: 16px;">
                                    Hello <strong>${u.name}</strong>,<br/>
                                    Your <strong>${planSpec.name}</strong> plan expired on <strong>${expiry.toLocaleDateString("en-KE")}</strong>.
                                </p>
                                <div style="background: #fef3c7; border: 1px solid #fcd34d; padding: 16px; border-radius: 8px; margin: 20px 0; color: #78350f; font-size: 13px;">
                                    <strong>You are in a 5-day grace period.</strong> Your workspace access remains completely uninterrupted until <strong>${graceEnd.toLocaleDateString("en-KE")}</strong>. Please renew to avoid features being soft-locked.
                                </div>
                                <div style="margin-top: 24px;">
                                    <a href="${APP_URL}/workspaces" style="background: #b45309; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">
                                        ⚡ Renew Plan Now &rarr;
                                    </a>
                                </div>
                            </div>
                        `,
                    });

                    summary.gracePeriodsEntered++;
                } catch (err: any) {
                    summary.errors.push(`Grace period transition error for ${u.email}: ${err.message}`);
                }
            }

            // =========================================================================
            // PHASE 4: SOFT-LOCK / EXPIRED TRANSITION (> 5 Days Overdue)
            // =========================================================================
            if (diffDays < -5 && u.subscriptionStatus !== "EXPIRED") {
                try {
                    await db.update(users).set({
                        subscriptionStatus: "EXPIRED",
                    }).where(eq(users.id, u.id));

                    await db.update(shops).set({
                        subscriptionStatus: "EXPIRED",
                    }).where(eq(shops.ownerId, u.id));

                    await resend.emails.send({
                        from: FROM_EMAIL,
                        to: u.email,
                        subject: `🔒 MannaBooks Account Soft-Locked: Reactivate Your ${planSpec.name} Plan`,
                        html: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #18181b;">
                                <h2 style="margin: 0; font-size: 20px; font-weight: 900; text-transform: uppercase; color: #e11d48;">🔒 Subscription Expired</h2>
                                <p style="font-size: 14px; color: #52525b; line-height: 1.6; margin-top: 16px;">
                                    Hello <strong>${u.name}</strong>,<br/>
                                    The 5-day grace period for your workspace has ended. Your account has transitioned to Free Starter limits.
                                </p>
                                <p style="font-size: 13px; color: #71717a;">
                                    All your historical data, invoices, customer ledgers, and financial records remain safe and preserved. To create new documents or unlock unlimited features, reactivate your subscription at any time.
                                </p>
                                <div style="margin-top: 24px;">
                                    <a href="${APP_URL}/workspaces" style="background: #000; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">
                                        ⚡ Reactivate Plan with M-Pesa &rarr;
                                    </a>
                                </div>
                            </div>
                        `,
                    });

                    summary.softLocksExecuted++;
                } catch (err: any) {
                    summary.errors.push(`Soft-lock execution error for ${u.email}: ${err.message}`);
                }
            }
        }

        return NextResponse.json({
            success: true,
            timestamp: now.toISOString(),
            summary,
        });
    } catch (error: any) {
        console.error("Subscription lifecycle cron error:", error);
        return NextResponse.json({ success: false, error: error.message || "Internal cron error" }, { status: 500 });
    }
}
