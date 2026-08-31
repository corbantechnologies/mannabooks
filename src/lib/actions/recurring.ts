"use server";

import { db } from "@/db";
import { documents, documentItems, shops } from "@/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { verifyAndGetSession } from "./auth";
import { enforcePermission } from "./rbac";
import { createBillingDocument } from "./documents";

export interface RecurringInvoiceItem {
  id: string;
  docNumber: string;
  clientName: string;
  clientEmail: string;
  clientId: string | null;
  currency: string;
  grandTotal: string;
  isRecurring: boolean;
  recurringInterval: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | null;
  nextRecurringDate: Date | null;
  createdAt: Date;
}

/**
 * Fetch all recurring invoices for a workspace.
 */
export async function getRecurringInvoices(shopId: string): Promise<RecurringInvoiceItem[]> {
  try {
    const recDocs = await db.query.documents.findMany({
      where: and(
        eq(documents.shopId, shopId),
        eq(documents.type, "INVOICE"),
        eq(documents.isRecurring, true)
      ),
      with: {
        client: true,
      },
      orderBy: [asc(documents.nextRecurringDate)],
    });

    return recDocs.map((d) => ({
      id: d.id,
      docNumber: d.docNumber,
      clientName: d.client?.name || "Walk-In Customer",
      clientEmail: d.client?.email || "—",
      clientId: d.clientId,
      currency: d.currency || "KES",
      grandTotal: d.grandTotal,
      isRecurring: d.isRecurring,
      recurringInterval: d.recurringInterval,
      nextRecurringDate: d.nextRecurringDate,
      createdAt: d.createdAt,
    }));
  } catch (error) {
    console.error("Failed to load recurring invoices:", error);
    return [];
  }
}

/**
 * Action: Toggle recurring status or modify recurring interval of an invoice.
 */
export async function toggleRecurringInvoiceAction(input: {
  shopId: string;
  shopSlug: string;
  documentId: string;
  isRecurring: boolean;
  recurringInterval?: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized. Please log in." };
    await enforcePermission(input.shopId, "manage_documents");

    let nextDate: Date | null = null;
    if (input.isRecurring) {
      const interval = input.recurringInterval || "MONTHLY";
      const d = new Date();
      if (interval === "WEEKLY") d.setDate(d.getDate() + 7);
      else if (interval === "MONTHLY") d.setMonth(d.getMonth() + 1);
      else if (interval === "QUARTERLY") d.setMonth(d.getMonth() + 3);
      else if (interval === "YEARLY") d.setFullYear(d.getFullYear() + 1);
      nextDate = d;
    }

    await db.update(documents)
      .set({
        isRecurring: input.isRecurring,
        recurringInterval: input.isRecurring ? (input.recurringInterval || "MONTHLY") : null,
        nextRecurringDate: nextDate,
      })
      .where(and(eq(documents.id, input.documentId), eq(documents.shopId, input.shopId)));

    revalidatePath(`/workspaces/${input.shopSlug}/documents/recurring`);
    revalidatePath(`/workspaces/${input.shopSlug}/documents/${input.documentId}`);
    revalidatePath(`/workspaces/${input.shopSlug}`);

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update recurring invoice status:", error);
    return { success: false, error: error.message || "Failed to update recurring status." };
  }
}

/**
 * Action: Manually generate the next recurring cycle invoice immediately.
 */
export async function generateNextRecurringInvoiceAction(input: {
  shopId: string;
  shopSlug: string;
  sourceDocumentId: string;
}): Promise<{ success: boolean; error?: string; newDocId?: string }> {
  try {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };
    await enforcePermission(input.shopId, "manage_documents");

    const sourceDoc = await db.query.documents.findFirst({
      where: and(eq(documents.id, input.sourceDocumentId), eq(documents.shopId, input.shopId)),
      with: { items: true },
    });

    if (!sourceDoc) {
      return { success: false, error: "Source recurring invoice template could not be found." };
    }

    // Advance next recurring date
    const interval = sourceDoc.recurringInterval || "MONTHLY";
    const nextDate = new Date(sourceDoc.nextRecurringDate || new Date());
    if (interval === "WEEKLY") nextDate.setDate(nextDate.getDate() + 7);
    else if (interval === "MONTHLY") nextDate.setMonth(nextDate.getMonth() + 1);
    else if (interval === "QUARTERLY") nextDate.setMonth(nextDate.getMonth() + 3);
    else if (interval === "YEARLY") nextDate.setFullYear(nextDate.getFullYear() + 1);

    // Calculate due date (30 days from today)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const res = await createBillingDocument({
      shopId: input.shopId,
      shopSlug: input.shopSlug,
      clientId: sourceDoc.clientId || undefined,
      type: "INVOICE",
      dueDate,
      requiresEtims: sourceDoc.requiresEtims,
      currency: sourceDoc.currency || undefined,
      exchangeRate: sourceDoc.exchangeRate ? parseFloat(sourceDoc.exchangeRate) : 1.0,
      notes: `Generated automatically from recurring series template (${sourceDoc.docNumber})`,
      termsAndConditions: sourceDoc.termsAndConditions || undefined,
      items: sourceDoc.items.map((i) => ({
        productId: i.productId || undefined,
        description: i.description,
        notes: i.notes || undefined,
        quantity: parseFloat(i.quantity),
        unitPrice: parseFloat(i.unitPrice),
        taxType: i.taxType as any,
      })),
    });

    if (!res.success) {
      return { success: false, error: res.error };
    }

    // Update source doc next recurring date
    await db.update(documents)
      .set({ nextRecurringDate: nextDate })
      .where(eq(documents.id, sourceDoc.id));

    revalidatePath(`/workspaces/${input.shopSlug}/documents/recurring`);
    revalidatePath(`/workspaces/${input.shopSlug}/documents`);
    revalidatePath(`/workspaces/${input.shopSlug}`);

    return { success: true, newDocId: res.documentId };
  } catch (error: any) {
    console.error("Failed to generate next recurring invoice cycle:", error);
    return { success: false, error: error.message || "Failed to generate recurring invoice cycle." };
  }
}
