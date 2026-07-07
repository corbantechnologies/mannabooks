"use server";

import { db } from "@/db";
import { documents, documentItems, documentTokens, shops, clients } from "@/db/schema";
import { calculateLineItem, calculateDocumentTotals } from "@/lib/utils";
import { eq, and, gte, lte } from "drizzle-orm";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

import { applyDocumentStockMovements } from "@/lib/actions/stock";
import { getFiscalYearRange, getFyDocSuffix } from "@/lib/fiscalYear";

export type DocumentType = 
  | "QUOTATION" 
  | "INVOICE" 
  | "RECEIPT" 
  | "LPO" 
  | "PO" 
  | "DELIVERY_NOTE" 
  | "CREDIT_NOTE" 
  | "DEBIT_NOTE" 
  | "GOODS_RECEIVED_NOTE" 
  | "PAYMENT_VOUCHER"
  | "PAYROLL_VOUCHER";

interface CreateDocumentItemInput {
    productId?: string;
    description: string;
    notes?: string;
    quantity: number;
    unitPrice: number;
    taxType: "V_16" | "V_0" | "EXEMPT";
}

interface CreateDocumentInput {
    shopId: string;
    shopSlug: string;
    clientId?: string;
    supplierId?: string;
    type: DocumentType;
    dueDate?: Date;
    kraCuInvoiceNumber?: string;
    parentDocumentId?: string;
    requiresEtims?: boolean;
    notes?: string;
    currency?: string;
    customerEmail?: string;
    sourceDocType?: DocumentType;
    isRecurring?: boolean;
    recurringInterval?: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
    items: CreateDocumentItemInput[];
}

function determineDefaultStatus(type: DocumentType, sourceDocType?: DocumentType): "DRAFT" | "ISSUED" | "OVERDUE" | "PAID" | "RECEIVED" {
    // If converting Quotation -> Invoice, automatically issue it
    if (type === "INVOICE" && sourceDocType === "QUOTATION") {
        return "ISSUED";
    }

    switch (type) {
        case "RECEIPT":
        case "PAYMENT_VOUCHER":
        case "PAYROLL_VOUCHER":
            return "PAID";
        case "CREDIT_NOTE":
        case "DEBIT_NOTE":
        case "DELIVERY_NOTE":
            return "ISSUED";
        case "GOODS_RECEIVED_NOTE":
            return "RECEIVED";
        case "QUOTATION":
        case "INVOICE":
        case "LPO":
        case "PO":
        default:
            return "DRAFT";
    }
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

            const fyStartMonth = shopProfile.fiscalYearStartMonth || 1;
            const { start: fyStart, end: fyEnd } = getFiscalYearRange(fyStartMonth);
            const fySuffix = getFyDocSuffix(fyStartMonth);

            // 2. Map serial numbers chronologically based on target document type in the current fiscal year
            const activeTypeRecords = await tx.query.documents.findMany({
                where: and(
                    eq(documents.shopId, input.shopId),
                    eq(documents.type, input.type),
                    gte(documents.createdAt, fyStart),
                    lte(documents.createdAt, fyEnd)
                ),
            });

            const nextSequence = activeTypeRecords.length + 1;
            const prefixMap: Record<DocumentType, string> = {
                QUOTATION: "QT",
                INVOICE: "INV",
                RECEIPT: "RCT",
                LPO: "LPO",
                PO: "PO",
                DELIVERY_NOTE: "DN",
                CREDIT_NOTE: "CN",
                DEBIT_NOTE: "DBN",
                GOODS_RECEIVED_NOTE: "GRN",
                PAYMENT_VOUCHER: "PV",
                PAYROLL_VOUCHER: "PAY",
            };
            const prefix = prefixMap[input.type] || "DOC";
            const formattedSerial = `${prefix}-${fySuffix}-${String(nextSequence).padStart(4, "0")}`;

            // 3. Process walk-in customer email dynamically
            let finalClientId = input.clientId;
            if (input.customerEmail && !finalClientId) {
                const existingWalkIn = await tx.query.clients.findFirst({
                    where: and(eq(clients.shopId, input.shopId), eq(clients.email, input.customerEmail))
                });
                if (existingWalkIn) {
                    finalClientId = existingWalkIn.id;
                } else {
                    const [newClient] = await tx.insert(clients).values({
                        shopId: input.shopId,
                        name: "Walk-In Customer",
                        email: input.customerEmail,
                        clientType: "WALK_IN"
                    }).returning();
                    finalClientId = newClient.id;
                }
            }

            // 4. Process complete batch arrays using calculation engine rules
            const calculatedTotals = calculateDocumentTotals({
                items: input.items,
                isShopVatRegistered: isVatActive,
            });

            // 5. Insert master header registry (The Document)
            const [newDoc] = await tx.insert(documents).values({
                shopId: input.shopId,
                clientId: finalClientId || null,
                supplierId: input.supplierId || null,
                type: input.type,
                docNumber: formattedSerial,
                status: determineDefaultStatus(input.type, input.sourceDocType),
                kraCuInvoiceNumber: input.kraCuInvoiceNumber || null,
                parentDocumentId: input.parentDocumentId || null,
                requiresEtims: input.requiresEtims || false,
                notes: input.notes || null,
                currency: input.currency || shopProfile.currency,
                isRecurring: input.isRecurring || false,
                recurringInterval: input.recurringInterval || null,
                nextRecurringDate: input.isRecurring ? new Date(new Date().setMonth(new Date().getMonth() + 1)) : null, // Default to next month if recurring
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
                    productId: rowItem.productId || null,
                    description: rowItem.description.trim(),
                    notes: rowItem.notes?.trim() || null,
                    quantity: rowItem.quantity.toString(),
                    unitPrice: rowItem.unitPrice.toString(),
                    taxType: rowItem.taxType,
                    taxAmount: lineMath.taxAmount.toString(),
                    itemTotal: lineMath.itemTotal.toString(),
                };
            });

            await tx.insert(documentItems).values(compiledRowsPayload);

            // 6. Trigger Stock Movements
            if (input.type === "RECEIPT" && !input.parentDocumentId) {
                // Direct Receipts cause immediate outflow
                await applyDocumentStockMovements(newDoc.id, "OUTFLOW", tx);
            } else if (input.type === "GOODS_RECEIVED_NOTE") {
                // Goods Received Notes cause immediate inflow
                await applyDocumentStockMovements(newDoc.id, "INFLOW", tx);
            }

            // 7. Provision the secure public gateway token key
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
    status: "DRAFT" | "ISSUED" | "OVERDUE" | "PAID" | "RECEIVED";
    paymentChannel?: string;
    paymentReference?: string;
}

/**
 * Updates the lifecycle status of an existing document.
 * Re-validates the document detail and fiscal ledgers pages on success.
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

        // PERMANENT SETTLEMENT GUARD: Block reverting PAID documents
        if (existing.status === "PAID" && input.status !== "PAID") {
            return {
                success: false,
                error: "Statutory Rule: Settled PAID documents cannot be reverted. Issue a Credit Note to reverse value."
            };
        }

        const updateData: any = { status: input.status };
        if (input.paymentChannel !== undefined) {
            updateData.paymentChannel = input.paymentChannel.trim() || null;
        }
        if (input.paymentReference !== undefined) {
            updateData.paymentReference = input.paymentReference.trim() || null;
        }

        await db.update(documents)
            .set(updateData)
            .where(and(eq(documents.id, input.documentId), eq(documents.shopId, input.shopId)));

        // STOCK MOVEMENT ENGINE: Trigger stock movements on status transition
        if (existing.status === "DRAFT" && (input.status === "ISSUED" || input.status === "PAID")) {
            if (existing.type === "INVOICE" || existing.type === "RECEIPT") {
                await applyDocumentStockMovements(existing.id, "OUTFLOW");
            } else if (existing.type === "GOODS_RECEIVED_NOTE") {
                await applyDocumentStockMovements(existing.id, "INFLOW");
            }
        }
        
        // Ensure LPOs and POs trigger INFLOW when marked as PAID (received/settled)
        if (existing.status !== "PAID" && input.status === "PAID") {
             if (existing.type === "LPO" || existing.type === "PO") {
                 await applyDocumentStockMovements(existing.id, "INFLOW");
             }
        }

        revalidatePath(`/workspaces/${input.shopSlug}/documents`);
        revalidatePath(`/workspaces/${input.shopSlug}/documents/${input.documentId}`);
        revalidatePath(`/workspaces/${input.shopSlug}/clients`);

        return { success: true };
    } catch (error) {
        console.error("Failed to update document status:", error);
        return { success: false, error: "Failed to update document status." };
    }
}

/**
 * Safely deletes a document and cleans up its line items.
 * Non-draft documents (ISSUED, OVERDUE, PAID) are audit-protected and blocked from deletion.
 */
export async function deleteDocument(documentId: string, shopId: string, shopSlug: string) {
    try {
        const existing = await db.query.documents.findFirst({
            where: and(eq(documents.id, documentId), eq(documents.shopId, shopId)),
        });

        if (!existing) {
            return { success: false, error: "Target document not found or access denied." };
        }

        // AUDIT DELETION GUARD: Only DRAFT documents can be hard deleted
        if (existing.status !== "DRAFT") {
            return {
                success: false,
                error: `Statutory Audit Protection: ${existing.type} (${existing.docNumber}) is in ${existing.status} status and cannot be deleted. Issue a Credit Note to adjust balance.`
            };
        }

        await db.delete(documents)
            .where(and(eq(documents.id, documentId), eq(documents.shopId, shopId)));

        revalidatePath(`/workspaces/${shopSlug}/documents`);
        return { success: true };
    } catch (error) {
        console.error("Failed to delete document:", error);
        return { success: false, error: "Failed to purge document record." };
    }
}

/**
 * Duplicates an existing document into a fresh DRAFT document.
 */
export async function duplicateDocument(documentId: string, shopId: string, shopSlug: string) {
    try {
        const existing = await db.query.documents.findFirst({
            where: and(eq(documents.id, documentId), eq(documents.shopId, shopId)),
            with: {
                items: true,
            },
        });

        if (!existing) {
            return { success: false, error: "Target document not found." };
        }

        const res = await createBillingDocument({
            shopId,
            shopSlug,
            clientId: existing.clientId || undefined,
            supplierId: existing.supplierId || undefined,
            type: existing.type,
            dueDate: existing.dueDate || undefined,
            items: existing.items.map((item) => ({
                description: item.description,
                quantity: parseFloat(item.quantity),
                unitPrice: parseFloat(item.unitPrice),
                taxType: item.taxType,
            })),
        });

        if (res.success) {
            revalidatePath(`/workspaces/${shopSlug}/documents`);
            return { success: true, documentId: res.documentId, serial: res.serial };
        } else {
            return { success: false, error: res.error };
        }
    } catch (error) {
        console.error("Failed to duplicate document:", error);
        return { success: false, error: "Failed to clone document entry." };
    }
}

/**
 * Converts a source document (e.g. Quote, Invoice, PO) into a new target document type.
 * Sets parentDocumentId for complete audit trail lineage.
 */
export async function convertDocumentAction(
    sourceDocId: string,
    targetType: DocumentType,
    shopId: string,
    shopSlug: string
) {
    try {
        const sourceDoc = await db.query.documents.findFirst({
            where: and(eq(documents.id, sourceDocId), eq(documents.shopId, shopId)),
            with: {
                items: true,
            },
        });

        if (!sourceDoc) {
            return { success: false, error: "Source document not found." };
        }

        const res = await createBillingDocument({
            shopId,
            shopSlug,
            clientId: sourceDoc.clientId || undefined,
            supplierId: sourceDoc.supplierId || undefined,
            type: targetType,
            sourceDocType: sourceDoc.type,
            parentDocumentId: sourceDoc.id,
            kraCuInvoiceNumber: sourceDoc.kraCuInvoiceNumber || undefined,
            requiresEtims: sourceDoc.requiresEtims,
            dueDate: sourceDoc.dueDate || undefined,
            items: sourceDoc.items.map((item) => ({
                description: item.description,
                quantity: parseFloat(item.quantity),
                unitPrice: parseFloat(item.unitPrice),
                taxType: item.taxType,
            })),
        });

        if (res.success) {
            if (targetType === "RECEIPT" && sourceDoc.type === "INVOICE") {
                await updateDocumentStatus({
                    documentId: sourceDoc.id,
                    shopId,
                    shopSlug,
                    status: "PAID",
                    paymentChannel: "RECEIPT_ISSUED",
                });
            }
            revalidatePath(`/workspaces/${shopSlug}/documents`);
            revalidatePath(`/workspaces/${shopSlug}/documents/${sourceDocId}`);
            return { success: true, newDocumentId: res.documentId, serial: res.serial };
        } else {
            return { success: false, error: res.error };
        }
    } catch (error) {
        console.error("Failed to convert document:", error);
        return { success: false, error: "Failed to execute document conversion." };
    }
}

interface RaiseCreditNoteInput {
    invoiceId: string;
    shopId: string;
    shopSlug: string;
    isPartial: boolean;
    selectedItemIds?: string[];
    creditNoteCuNumber?: string;
}

/**
 * Raises a full (100%) or partial Credit Note against an existing invoice.
 */
export async function raiseCreditNoteAction(input: RaiseCreditNoteInput) {
    try {
        const invoice = await db.query.documents.findFirst({
            where: and(eq(documents.id, input.invoiceId), eq(documents.shopId, input.shopId)),
            with: {
                items: true,
            },
        });

        if (!invoice) {
            return { success: false, error: "Target invoice not found." };
        }

        let targetItems = invoice.items;
        if (input.isPartial && input.selectedItemIds && input.selectedItemIds.length > 0) {
            targetItems = invoice.items.filter((item) => input.selectedItemIds?.includes(item.id));
        }

        if (targetItems.length === 0) {
            return { success: false, error: "No line items selected for partial credit note." };
        }

        const res = await createBillingDocument({
            shopId: input.shopId,
            shopSlug: input.shopSlug,
            clientId: invoice.clientId || undefined,
            supplierId: invoice.supplierId || undefined,
            type: "CREDIT_NOTE",
            parentDocumentId: invoice.id,
            kraCuInvoiceNumber: input.creditNoteCuNumber || undefined,
            requiresEtims: invoice.requiresEtims,
            items: targetItems.map((item) => ({
                description: `Credit Adjustment: ${item.description}`,
                quantity: parseFloat(item.quantity),
                unitPrice: parseFloat(item.unitPrice),
                taxType: item.taxType,
            })),
        });

        if (res.success) {
            revalidatePath(`/workspaces/${input.shopSlug}/documents`);
            revalidatePath(`/workspaces/${input.shopSlug}/documents/${input.invoiceId}`);
            return { success: true, creditNoteId: res.documentId, serial: res.serial };
        } else {
            return { success: false, error: res.error };
        }
    } catch (error) {
        console.error("Failed to raise credit note:", error);
        return { success: false, error: "Failed to issue credit note." };
    }
}

/**
 * Updates or sets the statutory KRA eTIMS / Control Unit (CU) Invoice Number.
 */
export async function updateDocumentKraCuNumberAction(
    documentId: string,
    shopId: string,
    shopSlug: string,
    kraCuInvoiceNumber: string
) {
    try {
        await db.update(documents)
            .set({ kraCuInvoiceNumber: kraCuInvoiceNumber.trim() })
            .where(and(eq(documents.id, documentId), eq(documents.shopId, shopId)));

        revalidatePath(`/workspaces/${shopSlug}/documents/${documentId}`);
        revalidatePath(`/workspaces/${shopSlug}/documents`);

        return { success: true };
    } catch (error) {
        console.error("Failed to update KRA eTIMS CU Number:", error);
        return { success: false, error: "Failed to update eTIMS CU Number." };
    }
}

/**
 * Updates or sets optional payment confirmation details (channel e.g. BANK/MPESA/CASH, and transaction reference #).
 */
export async function updateDocumentPaymentDetailsAction(
    documentId: string,
    shopId: string,
    shopSlug: string,
    paymentChannel?: string,
    paymentReference?: string
) {
    try {
        await db.update(documents)
            .set({
                paymentChannel: paymentChannel?.trim() || null,
                paymentReference: paymentReference?.trim() || null,
            })
            .where(and(eq(documents.id, documentId), eq(documents.shopId, shopId)));

        revalidatePath(`/workspaces/${shopSlug}/documents/${documentId}`);
        revalidatePath(`/workspaces/${shopSlug}/documents`);

        return { success: true };
    } catch (error) {
        console.error("Failed to update payment confirmation details:", error);
        return { success: false, error: "Failed to update payment details." };
    }
}