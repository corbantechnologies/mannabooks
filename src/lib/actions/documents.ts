"use server";

import { db } from "@/db";
import { documents, documentItems, documentTokens, shops } from "@/db/schema";
import { calculateLineItem, calculateDocumentTotals } from "@/lib/utils";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

interface CreateDocumentItemInput {
    description: string;
    quantity: number;
    unitPrice: number;
    taxType: "V_16" | "V_0" | "EXEMPT";
}

interface CreateDocumentInput {
    shopId: string;
    shopSlug: string;
    clientId: string;
    type: "QUOTATION" | "INVOICE" | "RECEIPT";
    dueDate?: Date;
    items: CreateDocumentItemInput[];
}

/**
 * Main compilation engine that structures, handles math calculations, and saves formal billing records.
 */
export async function createBillingDocument(input: CreateDocumentInput): Promise<{ success: true; documentId: string; serial: string } | { success: false; error: string }> {
    try {
        if (input.items.length === 0) {
            return { success: false, error: "A document must contain at least one line item entry." };
        }

        return await db.transaction(async (tx) => {

            // 1. Fetch current shop compliance criteria to determine active tax processing
            const shopProfile = await tx.query.shops.findFirst({
                where: eq(shops.id, input.shopId),
            });

            if (!shopProfile) {
                throw new Error("Merchant shop identity context missing.");
            }

            const isVatActive = shopProfile.isVatRegistered;

            // 2. Map serial numbers chronologically based on target document type
            const activeTypeRecords = await tx.query.documents.findMany({
                where: and(
                    eq(documents.shopId, input.shopId),
                    eq(documents.type, input.type)
                ),
            });

            const nextSequence = activeTypeRecords.length + 1;
            const prefix = input.type === "QUOTATION" ? "QT" : input.type === "INVOICE" ? "INV" : "RCP";
            const formattedSerial = `${prefix}-${String(nextSequence).padStart(4, "0")}`;

            // 3. Process complete batch arrays using calculation engine rules
            const calculatedTotals = calculateDocumentTotals({
                items: input.items,
                isShopVatRegistered: isVatActive,
            });

            // 4. Create the parent Document snapshot
            const [newDoc] = await tx.insert(documents).values({
                shopId: input.shopId,
                clientId: input.clientId,
                type: input.type,
                docNumber: formattedSerial,
                status: "DRAFT", // Default newly generated files to editable draft status
                subTotal: calculatedTotals.subTotal.toString(),
                taxAmount: calculatedTotals.taxAmount.toString(),
                grandTotal: calculatedTotals.grandTotal.toString(),
                issueDate: new Date(),
                dueDate: input.dueDate || null,
            }).returning();

            // 5. Structure and write the calculated item rows to the sub-ledger
            const compiledRowsPayload = input.items.map((rowItem) => {
                const lineMath = calculateLineItem({
                    quantity: rowItem.quantity,
                    unitPrice: rowItem.unitPrice,
                    taxType: rowItem.taxType,
                    isShopVatRegistered: isVatActive,
                });

                return {
                    documentId: newDoc.id,
                    description: rowItem.description.trim(),
                    quantity: rowItem.quantity.toString(),
                    unitPrice: rowItem.unitPrice.toString(),
                    taxType: rowItem.taxType,
                    taxAmount: lineMath.taxAmount.toString(),
                    itemTotal: lineMath.itemTotal.toString(),
                };
            });

            await tx.insert(documentItems).values(compiledRowsPayload);

            // 6. Provision the secure public gateway token key
            const secureHexToken = crypto.randomBytes(32).toString("hex");
            await tx.insert(documentTokens).values({
                documentId: newDoc.id,
                token: secureHexToken,
            });

            revalidatePath(`/workspaces/${input.shopSlug}/documents`);
            revalidatePath(`/workspaces/${input.shopSlug}/clients/${input.clientId}`);

            return { success: true, documentId: newDoc.id, serial: formattedSerial };
        });
    } catch (error) {
        console.error("Critical failure during document processing sequence:", error);
        return { success: false, error: "Failed to persist document transaction details." };
    }
}

interface UpdateDocumentStatusInput {
    documentId: string;
    shopId: string;
    shopSlug: string;
    status: "DRAFT" | "SENT" | "OVERDUE" | "PAID";
}

/**
 * Updates the lifecycle status of an existing document.
 * Re-validates the document detail and master ledger pages on success.
 */
export async function updateDocumentStatus(input: UpdateDocumentStatusInput): Promise<{ success: true } | { success: false; error: string }> {
    try {
        // Verify the document belongs to this shop before mutating
        const existing = await db.query.documents.findFirst({
            where: and(eq(documents.id, input.documentId), eq(documents.shopId, input.shopId)),
        });

        if (!existing) {
            return { success: false, error: "Document not found or access denied." };
        }

        await db.update(documents)
            .set({ status: input.status })
            .where(and(eq(documents.id, input.documentId), eq(documents.shopId, input.shopId)));

        revalidatePath(`/workspaces/${input.shopSlug}/documents`);
        revalidatePath(`/workspaces/${input.shopSlug}/documents/${input.documentId}`);
        revalidatePath(`/workspaces/${input.shopSlug}/clients`);

        return { success: true };
    } catch (error) {
        console.error("Failed to update document status:", error);
        return { success: false, error: "Failed to update document status." };
    }
}