"use server";

import { db } from "@/db";
import { documents, documentItems, documentTokens, documentPayments, documentNotes, shops, clients, journalEntries, ledgerSnapshots, shopTerms } from "@/db/schema";
import { calculateLineItem, calculateDocumentTotals, isFiscalDocType } from "@/lib/utils";
import { eq, and, gte, lte, inArray, desc, asc } from "drizzle-orm";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { verifyAndGetSession } from "./auth";
import { enforcePermission } from "./rbac";

import { applyDocumentStockMovements } from "@/lib/actions/stock";
import { getFiscalYearRange, getFyDocSuffix } from "@/lib/fiscalYear";
import { createJournalEntry } from "./gl";

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
    termsAndConditions?: string;
    currency?: string;
    exchangeRate?: number;
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
        case "CREDIT_NOTE":
            return "PAID";
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
        await enforcePermission(input.shopId, "canCreateDocuments");

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

            // 2. Resolve or generate standard human-readable document sequence (e.g., CORBA-INV-FY26-0001)
            const fiscalYearRange = getFiscalYearRange(shopProfile.fiscalYearStartMonth || 1);
            const fySuffix = getFyDocSuffix(shopProfile.fiscalYearStartMonth || 1);

            const latestDoc = await tx.query.documents.findFirst({
                where: and(
                    eq(documents.shopId, input.shopId),
                    eq(documents.type, input.type),
                    gte(documents.issueDate, fiscalYearRange.start),
                    lte(documents.issueDate, fiscalYearRange.end)
                ),
                orderBy: [desc(documents.createdAt)],
            });

            let nextSequence = 1;
            if (latestDoc) {
                const parts = latestDoc.docNumber.split("-");
                const lastNum = parseInt(parts[parts.length - 1], 10);
                if (!isNaN(lastNum)) {
                    nextSequence = lastNum + 1;
                }
            }

            const merchantPrefix = (shopProfile.code || shopProfile.shortName || shopProfile.name.slice(0, 5))
                .replace(/[^a-zA-Z0-9]/g, "")
                .toUpperCase()
                .slice(0, 5);

            const docTypeMap: Record<DocumentType, string> = {
                QUOTATION: "QT",
                INVOICE: "INV",
                RECEIPT: "RCT",
                LPO: "LPO",
                PO: "PO",
                DELIVERY_NOTE: "DN",
                CREDIT_NOTE: "CN",
                DEBIT_NOTE: "DN",
                GOODS_RECEIVED_NOTE: "GRN",
                PAYMENT_VOUCHER: "PV",
                PAYROLL_VOUCHER: "PAY",
            };
            const typeCode = docTypeMap[input.type] || "DOC";
            const paddedSeq = String(nextSequence).padStart(4, "0");
            const formattedSerial = `${merchantPrefix}-${typeCode}-${fySuffix}-${paddedSeq}`;

            // 3. Fallback Client resolution for Walk-In POS operations
            let finalClientId = input.clientId;
            if (!finalClientId && !input.supplierId) {
                const existingWalkIn = await tx.query.clients.findFirst({
                    where: and(
                        eq(clients.shopId, input.shopId),
                        eq(clients.clientType, "WALK_IN")
                    )
                });
                if (existingWalkIn) {
                    finalClientId = existingWalkIn.id;
                } else {
                    const [newClient] = await tx.insert(clients).values({
                        shopId: input.shopId,
                        name: "Walk-In Customer",
                        email: input.customerEmail || `walkin_${Date.now()}@${input.shopSlug}.mannabooks.local`,
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

            // 5. Resolve Commercial Terms & Conditions
            let finalTerms = input.termsAndConditions;
            const isSupplierDoc = Boolean(input.supplierId || ["LPO", "PO", "GOODS_RECEIVED_NOTE", "PAYMENT_VOUCHER"].includes(input.type));
            if ((finalTerms === undefined || finalTerms === null) && !isSupplierDoc) {
                const isCatalogQuote = input.type === "QUOTATION" && (input.notes?.includes("Public Digital Product Catalog") || input.sourceDocType === "QUOTATION");
                const defaultTerms = await tx.query.shopTerms.findMany({
                    where: and(
                        eq(shopTerms.shopId, input.shopId),
                        isCatalogQuote ? eq(shopTerms.isDefaultCatalog, true) : eq(shopTerms.isDefaultInvoice, true)
                    ),
                    orderBy: [asc(shopTerms.displayOrder), asc(shopTerms.createdAt)],
                });
                if (defaultTerms.length > 0) {
                    finalTerms = JSON.stringify(defaultTerms.map(t => `${t.title}: ${t.content}`));
                }
            }

            const docCurrency = input.currency || shopProfile.currency || "KES";
            const rateVal = input.exchangeRate && input.exchangeRate > 0 ? input.exchangeRate : 1.0;
            const baseCurr = shopProfile.currency || "KES";
            const baseTotalVal = (calculatedTotals.grandTotal * rateVal).toFixed(2);

            // 6. Insert master header registry (The Document)
            const [newDoc] = await tx.insert(documents).values({
                shopId: input.shopId,
                clientId: finalClientId || null,
                supplierId: input.supplierId || null,
                type: input.type,
                docNumber: formattedSerial,
                status: determineDefaultStatus(input.type, input.sourceDocType),
                kraCuInvoiceNumber: input.kraCuInvoiceNumber || null,
                parentDocumentId: input.parentDocumentId || null,
                requiresEtims: isFiscalDocType(input.type) ? (input.requiresEtims || false) : false,
                notes: input.notes || null,
                termsAndConditions: finalTerms || null,
                currency: docCurrency,
                exchangeRate: rateVal.toFixed(4),
                baseCurrency: baseCurr,
                baseGrandTotal: baseTotalVal,
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

            try {
                revalidatePath(`/workspaces/${input.shopSlug}/documents`);
                if (input.clientId) {
                    revalidatePath(`/workspaces/${input.shopSlug}/clients/${input.clientId}`);
                }
            } catch (e) {
                console.warn("revalidatePath skipped outside Next.js environment context.");
            }

            const docEntryDate = new Date(newDoc.issueDate);

            // AUTO-JOURNAL: Standalone Receipt (no parent invoice) → DR Cash & Bank / CR Sales Revenue
            if (input.type === "RECEIPT" && !input.parentDocumentId) {
                const amount = parseFloat(calculatedTotals.grandTotal.toString());
                if (amount > 0) {
                    await createJournalEntry({
                        shopId: input.shopId,
                        entryDate: docEntryDate,
                        description: `Receipt ${formattedSerial} — Direct POS sale`,
                        debitAccountCode: "1200",  // Cash & Bank
                        creditAccountCode: "4100", // Sales Revenue
                        amount,
                        sourceType: "document",
                        sourceId: newDoc.id,
                    });
                }
            }

            // AUTO-JOURNAL: Credit Note → DR Sales Revenue / CR AR (if reducing invoice) or CR Cash & Bank (if direct refund)
            if (input.type === "CREDIT_NOTE") {
                const amount = parseFloat(calculatedTotals.grandTotal.toString());
                if (amount > 0) {
                    const creditAccount = input.parentDocumentId ? "1100" : "1200"; // AR if linked, else Cash
                    await createJournalEntry({
                        shopId: input.shopId,
                        entryDate: docEntryDate,
                        description: `Credit Note ${formattedSerial} — ${input.parentDocumentId ? "Credited against Invoice" : "Sales Refund"}`,
                        debitAccountCode: "4100",  // Sales Revenue (debit reduces revenue)
                        creditAccountCode: creditAccount,
                        amount,
                        sourceType: "document",
                        sourceId: newDoc.id,
                    });
                }
            }

            // AUTO-JOURNAL: Debit Note → DR Accounts Receivable / CR Sales Revenue
            if (input.type === "DEBIT_NOTE") {
                const amount = parseFloat(calculatedTotals.grandTotal.toString());
                if (amount > 0) {
                    await createJournalEntry({
                        shopId: input.shopId,
                        entryDate: docEntryDate,
                        description: `Debit Note ${formattedSerial} — Additional billing`,
                        debitAccountCode: "1100",  // Accounts Receivable
                        creditAccountCode: "4100", // Sales Revenue
                        amount,
                        sourceType: "document",
                        sourceId: newDoc.id,
                    });
                }
            }

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
        
        // Ensure LPOs, POs, and GRNs trigger INFLOW when marked as RECEIVED or PAID (goods delivered)
        const isReceivingTransition = (input.status === "RECEIVED" || input.status === "PAID") && 
                                      existing.status !== "RECEIVED" && 
                                      existing.status !== "PAID";
        if (isReceivingTransition) {
             if (existing.type === "LPO" || existing.type === "PO" || existing.type === "GOODS_RECEIVED_NOTE") {
                 await applyDocumentStockMovements(existing.id, "INFLOW");
             }
        }

        revalidatePath(`/workspaces/${input.shopSlug}/documents`);
        revalidatePath(`/workspaces/${input.shopSlug}/documents/${input.documentId}`);
        revalidatePath(`/workspaces/${input.shopSlug}/clients`);

        // AUTO-JOURNAL: Post GL entries when an invoice is paid
        if (existing.status !== "PAID" && input.status === "PAID") {
            const amount = parseFloat(existing.grandTotal || "0");
            if (amount > 0) {
                if (existing.type === "INVOICE") {
                    // Invoice paid: DR Cash & Bank / CR AR (clears the receivable)
                    await createJournalEntry({
                        shopId: input.shopId,
                        entryDate: new Date(),
                        description: `Invoice ${existing.docNumber} — Settled`,
                        debitAccountCode: "1200",  // Cash & Bank
                        creditAccountCode: "1100", // Accounts Receivable
                        amount,
                        sourceType: "document",
                        sourceId: existing.id,
                    });
                } else if (existing.type === "LPO" || existing.type === "PO" || existing.type === "PAYMENT_VOUCHER") {
                    // Supplier payment: DR Accounts Payable / CR Cash & Bank
                    await createJournalEntry({
                        shopId: input.shopId,
                        entryDate: new Date(),
                        description: `${existing.type} ${existing.docNumber} — Paid to supplier`,
                        debitAccountCode: "2100", // Accounts Payable
                        creditAccountCode: "1200", // Cash & Bank
                        amount,
                        sourceType: "document",
                        sourceId: existing.id,
                    });
                }
            }
        }

        // AUTO-JOURNAL: When invoice is first issued (creates the receivable)
        if (existing.status === "DRAFT" && (input.status === "ISSUED" || input.status === "PAID")) {
            if (existing.type === "INVOICE") {
                const amount = parseFloat(existing.grandTotal || "0");
                if (amount > 0) {
                    await createJournalEntry({
                        shopId: input.shopId,
                        entryDate: new Date(),
                        description: `Invoice ${existing.docNumber} — Issued`,
                        debitAccountCode: "1100",  // Accounts Receivable
                        creditAccountCode: "4100", // Sales Revenue
                        amount,
                        sourceType: "document",
                        sourceId: existing.id,
                    });
                }
            }
        }

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
            termsAndConditions: sourceDoc.termsAndConditions || undefined,
            items: sourceDoc.items.map((item) => ({
                productId: item.productId || undefined,
                description: item.description,
                quantity: parseFloat(item.quantity),
                unitPrice: parseFloat(item.unitPrice),
                taxType: item.taxType,
                notes: item.notes || undefined,
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
            } else if (targetType === "INVOICE" && sourceDoc.type === "QUOTATION") {
                await updateDocumentStatus({
                    documentId: sourceDoc.id,
                    shopId,
                    shopSlug,
                    status: "ISSUED",
                });
            } else if (targetType === "GOODS_RECEIVED_NOTE" && (sourceDoc.type === "PO" || sourceDoc.type === "LPO")) {
                await updateDocumentStatus({
                    documentId: sourceDoc.id,
                    shopId,
                    shopSlug,
                    status: "RECEIVED",
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

        if (invoice.type !== "INVOICE") {
            return { success: false, error: "A credit note can only be raised for an invoice." };
        }

        if (invoice.status !== "PAID") {
            return { success: false, error: "A credit note cannot be raised for an invoice that is not paid." };
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

interface UpdateDocumentItemInput {
    productId?: string;
    description: string;
    notes?: string;
    quantity: number;
    unitPrice: number;
    taxType: "V_16" | "V_0" | "EXEMPT";
}

interface UpdateDocumentInput {
    documentId: string;
    shopId: string;
    shopSlug: string;
    clientId?: string;
    supplierId?: string;
    type: DocumentType;
    dueDate?: Date;
    kraCuInvoiceNumber?: string;
    requiresEtims?: boolean;
    notes?: string;
    termsAndConditions?: string;
    currency?: string;
    exchangeRate?: number;
    items: UpdateDocumentItemInput[];
}

/**
 * Updates an existing draft document and overwrites its line items.
 */
export async function updateBillingDocument(input: UpdateDocumentInput) {
    try {
        const sessionRecord = await verifyAndGetSession();
        if (!sessionRecord) return { success: false, error: "Authentication expired." };

        // 1. Resolve compliance conditions and context
        const doc = await db.query.documents.findFirst({
            where: and(eq(documents.id, input.documentId), eq(documents.shopId, input.shopId)),
        });

        if (!doc) {
            return { success: false, error: "Document not found or access denied." };
        }

        if (doc.status !== "DRAFT") {
            return { success: false, error: "Statutory Audit Protection: Only DRAFT documents can be modified." };
        }

        const shopProfile = await db.query.shops.findFirst({
            where: eq(shops.id, input.shopId),
        });

        if (!shopProfile) {
            return { success: false, error: "Merchant identity context missing." };
        }

        const isVatActive = shopProfile.isVatRegistered;

        // 2. Perform database edits in a secure transaction
        await db.transaction(async (tx) => {
            // Process totals
            const calculatedTotals = calculateDocumentTotals({
                items: input.items,
                isShopVatRegistered: isVatActive,
            });

            const docCurrency = input.currency || shopProfile.currency || "KES";
            const rateVal = input.exchangeRate && input.exchangeRate > 0 ? input.exchangeRate : 1.0;
            const baseCurr = shopProfile.currency || "KES";
            const baseTotalVal = (calculatedTotals.grandTotal * rateVal).toFixed(2);

            // Update master header
            await tx.update(documents)
                .set({
                    clientId: input.clientId || null,
                    supplierId: input.supplierId || null,
                    type: input.type,
                    dueDate: input.dueDate || null,
                    kraCuInvoiceNumber: input.kraCuInvoiceNumber || null,
                    requiresEtims: isFiscalDocType(input.type) ? (input.requiresEtims || false) : false,
                    notes: input.notes || null,
                    termsAndConditions: input.termsAndConditions !== undefined ? (input.termsAndConditions || null) : doc.termsAndConditions,
                    currency: docCurrency,
                    exchangeRate: rateVal.toFixed(4),
                    baseCurrency: baseCurr,
                    baseGrandTotal: baseTotalVal,
                    subTotal: calculatedTotals.subTotal.toString(),
                    taxAmount: calculatedTotals.taxAmount.toString(),
                    grandTotal: calculatedTotals.grandTotal.toString(),
                })
                .where(eq(documents.id, input.documentId));

            // Purge old line items
            await tx.delete(documentItems).where(eq(documentItems.documentId, input.documentId));

            // Write new line items
            const compiledRowsPayload = input.items.map((rowItem) => {
                const lineMath = calculateLineItem({
                    quantity: rowItem.quantity,
                    unitPrice: rowItem.unitPrice,
                    taxType: rowItem.taxType,
                    isShopVatRegistered: isVatActive,
                });

                return {
                    documentId: doc.id,
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
        });

        revalidatePath(`/workspaces/${input.shopSlug}/documents`);
        revalidatePath(`/workspaces/${input.shopSlug}/documents/${input.documentId}`);

        return { success: true };
    } catch (error) {
        console.error("Critical failure during document update transaction:", error);
        return { success: false, error: "Failed to persist document updates." };
    }
}

/**
 * Maintenance Action: Deletes and rebuilds all document journal entries chronologically for a shop.
 */
export async function repairLedgerAction(
    shopId: string,
    shopSlug: string,
    skipAuth: boolean = false
): Promise<{ success: boolean; error?: string }> {
    try {
        if (!skipAuth) {
            await enforcePermission(shopId, "manage_expenses");
        }
        
        return await db.transaction(async (tx) => {
            // 0. Automatically migrate all existing Credit Notes to PAID status in the database
            await tx.update(documents)
                .set({ status: "PAID" })
                .where(
                    and(
                        eq(documents.shopId, shopId),
                        eq(documents.type, "CREDIT_NOTE")
                    )
                );

            // 0.05 Re-enable GL posting for this shop
            await tx.update(shops)
                .set({ isGlEnabled: true })
                .where(eq(shops.id, shopId));

            // 0.1 Automatically migrate any parent invoices of existing Credit Notes to PAID status
            // This corrects legacy test data where credit notes were raised against ISSUED/unpaid invoices.
            const creditNotes = await tx.query.documents.findMany({
                where: and(
                    eq(documents.shopId, shopId),
                    eq(documents.type, "CREDIT_NOTE")
                ),
            });
            const parentDocIds = creditNotes
                .map((cn) => cn.parentDocumentId)
                .filter((id): id is string => !!id);

            if (parentDocIds.length > 0) {
                await tx.update(documents)
                    .set({ status: "PAID" })
                    .where(
                        and(
                            eq(documents.shopId, shopId),
                            inArray(documents.id, parentDocIds)
                        )
                    );
            }

            // 0.2 Backup all current journal entries of the shop to ledgerSnapshots before reset
            const existingEntries = await tx.query.journalEntries.findMany({
                where: eq(journalEntries.shopId, shopId),
            });
            if (existingEntries.length > 0) {
                await tx.insert(ledgerSnapshots).values({
                    shopId,
                    entryCount: existingEntries.length,
                    notes: `Automatic pre-rebuild backup of General Ledger.`,
                    data: existingEntries,
                });
            }

            // 1. Delete all existing document-related journal entries for this shop
            await tx.delete(journalEntries).where(
                and(
                    eq(journalEntries.shopId, shopId),
                    eq(journalEntries.sourceType, "document")
                )
            );

            // 2. Fetch all documents for this shop (including newly migrated credit notes)
            const allDocs = await tx.query.documents.findMany({
                where: eq(documents.shopId, shopId),
            });

            // 3. Re-create journal entries chronologically
            for (const doc of allDocs) {
                const amount = parseFloat(doc.grandTotal || "0");
                if (amount <= 0) continue;

                const entryDate = new Date(doc.issueDate);

                // INVOICE
                if (doc.type === "INVOICE") {
                    if (doc.status === "ISSUED" || doc.status === "PAID" || doc.status === "CANCELLED") {
                        // AR / Sales Revenue
                        await createJournalEntry({
                            shopId,
                            entryDate,
                            description: `Invoice ${doc.docNumber} — Issued (Repaired)`,
                            debitAccountCode: "1100",  // Accounts Receivable
                            creditAccountCode: "4100", // Sales Revenue
                            amount,
                            sourceType: "document",
                            sourceId: doc.id,
                        });
                    }
                    if (doc.status === "PAID") {
                        // Cash & Bank / AR
                        await createJournalEntry({
                            shopId,
                            entryDate,
                            description: `Invoice ${doc.docNumber} — Settled (Repaired)`,
                            debitAccountCode: "1200",  // Cash & Bank
                            creditAccountCode: "1100", // Accounts Receivable
                            amount,
                            sourceType: "document",
                            sourceId: doc.id,
                        });
                    }
                    if (doc.status === "CANCELLED") {
                        // Reversing entry: DR Sales / CR AR
                        await createJournalEntry({
                            shopId,
                            entryDate,
                            description: `Invoice ${doc.docNumber} — Cancelled/Reverted (Repaired)`,
                            debitAccountCode: "4100",  // Sales Revenue
                            creditAccountCode: "1100", // Accounts Receivable
                            amount,
                            sourceType: "document",
                            sourceId: doc.id,
                        });
                    }
                }

                // RECEIPT (standalone only)
                if (doc.type === "RECEIPT" && !doc.parentDocumentId) {
                    await createJournalEntry({
                        shopId,
                        entryDate,
                        description: `Receipt ${doc.docNumber} — Direct POS sale (Repaired)`,
                        debitAccountCode: "1200",  // Cash & Bank
                        creditAccountCode: "4100", // Sales Revenue
                        amount,
                        sourceType: "document",
                        sourceId: doc.id,
                    });
                }

                // CREDIT NOTE
                if (doc.type === "CREDIT_NOTE") {
                    const creditAccount = doc.parentDocumentId ? "1100" : "1200"; // AR if linked to invoice, else Cash
                    await createJournalEntry({
                        shopId,
                        entryDate,
                        description: `Credit Note ${doc.docNumber} — ${doc.parentDocumentId ? "Credited against invoice" : "Sales refund"} (Repaired)`,
                        debitAccountCode: "4100",  // Sales Revenue (debit reduces revenue)
                        creditAccountCode: creditAccount,
                        amount,
                        sourceType: "document",
                        sourceId: doc.id,
                    });
                }

                // DEBIT NOTE
                if (doc.type === "DEBIT_NOTE") {
                    await createJournalEntry({
                        shopId,
                        entryDate,
                        description: `Debit Note ${doc.docNumber} — Additional billing (Repaired)`,
                        debitAccountCode: "1100",  // Accounts Receivable
                        creditAccountCode: "4100", // Sales Revenue
                        amount,
                        sourceType: "document",
                        sourceId: doc.id,
                    });
                }

                // LPO / PO / PAYMENT VOUCHER
                if ((doc.type === "LPO" || doc.type === "PO" || doc.type === "PAYMENT_VOUCHER") && doc.status === "PAID") {
                    await createJournalEntry({
                        shopId,
                        entryDate,
                        description: `${doc.type} ${doc.docNumber} — Paid to supplier (Repaired)`,
                        debitAccountCode: "2100",  // Accounts Payable
                        creditAccountCode: "1200", // Cash & Bank
                        amount,
                        sourceType: "document",
                        sourceId: doc.id,
                    });
                }

                // PAYROLL VOUCHER — DR Salaries Expense / CR Cash & Bank
                if (doc.type === "PAYROLL_VOUCHER" && doc.status === "PAID") {
                    await createJournalEntry({
                        shopId,
                        entryDate,
                        description: `Payroll Voucher ${doc.docNumber} — Net wages disbursed (Repaired)`,
                        debitAccountCode: "6100",  // Salaries & Wages Expense
                        creditAccountCode: "1200", // Cash & Bank
                        amount,
                        sourceType: "payroll",
                        sourceId: doc.id,
                    });
                }
            }

            if (!skipAuth) {
                revalidatePath(`/workspaces/${shopSlug}/finance`);
                revalidatePath(`/workspaces/${shopSlug}/documents`);
            }
            return { success: true };
        });
    } catch (error: any) {
        console.error("Ledger repair failed:", error);
        return { success: false, error: error.message || "Failed to repair ledger." };
    }
}

/**
 * Action: Cancel a Quotation document.
 */
export async function cancelQuotationAction(shopId: string, docId: string, shopSlug: string) {
    try {
        await enforcePermission(shopId, "manage_documents");
        await db.update(documents)
            .set({ status: "CANCELLED" })
            .where(
                and(
                    eq(documents.id, docId),
                    eq(documents.shopId, shopId),
                    eq(documents.type, "QUOTATION")
                )
            );
        
        revalidatePath(`/workspaces/${shopSlug}/documents`);
        revalidatePath(`/workspaces/${shopSlug}/documents/${docId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Quotation cancellation failed:", error);
        return { success: false, error: error.message || "Failed to cancel quotation." };
    }
}

/**
 * Action: Cancel an unpaid (issued or overdue) invoice, posting a reversing entry.
 */
export async function cancelInvoiceAction(shopId: string, docId: string, shopSlug: string) {
    try {
        await enforcePermission(shopId, "manage_documents");
        
        const res = await db.transaction(async (tx) => {
            const invoice = await tx.query.documents.findFirst({
                where: and(
                    eq(documents.id, docId),
                    eq(documents.shopId, shopId),
                    eq(documents.type, "INVOICE")
                )
            });

            if (!invoice) {
                return { success: false, error: "Invoice not found." };
            }

            if (invoice.status !== "ISSUED" && invoice.status !== "OVERDUE") {
                return { success: false, error: "Only unpaid (issued or overdue) invoices can be directly cancelled. Paid invoices must be refunded via a Credit Note." };
            }

            // Update status to CANCELLED
            await tx.update(documents)
                .set({ status: "CANCELLED" })
                .where(eq(documents.id, docId));

            // Write reversing GL entries: DR Revenue (4100) / CR AR (1100)
            const amount = parseFloat(invoice.grandTotal || "0");
            if (amount > 0) {
                const entryDate = new Date();
                await createJournalEntry({
                    shopId,
                    entryDate,
                    description: `Invoice ${invoice.docNumber} — Cancelled/Reverted`,
                    debitAccountCode: "4100",  // Sales Revenue (debit reduces revenue)
                    creditAccountCode: "1100", // Accounts Receivable (credit reduces A/R debt)
                    amount,
                    sourceType: "document",
                    sourceId: invoice.id,
                });
            }

            return { success: true };
        });

        if (res.success) {
            revalidatePath(`/workspaces/${shopSlug}/documents`);
            revalidatePath(`/workspaces/${shopSlug}/documents/${docId}`);
        }
        return res;
    } catch (error: any) {
        console.error("Invoice cancellation failed:", error);
        return { success: false, error: error.message || "Failed to cancel invoice." };
    }
}

/**
 * Action: Fetch all saved pre-rebuild backups of the General Ledger for a shop.
 */
export async function getLedgerSnapshotsAction(shopId: string) {
    try {
        await enforcePermission(shopId, "manage_expenses");
        const snapshots = await db.query.ledgerSnapshots.findMany({
            where: eq(ledgerSnapshots.shopId, shopId),
            orderBy: [desc(ledgerSnapshots.createdAt)],
        });
        return { success: true, data: snapshots };
    } catch (error: any) {
        console.error("Failed to fetch ledger snapshots:", error);
        return { success: false, error: error.message || "Failed to retrieve ledger backups." };
    }
}

/**
 * Action: Pauses live GL posting for a shop and purges all document journal entries.
 * Backs them up in ledgerSnapshots before purging.
 */
export async function purgeLedgerAction(
    shopId: string,
    shopSlug: string,
    skipAuth: boolean = false
): Promise<{ success: boolean; error?: string }> {
    try {
        if (!skipAuth) {
            await enforcePermission(shopId, "manage_settings");
        }
        
        return await db.transaction(async (tx) => {
            // 1. Pause GL posting by updating isGlEnabled flag
            await tx.update(shops)
                .set({ isGlEnabled: false })
                .where(eq(shops.id, shopId));

            // 2. Query all existing document journal entries for the shop
            const existingEntries = await tx.query.journalEntries.findMany({
                where: eq(journalEntries.shopId, shopId),
            });

            // 3. Write a serialized snapshot backup
            if (existingEntries.length > 0) {
                await tx.insert(ledgerSnapshots).values({
                    shopId,
                    entryCount: existingEntries.length,
                    notes: `Pre-purge GL Reset Backup. GL paused for maintenance.`,
                    data: existingEntries,
                });
            }

            // 4. Delete all existing document-related journal entries for this shop
            await tx.delete(journalEntries).where(
                and(
                    eq(journalEntries.shopId, shopId),
                    eq(journalEntries.sourceType, "document")
                )
            );

            if (!skipAuth) {
                revalidatePath(`/workspaces/${shopSlug}/finance`);
                revalidatePath(`/workspaces/${shopSlug}/documents`);
                revalidatePath(`/workspaces/${shopSlug}/settings/diagnostics`);
            }
            return { success: true };
        });
    } catch (error: any) {
        console.error("Ledger purge failed:", error);
        return { success: false, error: error.message || "Failed to purge ledger." };
    }
}

/**
 * Action: Record an installment or partial payment against a document (Invoice).
 * Automatically updates the document status to PARTIALLY_PAID or PAID based on cumulative payments.
 */
export async function recordDocumentPaymentAction(input: {
    documentId: string;
    shopId: string;
    shopSlug: string;
    amount: number;
    paymentChannel: string;
    paymentReference?: string;
    paymentDate?: Date;
    notes?: string;
}): Promise<{ success: boolean; error?: string; status?: string; remainingBalance?: number }> {
    try {
        const session = await verifyAndGetSession();
        if (!session) {
            return { success: false, error: "Unauthorized. Please log in." };
        }
        await enforcePermission(input.shopId, "manage_documents");

        if (input.amount <= 0 || isNaN(input.amount)) {
            return { success: false, error: "Payment amount must be greater than zero." };
        }

        const doc = await db.query.documents.findFirst({
            where: and(eq(documents.id, input.documentId), eq(documents.shopId, input.shopId)),
            with: { payments: true },
        });

        if (!doc) {
            return { success: false, error: "Target document could not be found." };
        }

        const grandTotal = parseFloat(doc.grandTotal || "0");
        const priorPaymentsSum = (doc.payments || []).reduce((acc, p) => acc + parseFloat(p.amount || "0"), 0);
        const newTotalPaid = priorPaymentsSum + input.amount;
        const remainingBalance = Math.max(0, grandTotal - newTotalPaid);

        let nextStatus: "PAID" | "PARTIALLY_PAID" | "ISSUED" = doc.status as any;
        if (newTotalPaid >= grandTotal - 0.01) {
            nextStatus = "PAID";
        } else if (newTotalPaid > 0) {
            nextStatus = "PARTIALLY_PAID";
        }

        // Insert payment entry & update document status atomically
        await db.transaction(async (tx) => {
            await tx.insert(documentPayments).values({
                documentId: input.documentId,
                shopId: input.shopId,
                amount: input.amount.toFixed(2),
                paymentDate: input.paymentDate || new Date(),
                paymentChannel: input.paymentChannel,
                paymentReference: input.paymentReference?.trim() || null,
                notes: input.notes?.trim() || null,
                recordedByUserId: session.userId,
            });

            await tx.update(documents)
                .set({
                    status: nextStatus,
                    paymentChannel: input.paymentChannel,
                    paymentReference: input.paymentReference?.trim() || doc.paymentReference,
                })
                .where(eq(documents.id, input.documentId));
        });

        revalidatePath(`/workspaces/${input.shopSlug}/documents/${input.documentId}`);
        revalidatePath(`/workspaces/${input.shopSlug}/documents`);
        revalidatePath(`/workspaces/${input.shopSlug}`);

        return { success: true, status: nextStatus, remainingBalance };
    } catch (error: any) {
        console.error("Failed to record document payment:", error);
        return { success: false, error: error.message || "Failed to record payment." };
    }
}

/**
 * Action: Delete a recorded document payment installment and recalculate document status.
 */
export async function deleteDocumentPaymentAction(input: {
    paymentId: string;
    documentId: string;
    shopId: string;
    shopSlug: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        await enforcePermission(input.shopId, "manage_documents");

        await db.delete(documentPayments).where(
            and(eq(documentPayments.id, input.paymentId), eq(documentPayments.documentId, input.documentId))
        );

        // Recalculate status
        const doc = await db.query.documents.findFirst({
            where: and(eq(documents.id, input.documentId), eq(documents.shopId, input.shopId)),
            with: { payments: true },
        });

        if (doc) {
            const grandTotal = parseFloat(doc.grandTotal || "0");
            const paymentsSum = (doc.payments || []).reduce((acc, p) => acc + parseFloat(p.amount || "0"), 0);

            let nextStatus: "PAID" | "PARTIALLY_PAID" | "ISSUED" | "OVERDUE" = "ISSUED";
            if (paymentsSum >= grandTotal - 0.01) {
                nextStatus = "PAID";
            } else if (paymentsSum > 0) {
                nextStatus = "PARTIALLY_PAID";
            } else if (doc.dueDate && new Date(doc.dueDate) < new Date()) {
                nextStatus = "OVERDUE";
            }

            await db.update(documents)
                .set({ status: nextStatus })
                .where(eq(documents.id, input.documentId));
        }

        revalidatePath(`/workspaces/${input.shopSlug}/documents/${input.documentId}`);
        revalidatePath(`/workspaces/${input.shopSlug}/documents`);
        revalidatePath(`/workspaces/${input.shopSlug}`);

        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete document payment:", error);
        return { success: false, error: error.message || "Failed to delete payment." };
    }
}

/**
 * Action: Add an internal note to a document (Operator / Internal Audit Trail).
 */
export async function addDocumentNoteAction(input: {
    documentId: string;
    shopId: string;
    shopSlug: string;
    note: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await verifyAndGetSession();
        if (!session) {
            return { success: false, error: "Unauthorized. Please log in." };
        }
        if (!input.note || input.note.trim() === "") {
            return { success: false, error: "Note cannot be empty." };
        }

        await db.insert(documentNotes).values({
            documentId: input.documentId,
            shopId: input.shopId,
            userId: session.userId,
            note: input.note.trim(),
        });

        revalidatePath(`/workspaces/${input.shopSlug}/documents/${input.documentId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to add document note:", error);
        return { success: false, error: error.message || "Failed to add internal note." };
    }
}

/**
 * Action: Delete an internal note from a document.
 */
export async function deleteDocumentNoteAction(input: {
    noteId: string;
    documentId: string;
    shopId: string;
    shopSlug: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        await verifyAndGetSession();
        await db.delete(documentNotes).where(
            and(eq(documentNotes.id, input.noteId), eq(documentNotes.documentId, input.documentId))
        );

        revalidatePath(`/workspaces/${input.shopSlug}/documents/${input.documentId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete document note:", error);
        return { success: false, error: error.message || "Failed to delete note." };
    }
}