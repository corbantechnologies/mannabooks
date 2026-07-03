"use server";

import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface CreateClientInput {
    shopId: string; // The active shop isolation token from the user session
    shopSlug: string; // For accurate cache revalidation
    name: string;
    email: string;
    phone?: string;
    clientType: "WALK_IN" | "INDIVIDUAL" | "CORPORATE";
    taxPin?: string;
}

/**
 * Server Action to register a new client profile under a strict multi-tenant boundary.
 */
export async function createClientProfile(input: CreateClientInput) {
    try {
        // 1. Structural Validation based on compliance selections
        const cleanEmail = input.email.toLowerCase().trim();
        const cleanName = input.name.trim();
        const cleanPin = input.taxPin?.toUpperCase().trim() || null;

        if (input.clientType !== "WALK_IN" && !cleanPin) {
            return { success: false, error: "A valid Tax PIN is required for Individual or Corporate profiles." };
        }

        // 2. Format validation logic for statutory tax identifiers (e.g., KRA PIN format: 1 Letter, 11 Numbers, 1 Letter)
        if (cleanPin) {
            const pinRegex = /^[A-Z]\d{9}[A-Z]$/;
            if (!pinRegex.test(cleanPin)) {
                return { success: false, error: "The provided Tax PIN format is invalid. Must be 11 characters (e.g. P051234567Z)." };
            }
        }

        // 3. Write data safely to the PostgreSQL repository
        const [newClient] = await db.insert(clients).values({
            shopId: input.shopId,
            name: cleanName,
            email: cleanEmail,
            phone: input.phone?.trim() || null,
            clientType: input.clientType,
            taxPin: input.clientType === "WALK_IN" ? null : cleanPin,
        }).returning();

        // 4. Force Next.js to purge cached lists so the client directory updates instantly
        revalidatePath(`/workspaces/${input.shopSlug}/clients`);

        return { success: true, clientId: newClient.id };
    } catch (error) {
        console.error("Failed to commit new client profile record:", error);
        return { success: false, error: "An unexpected database error occurred. Please try again." };
    }
}

interface UpdateClientInput extends Partial<CreateClientInput> {
    id: string;
    shopId: string;
    shopSlug: string;
}

/**
 * Server Action to modify an existing client profile, double-checking tenant isolation boundaries.
 */
export async function updateClientProfile({ id, shopId, shopSlug, ...updates }: UpdateClientInput) {
    try {
        // Verify target profile is owned by the requesting shop entity
        const existing = await db.query.clients.findFirst({
            where: and(eq(clients.id, id), eq(clients.shopId, shopId)),
        });

        if (!existing) {
            return { success: false, error: "Client registry node not found or access denied." };
        }

        const cleanPin = updates.taxPin?.toUpperCase().trim();

        await db.update(clients)
            .set({
                name: updates.name?.trim(),
                email: updates.email?.toLowerCase().trim(),
                phone: updates.phone?.trim(),
                clientType: updates.clientType,
                taxPin: updates.clientType === "WALK_IN" ? null : cleanPin || existing.taxPin,
            })
            .where(and(eq(clients.id, id), eq(clients.shopId, shopId)));

        revalidatePath(`/workspaces/${shopSlug}/clients`);
        revalidatePath(`/workspaces/${shopSlug}/clients/${id}`);

        return { success: true };
    } catch (error) {
        console.error("Failed to update client profile records:", error);
        return { success: false, error: "Failed to persist client corrections data." };
    }
}