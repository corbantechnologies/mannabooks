// src/lib/actions/loyalty.ts
"use server";

import { db } from "@/db";
import {
    loyaltyPrograms,
    membershipTiers,
    clientLoyaltyAccounts,
    loyaltyLedger,
    clients,
    shops,
    documents,
} from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { verifyAndGetSession } from "./auth";
import { revalidatePath } from "next/cache";

// ================================================================
// 1. LOYALTY PROGRAM CONFIGURATION
// ================================================================

export async function getLoyaltyProgram(shopId: string) {
    try {
        let program = await db.query.loyaltyPrograms.findFirst({
            where: eq(loyaltyPrograms.shopId, shopId),
        });

        // Initialize default program if none exists
        if (!program) {
            const [created] = await db.insert(loyaltyPrograms).values({
                shopId,
                isEnabled: false,
                engineMode: "HYBRID",
                programName: "Rewards Club",
                earnRateKes: "100.00",
                pointValueKes: "1.00",
                minRedeemPoints: 50,
            }).returning();
            program = created;
        }

        return { success: true, data: program };
    } catch (error: any) {
        console.error("Failed to get loyalty program:", error);
        return { success: false, error: "Failed to retrieve loyalty configuration." };
    }
}

export async function updateLoyaltyProgram(
    shopId: string,
    shopSlug: string,
    data: {
        isEnabled?: boolean;
        engineMode?: "OFF" | "POINTS_ONLY" | "TIERS_ONLY" | "HYBRID";
        programName?: string;
        earnRateKes?: string;
        pointValueKes?: string;
        minRedeemPoints?: number;
        pointsExpiryDays?: number | null;
    }
) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        await db.update(loyaltyPrograms)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(loyaltyPrograms.shopId, shopId));

        if (data.engineMode) {
            await db.update(shops)
                .set({ loyaltyEngineMode: data.engineMode })
                .where(eq(shops.id, shopId));
        }

        revalidatePath(`/workspaces/${shopSlug}/settings`);
        revalidatePath(`/workspaces/${shopSlug}/settings/loyalty`);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update loyalty program:", error);
        return { success: false, error: "Failed to update loyalty program." };
    }
}

// ================================================================
// 2. MEMBERSHIP TIERS MANAGEMENT
// ================================================================

export async function getMembershipTiers(shopId: string) {
    try {
        let tiers = await db.query.membershipTiers.findMany({
            where: eq(membershipTiers.shopId, shopId),
            orderBy: [membershipTiers.displayOrder, membershipTiers.minSpendKes],
        });

        // Seed default tiered structure if empty
        if (tiers.length === 0) {
            const defaults = [
                { shopId, name: "Bronze Member", minSpendKes: "0.00", discountPercent: "0.00", pointsMultiplier: "1.00", badgeColor: "#92400e", displayOrder: 1 },
                { shopId, name: "Silver VIP", minSpendKes: "25000.00", discountPercent: "5.00", pointsMultiplier: "1.25", badgeColor: "#64748b", displayOrder: 2 },
                { shopId, name: "Gold Preferred", minSpendKes: "100000.00", discountPercent: "10.00", pointsMultiplier: "1.50", badgeColor: "#eab308", displayOrder: 3 },
                { shopId, name: "Platinum Corporate", minSpendKes: "500000.00", discountPercent: "15.00", pointsMultiplier: "2.00", badgeColor: "#0f172a", displayOrder: 4 },
            ];
            tiers = await db.insert(membershipTiers).values(defaults).returning();
        }

        return { success: true, data: tiers };
    } catch (error: any) {
        console.error("Failed to fetch membership tiers:", error);
        return { success: false, error: "Failed to load membership tiers." };
    }
}

export async function createMembershipTier(
    shopId: string,
    shopSlug: string,
    data: {
        name: string;
        minSpendKes: string;
        discountPercent: string;
        pointsMultiplier: string;
        badgeColor?: string;
        displayOrder?: number;
    }
) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        const [tier] = await db.insert(membershipTiers).values({
            shopId,
            name: data.name.trim(),
            minSpendKes: data.minSpendKes || "0.00",
            discountPercent: data.discountPercent || "0.00",
            pointsMultiplier: data.pointsMultiplier || "1.00",
            badgeColor: data.badgeColor || "#71717a",
            displayOrder: data.displayOrder || 0,
        }).returning();

        revalidatePath(`/workspaces/${shopSlug}/settings/loyalty`);
        return { success: true, data: tier };
    } catch (error: any) {
        console.error("Failed to create tier:", error);
        return { success: false, error: "Failed to create membership tier." };
    }
}

export async function updateMembershipTier(
    tierId: string,
    shopSlug: string,
    data: {
        name?: string;
        minSpendKes?: string;
        discountPercent?: string;
        pointsMultiplier?: string;
        badgeColor?: string;
        displayOrder?: number;
    }
) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        await db.update(membershipTiers)
            .set(data)
            .where(eq(membershipTiers.id, tierId));

        revalidatePath(`/workspaces/${shopSlug}/settings/loyalty`);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update tier:", error);
        return { success: false, error: "Failed to update membership tier." };
    }
}

export async function deleteMembershipTier(tierId: string, shopSlug: string) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        await db.delete(membershipTiers).where(eq(membershipTiers.id, tierId));
        revalidatePath(`/workspaces/${shopSlug}/settings/loyalty`);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete tier:", error);
        return { success: false, error: "Failed to delete tier." };
    }
}

// ================================================================
// 3. CLIENT LOYALTY ACCOUNTS & 1-SECOND POS CAPTURE
// ================================================================

export async function getClientLoyaltyAccount(shopId: string, clientId: string) {
    try {
        let account = await db.query.clientLoyaltyAccounts.findFirst({
            where: and(
                eq(clientLoyaltyAccounts.shopId, shopId),
                eq(clientLoyaltyAccounts.clientId, clientId)
            ),
            with: {
                tier: true,
                ledgerEntries: {
                    orderBy: [desc(loyaltyLedger.createdAt)],
                    limit: 20,
                },
            },
        });

        // Auto-provision if client doesn't have an account yet
        if (!account) {
            const tiersResult = await getMembershipTiers(shopId);
            const defaultTier = tiersResult.success && tiersResult.data && tiersResult.data.length > 0 ? tiersResult.data[0] : null;

            const memberNumber = `MEM-${Date.now().toString().slice(-6)}`;
            const [created] = await db.insert(clientLoyaltyAccounts).values({
                shopId,
                clientId,
                memberNumber,
                tierId: defaultTier?.id || null,
                currentPoints: 0,
                lifetimePoints: 0,
                walletBalanceKes: "0.00",
            }).returning();

            account = await db.query.clientLoyaltyAccounts.findFirst({
                where: eq(clientLoyaltyAccounts.id, created.id),
                with: { tier: true, ledgerEntries: true },
            });
        }

        return { success: true, data: account };
    } catch (error: any) {
        console.error("Failed to get client loyalty account:", error);
        return { success: false, error: "Failed to load customer loyalty account." };
    }
}

/**
 * High-speed 1-second POS Walk-In Capture:
 * Finds an existing client by phone or auto-creates a light client record on the fly.
 */
export async function findOrCreateLoyaltyAccountByPhone(
    shopId: string,
    phone: string,
    customerName?: string
) {
    try {
        const cleanPhone = phone.trim().replace(/\s+/g, "");
        if (!cleanPhone || cleanPhone.length < 9) {
            return { success: false, error: "Please provide a valid phone number (minimum 9 digits)." };
        }

        // 1. Search for existing client with this phone
        let client = await db.query.clients.findFirst({
            where: and(
                eq(clients.shopId, shopId),
                eq(clients.phone, cleanPhone)
            ),
        });

        // 2. If not found, create a light client record
        if (!client) {
            const name = customerName?.trim() || `Customer ${cleanPhone.slice(-4)}`;
            const dummyEmail = `customer.${cleanPhone}@walkin.mannabooks.co.ke`;

            const [createdClient] = await db.insert(clients).values({
                shopId,
                name,
                email: dummyEmail,
                phone: cleanPhone,
                clientType: "WALK_IN",
            }).returning();
            client = createdClient;
        }

        // 3. Resolve or initialize their loyalty account
        const accountResult = await getClientLoyaltyAccount(shopId, client.id);
        if (!accountResult.success || !accountResult.data) {
            return { success: false, error: "Failed to initialize loyalty account for this customer." };
        }

        return {
            success: true,
            data: {
                client,
                loyaltyAccount: accountResult.data,
            },
        };
    } catch (error: any) {
        console.error("Error in findOrCreateLoyaltyAccountByPhone:", error);
        return { success: false, error: "Failed to process customer phone number." };
    }
}

// ================================================================
// 4. POINTS ACCRUAL & REDEMPTION ENGINE
// ================================================================

/**
 * Accrues loyalty points upon document issuance/settlement.
 */
export async function accrueDocumentLoyalty(documentId: string) {
    try {
        const doc = await db.query.documents.findFirst({
            where: eq(documents.id, documentId),
            with: { shop: true, client: true },
        });

        if (!doc || !doc.clientId || !doc.shop) return { success: false, error: "Invalid document." };

        // Check if shop has loyalty enabled
        const programResult = await getLoyaltyProgram(doc.shopId);
        if (!programResult.success || !programResult.data || !programResult.data.isEnabled) {
            return { success: true, message: "Loyalty program is not active." };
        }

        const program = programResult.data;
        if (program.engineMode === "OFF" || program.engineMode === "TIERS_ONLY") {
            return { success: true, message: "Points engine is disabled for this workspace." };
        }

        const accountResult = await getClientLoyaltyAccount(doc.shopId, doc.clientId);
        if (!accountResult.success || !accountResult.data) return { success: false, error: "Account not found." };

        const account = accountResult.data;
        const parsedEarnRate = parseFloat(program.earnRateKes);
        const earnRate = (!Number.isNaN(parsedEarnRate) && parsedEarnRate > 0) ? parsedEarnRate : 100;
        const grossAmount = parseFloat(doc.grandTotal || "0");

        if (grossAmount <= 0) return { success: true };

        const parsedMultiplier = account.tier ? parseFloat(account.tier.pointsMultiplier) : 1;
        const multiplier = !Number.isNaN(parsedMultiplier) ? parsedMultiplier : 1;
        const pointsEarned = Math.floor((grossAmount / earnRate) * multiplier);

        if (pointsEarned <= 0) return { success: true };

        const newCurrentPoints = account.currentPoints + pointsEarned;
        const newLifetimePoints = account.lifetimePoints + pointsEarned;

        // Write ledger entry
        await db.insert(loyaltyLedger).values({
            shopId: doc.shopId,
            accountId: account.id,
            movementType: "EARN",
            pointsDelta: pointsEarned,
            walletDeltaKes: "0.00",
            runningPointsBalance: newCurrentPoints,
            runningWalletBalanceKes: account.walletBalanceKes,
            sourceDocumentId: doc.id,
            notes: `Earned ${pointsEarned} pts on ${doc.docNumber}`,
        });

        // Update customer account balances
        await db.update(clientLoyaltyAccounts)
            .set({
                currentPoints: newCurrentPoints,
                lifetimePoints: newLifetimePoints,
                updatedAt: new Date(),
            })
            .where(eq(clientLoyaltyAccounts.id, account.id));

        // Update document points earned tracker
        await db.update(documents)
            .set({ loyaltyPointsEarned: pointsEarned })
            .where(eq(documents.id, doc.id));

        return { success: true, pointsEarned };
    } catch (error: any) {
        console.error("accrueDocumentLoyalty failed:", error);
        return { success: false, error: "Failed to accrue loyalty points." };
    }
}

/**
 * Redeems points for an instant Sales Discount (Account 4200) on an invoice/POS sale.
 */
export async function redeemLoyaltyPoints(
    shopId: string,
    clientId: string,
    pointsToRedeem: number,
    sourceDocumentId?: string
) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        if (pointsToRedeem <= 0) return { success: false, error: "Points to redeem must be greater than zero." };

        const programResult = await getLoyaltyProgram(shopId);
        if (!programResult.success || !programResult.data) {
            return { success: false, error: "Loyalty program is unavailable." };
        }

        const program = programResult.data;
        if (pointsToRedeem < program.minRedeemPoints) {
            return {
                success: false,
                error: `Minimum redemption threshold is ${program.minRedeemPoints} points.`,
            };
        }

        const accountResult = await getClientLoyaltyAccount(shopId, clientId);
        if (!accountResult.success || !accountResult.data) {
            return { success: false, error: "Customer loyalty account not found." };
        }

        const account = accountResult.data;
        if (account.currentPoints < pointsToRedeem) {
            return {
                success: false,
                error: `Insufficient points balance. Customer only has ${account.currentPoints} points.`,
            };
        }

        const parsedPointValue = parseFloat(program.pointValueKes);
        const pointValue = (!Number.isNaN(parsedPointValue) && parsedPointValue >= 0) ? parsedPointValue : 1.0;
        const discountKes = pointsToRedeem * pointValue;
        const newRunningPoints = account.currentPoints - pointsToRedeem;

        // 1. Write immutable ledger entry
        await db.insert(loyaltyLedger).values({
            shopId,
            accountId: account.id,
            movementType: "REDEEM",
            pointsDelta: -pointsToRedeem,
            walletDeltaKes: "0.00",
            runningPointsBalance: newRunningPoints,
            runningWalletBalanceKes: account.walletBalanceKes,
            sourceDocumentId: sourceDocumentId || null,
            notes: `Redeemed ${pointsToRedeem} points for KES ${discountKes.toFixed(2)} sales discount`,
            createdById: session.userId,
        });

        // 2. Decrement account balance
        await db.update(clientLoyaltyAccounts)
            .set({
                currentPoints: newRunningPoints,
                updatedAt: new Date(),
            })
            .where(eq(clientLoyaltyAccounts.id, account.id));

        return {
            success: true,
            discountKes,
            remainingPoints: newRunningPoints,
        };
    } catch (error: any) {
        console.error("redeemLoyaltyPoints failed:", error);
        return { success: false, error: "Failed to redeem loyalty points." };
    }
}
