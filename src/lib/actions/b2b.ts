"use server";

import { db } from "@/db";
import { documents, clients, suppliers, expenses, shops, documentTokens } from "@/db/schema";
import { eq, and, ne, inArray, or } from "drizzle-orm";
import { verifyAndGetSession } from "./auth";
import { revalidatePath } from "next/cache";

export async function getB2BInboxDocuments(shopId: string) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized session context.", incomingBills: [], incomingOrders: [] };

    try {
        // 1. Resolve current shop taxPin
        const shop = await db.query.shops.findFirst({
            where: eq(shops.id, shopId),
        });

        if (!shop) {
            return { success: false, error: "Workspace context not found.", incomingBills: [], incomingOrders: [] };
        }

        const taxPin = shop.taxPin?.trim().toUpperCase();
        const userEmail = session.user.email.toLowerCase().trim();

        // 2. Fetch clients associated with this shop (matched via taxPin or owner email)
        const clientConditions = [];
        if (taxPin) {
            clientConditions.push(eq(clients.taxPin, taxPin));
        }
        clientConditions.push(eq(clients.email, userEmail));

        const matchedClients = await db.query.clients.findMany({
            where: or(...clientConditions),
        });
        const clientIds = matchedClients.map((c) => c.id);

        // 3. Fetch suppliers associated with this shop (matched via taxPin or owner email)
        const supplierConditions = [];
        if (taxPin) {
            supplierConditions.push(eq(suppliers.taxPin, taxPin));
        }
        supplierConditions.push(eq(suppliers.email, userEmail));

        const matchedSuppliers = await db.query.suppliers.findMany({
            where: or(...supplierConditions),
        });
        const supplierIds = matchedSuppliers.map((s) => s.id);

        // 4. Query incoming Invoices/Quotations/Delivery Notes (sent by other shops where we are the client)
        const incomingBills = clientIds.length > 0 
            ? await db.query.documents.findMany({
                where: and(
                    ne(documents.shopId, shopId),
                    inArray(documents.clientId, clientIds),
                    inArray(documents.type, ["INVOICE", "QUOTATION", "DELIVERY_NOTE"])
                ),
                with: {
                    shop: true,
                },
                orderBy: (docs, { desc }) => [desc(docs.createdAt)],
              })
            : [];

        // 5. Query incoming LPOs/POs (sent by other shops where we are the supplier)
        const incomingOrders = supplierIds.length > 0 
            ? await db.query.documents.findMany({
                where: and(
                    ne(documents.shopId, shopId),
                    inArray(documents.supplierId, supplierIds),
                    inArray(documents.type, ["LPO", "PO"])
                ),
                with: {
                    shop: true,
                },
                orderBy: (docs, { desc }) => [desc(docs.createdAt)],
              })
            : [];

        // 6. Fetch secure portal token for each document to let the user preview them
        const docIds = [...incomingBills.map((d) => d.id), ...incomingOrders.map((d) => d.id)];
        const tokensMap: Record<string, string> = {};

        if (docIds.length > 0) {
            const tokens = await db.query.documentTokens.findMany({
                where: inArray(documentTokens.documentId, docIds),
            });
            tokens.forEach((t) => {
                tokensMap[t.documentId] = t.token;
            });
        }

        // Attach tokens to documents
        const billsWithTokens = incomingBills.map((doc) => ({
            ...doc,
            portalToken: tokensMap[doc.id] || null,
        }));

        const ordersWithTokens = incomingOrders.map((doc) => ({
            ...doc,
            portalToken: tokensMap[doc.id] || null,
        }));

        return {
            success: true,
            incomingBills: billsWithTokens,
            incomingOrders: ordersWithTokens,
        };
    } catch (err: any) {
        return {
            success: false,
            error: err.message || "Failed to query B2B inbox.",
            incomingBills: [],
            incomingOrders: [],
        };
    }
}

export async function importB2BInvoiceAsExpenseAction(documentId: string, targetShopId: string, shopSlug: string) {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized session context." };

    try {
        // 1. Fetch document with sender shop details
        const doc = await db.query.documents.findFirst({
            where: eq(documents.id, documentId),
            with: {
                shop: true,
            },
        });

        if (!doc) {
            return { success: false, error: "Document not found in database." };
        }

        // Check if this document has already been logged as an expense in this shop
        const existingExpense = await db.query.expenses.findFirst({
            where: and(
                eq(expenses.shopId, targetShopId),
                eq(expenses.paymentReference, doc.docNumber)
            ),
        });

        if (existingExpense) {
            return { success: false, error: `This document (${doc.docNumber}) has already been imported as expense #${existingExpense.id.slice(0, 8)}.` };
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mannabooks.co.ke";
        
        // Find public token if it exists
        const tokenRec = await db.query.documentTokens.findFirst({
            where: eq(documentTokens.documentId, documentId),
        });
        const portalUrl = tokenRec ? `${appUrl}/portal/invoice/${tokenRec.token}` : null;

        // 2. Insert into expenses table
        await db.insert(expenses).values({
            shopId: targetShopId,
            description: `B2B Import [${doc.type}]: ${doc.docNumber} from ${doc.shop.name}`,
            amount: doc.grandTotal,
            currency: doc.currency || doc.shop.currency,
            category: "OTHER",
            expenseDate: doc.issueDate,
            paymentChannel: doc.paymentChannel || "BANK",
            paymentReference: doc.docNumber,
            receiptUrl: portalUrl,
        });

        revalidatePath(`/workspaces/${shopSlug}/expenses`);
        revalidatePath(`/workspaces/${shopSlug}/inbox`);

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to import document as expense." };
    }
}
