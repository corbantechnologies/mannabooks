"use server";

import { db } from "@/db";
import { clients, suppliers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyAndGetSession } from "./auth";
import { revalidatePath } from "next/cache";

export async function syncClientToSupplierAction(clientId: string, shopId: string, shopSlug: string) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized session context." };

    try {
        const clientRec = await db.query.clients.findFirst({
            where: and(eq(clients.id, clientId), eq(clients.shopId, shopId)),
        });

        if (!clientRec) {
            return { success: false, error: "Client profile not found." };
        }

        // Validate matching supplier existence
        const conditions = [eq(suppliers.email, clientRec.email)];
        if (clientRec.taxPin) {
            conditions.push(eq(suppliers.taxPin, clientRec.taxPin));
        }

        const existingSupplier = await db.query.suppliers.findFirst({
            where: and(
                eq(suppliers.shopId, shopId),
                clientRec.taxPin 
                    ? eq(suppliers.taxPin, clientRec.taxPin)
                    : eq(suppliers.email, clientRec.email)
            ),
        });

        if (existingSupplier) {
            return { success: false, error: "A matching Supplier profile already exists." };
        }

        await db.insert(suppliers).values({
            shopId,
            name: clientRec.name,
            email: clientRec.email,
            phone: clientRec.phone,
            supplierType: clientRec.clientType,
            taxPin: clientRec.taxPin,
            requiresEtims: clientRec.requiresEtims,
            paymentTerms: "NET_30",
        });

        revalidatePath(`/workspaces/${shopSlug}/clients/${clientId}`);
        revalidatePath(`/workspaces/${shopSlug}/suppliers`);
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to clone client as supplier." };
    }
}

export async function syncSupplierToClientAction(supplierId: string, shopId: string, shopSlug: string) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized session context." };

    try {
        const supplierRec = await db.query.suppliers.findFirst({
            where: and(eq(suppliers.id, supplierId), eq(suppliers.shopId, shopId)),
        });

        if (!supplierRec) {
            return { success: false, error: "Supplier profile not found." };
        }

        // Validate matching client existence
        const existingClient = await db.query.clients.findFirst({
            where: and(
                eq(clients.shopId, shopId),
                supplierRec.taxPin
                    ? eq(clients.taxPin, supplierRec.taxPin)
                    : eq(clients.email, supplierRec.email)
            ),
        });

        if (existingClient) {
            return { success: false, error: "A matching Client profile already exists." };
        }

        await db.insert(clients).values({
            shopId,
            name: supplierRec.name,
            email: supplierRec.email,
            phone: supplierRec.phone,
            clientType: supplierRec.supplierType,
            taxPin: supplierRec.taxPin,
            requiresEtims: supplierRec.requiresEtims,
        });

        revalidatePath(`/workspaces/${shopSlug}/suppliers/${supplierId}`);
        revalidatePath(`/workspaces/${shopSlug}/clients`);
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to clone supplier as client." };
    }
}
