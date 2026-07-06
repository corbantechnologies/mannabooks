"use server";

import { db } from "@/db";
import { users, shops, documents } from "@/db/schema";
import { count } from "drizzle-orm";
import { verifyAndGetSession } from "./auth";

/**
 * Validates the current session and ensures the user is a Super Admin.
 */
export async function enforceSuperAdmin() {
    const session = await verifyAndGetSession();
    if (!session || !session.user) {
        return null;
    }

    if (!session.user.isSuperAdmin) {
        return null;
    }

    return session.user;
}

/**
 * Fetches platform-wide statistics for the global admin dashboard.
 */
export async function getPlatformStats() {
    const adminUser = await enforceSuperAdmin();
    if (!adminUser) {
        return { success: false, error: "Access Denied. Super Admin privileges required." };
    }

    try {
        const [totalUsers, totalShops, totalDocuments] = await Promise.all([
            db.select({ value: count() }).from(users),
            db.select({ value: count() }).from(shops),
            db.select({ value: count() }).from(documents),
        ]);

        return {
            success: true,
            stats: {
                users: totalUsers[0].value,
                workspaces: totalShops[0].value,
                documents: totalDocuments[0].value,
            }
        };
    } catch (error) {
        console.error("Failed to fetch platform stats:", error);
        return { success: false, error: "Failed to read analytics from the database." };
    }
}
