"use server";

import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { enforcePermission } from "./rbac";
import { isApiModuleEnabled } from "@/lib/api/flags";
import { apiCall } from "@/lib/api/client";

interface CreateClientInput {
    shopId: string; // The active shop isolation token from the user session
    shopSlug: string; // For accurate cache revalidation
    name: string;
    email?: string;
    phone?: string;
    clientType: "WALK_IN" | "INDIVIDUAL" | "CORPORATE";
    taxPin?: string;
    requiresEtims?: boolean;
}

/**
 * Server Action to register a new client profile under a strict multi-tenant boundary.
 */
export async function createClientProfile(input: CreateClientInput) {
    try {
        await enforcePermission(input.shopId, "manage_clients");

        // 1. Structural Validation based on compliance selections
        const cleanEmail = input.email ? input.email.toLowerCase().trim() : "";
        const cleanName = input.name.trim();
        const cleanPin = input.taxPin?.toUpperCase().trim() || null;

        const apiRes = await apiCall<{ id: string }>(`/v1/clients?shop_id=${input.shopId}`, {
            method: "POST",
            body: JSON.stringify({
                name: cleanName,
                email: cleanEmail || null,
                phone: input.phone?.trim() || null,
                client_type: input.clientType,
                tax_pin: cleanPin,
                requires_etims: input.requiresEtims || false,
            }),
        });
        if (apiRes.error) {
            return { success: false, error: apiRes.error };
        }
        revalidatePath(`/workspaces/${input.shopSlug}/clients`);
        return { success: true, clientId: apiRes.data?.id };
    } catch (error: any) {
        console.error("Failed to commit new client profile record:", error);
        return { success: false, error: error.message || "An unexpected database error occurred. Please try again." };
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
        await enforcePermission(shopId, "manage_clients");

        if (isApiModuleEnabled("clients")) {
            const cleanPin = updates.taxPin?.toUpperCase().trim() || null;
            const apiRes = await apiCall(`/v1/clients/${id}?shop_id=${shopId}`, {
                method: "PATCH",
                body: JSON.stringify({
                    name: updates.name?.trim(),
                    email: updates.email?.toLowerCase().trim() || null,
                    phone: updates.phone?.trim() || null,
                    client_type: updates.clientType,
                    tax_pin: cleanPin,
                    requires_etims: updates.requiresEtims,
                }),
            });
            if (apiRes.error) {
                return { success: false, error: apiRes.error };
            }
            revalidatePath(`/workspaces/${shopSlug}/clients`);
            revalidatePath(`/workspaces/${shopSlug}/clients/${id}`);
            return { success: true };
        }

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
                taxPin: cleanPin !== undefined ? cleanPin : existing.taxPin,
                requiresEtims: updates.requiresEtims !== undefined ? updates.requiresEtims : existing.requiresEtims,
            })
            .where(and(eq(clients.id, id), eq(clients.shopId, shopId)));

        revalidatePath(`/workspaces/${shopSlug}/clients`);
        revalidatePath(`/workspaces/${shopSlug}/clients/${id}`);

        return { success: true };
    } catch (error: any) {
        console.error("Failed to update client profile records:", error);
        return { success: false, error: error.message || "Failed to persist client corrections data." };
    }
}

/**
 * Server Action to remove a client profile node.
 */
export async function deleteClientProfile(id: string, shopId: string, shopSlug: string) {
    try {
        await enforcePermission(shopId, "manage_clients");

        if (isApiModuleEnabled("clients") || !process.env.DATABASE_URL) {
            const apiRes = await apiCall(`/v1/clients/${id}?shop_id=${shopId}`, {
                method: "DELETE",
            });
            if (apiRes.error) {
                return { success: false, error: apiRes.error };
            }
            revalidatePath(`/workspaces/${shopSlug}/clients`);
            return { success: true };
        }

        await db.delete(clients)
            .where(and(eq(clients.id, id), eq(clients.shopId, shopId)));

        revalidatePath(`/workspaces/${shopSlug}/clients`);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete client profile:", error);
        return { success: false, error: error.message || "Failed to remove client record from database." };
    }
}