"use server";

import { db } from "@/db";
import { vendorBills, vendorBillItems, shops, suppliers, chartOfAccounts, journalEntries, accountingPeriods, whtPayments } from "@/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { enforcePermission } from "./rbac";
import { revalidatePath } from "next/cache";

export interface CreateVendorBillItemInput {
    accountId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
}

export interface CreateVendorBillInput {
    supplierId: string;
    reference?: string;
    billDate: string; // ISO string e.g. "2026-09-22"
    dueDate?: string;
    whtRate: number; // 0, 5, 10 etc.
    notes?: string;
    items: CreateVendorBillItemInput[];
}

export interface PayVendorBillInput {
    paymentAmount: number;
    paymentChannel: string; // "BANK" | "MPESA" | "CASH" | "CHEQUE"
    paymentReference: string;
    paymentDate: string;
    notes?: string;
}

/**
 * Fetch all vendor bills for a workspace
 */
export async function getVendorBills(shopSlug: string, filters?: { status?: string; supplierId?: string }) {
    const shop = await db.query.shops.findFirst({
        where: eq(shops.slug, shopSlug),
    });

    if (!shop) {
        throw new Error("Workspace not found");
    }

    await enforcePermission(shop.id, "view_finance");

    const conditions = [eq(vendorBills.shopId, shop.id)];
    if (filters?.status && filters.status !== "ALL") {
        conditions.push(eq(vendorBills.status, filters.status));
    }
    if (filters?.supplierId && filters.supplierId !== "ALL") {
        conditions.push(eq(vendorBills.supplierId, filters.supplierId));
    }

    const bills = await db.query.vendorBills.findMany({
        where: and(...conditions),
        orderBy: [desc(vendorBills.billDate)],
        with: {
            supplier: true,
            items: {
                with: {
                    account: true,
                },
            },
        },
    });

    return bills;
}

/**
 * Fetch single vendor bill by ID
 */
export async function getVendorBillById(billId: string, shopSlug: string) {
    const shop = await db.query.shops.findFirst({
        where: eq(shops.slug, shopSlug),
    });

    if (!shop) {
        throw new Error("Workspace not found");
    }

    await enforcePermission(shop.id, "view_finance");

    const bill = await db.query.vendorBills.findFirst({
        where: and(eq(vendorBills.id, billId), eq(vendorBills.shopId, shop.id)),
        with: {
            supplier: true,
            items: {
                with: {
                    account: true,
                },
            },
        },
    });

    return bill;
}

/**
 * Create a new Vendor Bill with line items and automatic tax/WHT calculations
 */
export async function createVendorBill(shopSlug: string, input: CreateVendorBillInput) {
    const shop = await db.query.shops.findFirst({
        where: eq(shops.slug, shopSlug),
    });

    if (!shop) {
        return { success: false, error: "Workspace not found" };
    }

    await enforcePermission(shop.id, "manage_expenses");

    if (!input.items || input.items.length === 0) {
        return { success: false, error: "At least one expense line item is required" };
    }

    // 1. Generate unique sequential bill number e.g. BILL-0001
    const count = await db.query.vendorBills.findMany({
        where: eq(vendorBills.shopId, shop.id),
        columns: { id: true },
    });
    const billNumber = `BILL-${String(count.length + 1).padStart(4, "0")}`;

    // 2. Compute financial totals
    let subTotal = 0;
    let taxAmount = 0;

    const computedItems = input.items.map((it) => {
        const qty = Number(it.quantity) || 1;
        const price = Number(it.unitPrice) || 0;
        const rate = Number(it.taxRate) || 0;
        const lineSub = qty * price;
        const lineTax = lineSub * (rate / 100);
        const lineTotal = lineSub + lineTax;

        subTotal += lineSub;
        taxAmount += lineTax;

        return {
            accountId: it.accountId,
            description: it.description || "Vendor line expense",
            quantity: qty.toFixed(2),
            unitPrice: price.toFixed(2),
            taxRate: rate.toFixed(2),
            totalAmount: lineTotal.toFixed(2),
        };
    });

    const totalAmount = subTotal + taxAmount;
    const whtRate = Number(input.whtRate) || 0;
    const whtAmount = subTotal * (whtRate / 100);
    const netPayable = Math.max(0, totalAmount - whtAmount);

    // 3. Persist in database
    const newBill = await db.transaction(async (tx) => {
        const [insertedBill] = await tx.insert(vendorBills).values({
            shopId: shop.id,
            supplierId: input.supplierId,
            billNumber,
            reference: input.reference?.trim() || null,
            billDate: new Date(input.billDate),
            dueDate: input.dueDate ? new Date(input.dueDate) : null,
            subTotal: subTotal.toFixed(2),
            taxAmount: taxAmount.toFixed(2),
            whtRate: whtRate.toFixed(2),
            whtAmount: whtAmount.toFixed(2),
            totalAmount: totalAmount.toFixed(2),
            netPayable: netPayable.toFixed(2),
            amountPaid: "0.00",
            status: "DRAFT",
            notes: input.notes?.trim() || null,
        }).returning();

        for (const item of computedItems) {
            await tx.insert(vendorBillItems).values({
                billId: insertedBill.id,
                accountId: item.accountId,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxRate: item.taxRate,
                totalAmount: item.totalAmount,
            });
        }

        return insertedBill;
    });

    revalidatePath(`/workspaces/${shopSlug}/finance/bills`);
    revalidatePath(`/workspaces/${shopSlug}/finance/reports/payables-aging`);

    return { success: true, billId: newBill.id, billNumber: newBill.billNumber };
}

/**
 * Approve a Vendor Bill: moves status to APPROVED and writes double-entry GL journal
 * Debit: Expense Account(s)
 * Credit: 2100 Accounts Payable (net amount)
 * Credit: 2350 WHT Payable (withholding tax if applicable)
 */
export async function approveVendorBill(billId: string, shopSlug: string) {
    const shop = await db.query.shops.findFirst({
        where: eq(shops.slug, shopSlug),
    });

    if (!shop) {
        return { success: false, error: "Workspace not found" };
    }

    const { userId } = await enforcePermission(shop.id, "manage_expenses");

    const bill = await db.query.vendorBills.findFirst({
        where: and(eq(vendorBills.id, billId), eq(vendorBills.shopId, shop.id)),
        with: {
            supplier: true,
            items: true,
        },
    });

    if (!bill) {
        return { success: false, error: "Vendor bill not found" };
    }

    if (bill.status !== "DRAFT" && bill.status !== "AWAITING_APPROVAL") {
        return { success: false, error: `Cannot approve a bill that is already in status ${bill.status}` };
    }

    await db.transaction(async (tx) => {
        // 1. Update bill status
        await tx.update(vendorBills).set({
            status: "APPROVED",
            updatedAt: new Date(),
        }).where(eq(vendorBills.id, bill.id));

        // 2. Post to General Ledger if enabled
        if (shop.isGlEnabled) {
            // Find active period for bill date
            const entryDate = new Date(bill.billDate);
            const period = await tx.query.accountingPeriods.findFirst({
                where: and(
                    eq(accountingPeriods.shopId, shop.id),
                    eq(accountingPeriods.status, "OPEN")
                ),
                orderBy: [asc(accountingPeriods.startDate)],
            });

            // Find or seed 2100 Accounts Payable
            let apAccount = await tx.query.chartOfAccounts.findFirst({
                where: and(eq(chartOfAccounts.shopId, shop.id), eq(chartOfAccounts.code, "2100")),
            });
            if (!apAccount) {
                const [created] = await tx.insert(chartOfAccounts).values({
                    shopId: shop.id,
                    code: "2100",
                    name: "Accounts Payable",
                    accountType: "LIABILITY",
                    isSystem: true,
                }).returning();
                apAccount = created;
            }

            // Find or seed 2350 WHT Payable if withholding applies
            const whtAmt = parseFloat(bill.whtAmount || "0");
            let whtAccount = null;
            if (whtAmt > 0.009) {
                whtAccount = await tx.query.chartOfAccounts.findFirst({
                    where: and(eq(chartOfAccounts.shopId, shop.id), eq(chartOfAccounts.code, "2350")),
                });
                if (!whtAccount) {
                    const [created] = await tx.insert(chartOfAccounts).values({
                        shopId: shop.id,
                        code: "2350",
                        name: "WHT Payable",
                        accountType: "LIABILITY",
                        isSystem: true,
                    }).returning();
                    whtAccount = created;
                }
            }

            // Post double-entry records
            // Each line item debits its respective expense account and credits AP
            const netPay = parseFloat(bill.netPayable || "0");
            const totAmt = parseFloat(bill.totalAmount || "0");

            for (const item of bill.items) {
                const itemAmt = parseFloat(item.totalAmount || "0");
                if (itemAmt <= 0) continue;

                // Scale AP portion and WHT portion proportionally if WHT applies
                const apPortion = totAmt > 0 ? (itemAmt * netPay) / totAmt : itemAmt;
                const whtPortion = totAmt > 0 && whtAmt > 0 ? (itemAmt * whtAmt) / totAmt : 0;

                // Debit Expense Account / Credit AP Account
                if (apPortion > 0.009) {
                    await tx.insert(journalEntries).values({
                        shopId: shop.id,
                        periodId: period?.id || null,
                        entryDate,
                        description: `Vendor Bill ${bill.billNumber}: ${item.description}`,
                        debitAccountId: item.accountId,
                        creditAccountId: apAccount.id,
                        amount: apPortion.toFixed(2),
                        referenceNumber: bill.billNumber,
                        sourceType: "expense",
                        sourceId: bill.id,
                        createdById: userId,
                    });
                }

                // Debit Expense Account / Credit WHT Payable Account
                if (whtPortion > 0.009 && whtAccount) {
                    await tx.insert(journalEntries).values({
                        shopId: shop.id,
                        periodId: period?.id || null,
                        entryDate,
                        description: `WHT Deduction ${bill.whtRate}% on Bill ${bill.billNumber}: ${item.description}`,
                        debitAccountId: item.accountId,
                        creditAccountId: whtAccount.id,
                        amount: whtPortion.toFixed(2),
                        referenceNumber: bill.billNumber,
                        sourceType: "expense",
                        sourceId: bill.id,
                        createdById: userId,
                    });
                }
            }

            // Also record in statutory whtPayments table for monthly KRA remittal tracking
            if (whtAmt > 0.009) {
                await tx.insert(whtPayments).values({
                    shopId: shop.id,
                    month: entryDate.getMonth() + 1,
                    year: entryDate.getFullYear(),
                    grossAmount: bill.subTotal,
                    whtRate: bill.whtRate,
                    whtAmount: bill.whtAmount,
                    status: "PENDING",
                });
            }
        }
    });

    revalidatePath(`/workspaces/${shopSlug}/finance/bills`);
    revalidatePath(`/workspaces/${shopSlug}/finance/ledger`);
    revalidatePath(`/workspaces/${shopSlug}/finance/reports/payables-aging`);
    revalidatePath(`/workspaces/${shopSlug}/finance/reports/trial-balance`);
    revalidatePath(`/workspaces/${shopSlug}/finance/reports/balance-sheet`);

    return { success: true };
}

/**
 * Settle or partially pay a Vendor Bill
 * Debit: 2100 Accounts Payable
 * Credit: 1200 Cash & Bank
 */
export async function payVendorBill(billId: string, shopSlug: string, input: PayVendorBillInput) {
    const shop = await db.query.shops.findFirst({
        where: eq(shops.slug, shopSlug),
    });

    if (!shop) {
        return { success: false, error: "Workspace not found" };
    }

    const { userId } = await enforcePermission(shop.id, "manage_expenses");

    const bill = await db.query.vendorBills.findFirst({
        where: and(eq(vendorBills.id, billId), eq(vendorBills.shopId, shop.id)),
        with: { supplier: true },
    });

    if (!bill) {
        return { success: false, error: "Vendor bill not found" };
    }

    if (bill.status === "DRAFT" || bill.status === "CANCELLED") {
        return { success: false, error: "Cannot pay a draft or cancelled bill. Please approve it first." };
    }

    const paymentAmt = Number(input.paymentAmount) || 0;
    if (paymentAmt <= 0) {
        return { success: false, error: "Payment amount must be greater than zero." };
    }

    const currentPaid = parseFloat(bill.amountPaid || "0");
    const netPayable = parseFloat(bill.netPayable || "0");
    const remainingBefore = Math.max(0, netPayable - currentPaid);

    if (paymentAmt > remainingBefore + 0.01) {
        return { success: false, error: `Payment amount (${paymentAmt.toFixed(2)}) exceeds remaining balance (${remainingBefore.toFixed(2)})` };
    }

    const newPaid = currentPaid + paymentAmt;
    const isFullyPaid = newPaid >= (netPayable - 0.01);
    const newStatus = isFullyPaid ? "PAID" : "PARTIALLY_PAID";
    const paymentDate = new Date(input.paymentDate);

    await db.transaction(async (tx) => {
        await tx.update(vendorBills).set({
            amountPaid: newPaid.toFixed(2),
            status: newStatus,
            paymentChannel: input.paymentChannel,
            paymentReference: input.paymentReference?.trim() || null,
            paidAt: paymentDate,
            updatedAt: new Date(),
        }).where(eq(vendorBills.id, bill.id));

        // Post settlement journal to GL if enabled
        if (shop.isGlEnabled) {
            const period = await tx.query.accountingPeriods.findFirst({
                where: and(
                    eq(accountingPeriods.shopId, shop.id),
                    eq(accountingPeriods.status, "OPEN")
                ),
                orderBy: [asc(accountingPeriods.startDate)],
            });

            // Find 2100 AP
            let apAccount = await tx.query.chartOfAccounts.findFirst({
                where: and(eq(chartOfAccounts.shopId, shop.id), eq(chartOfAccounts.code, "2100")),
            });
            if (!apAccount) {
                const [created] = await tx.insert(chartOfAccounts).values({
                    shopId: shop.id,
                    code: "2100",
                    name: "Accounts Payable",
                    accountType: "LIABILITY",
                    isSystem: true,
                }).returning();
                apAccount = created;
            }

            // Find 1200 Cash & Bank
            let cashAccount = await tx.query.chartOfAccounts.findFirst({
                where: and(eq(chartOfAccounts.shopId, shop.id), eq(chartOfAccounts.code, "1200")),
            });
            if (!cashAccount) {
                const [created] = await tx.insert(chartOfAccounts).values({
                    shopId: shop.id,
                    code: "1200",
                    name: "Cash & Bank",
                    accountType: "ASSET",
                    isSystem: true,
                }).returning();
                cashAccount = created;
            }

            // Debit AP, Credit Cash & Bank
            await tx.insert(journalEntries).values({
                shopId: shop.id,
                periodId: period?.id || null,
                entryDate: paymentDate,
                description: `Settlement of ${bill.billNumber} (${bill.supplier?.name || "Vendor"}) - Ref: ${input.paymentReference || "Direct"}`,
                debitAccountId: apAccount.id,
                creditAccountId: cashAccount.id,
                amount: paymentAmt.toFixed(2),
                referenceNumber: `PV-${bill.billNumber}`,
                sourceType: "expense",
                sourceId: bill.id,
                createdById: userId,
            });
        }
    });

    revalidatePath(`/workspaces/${shopSlug}/finance/bills`);
    revalidatePath(`/workspaces/${shopSlug}/finance/ledger`);
    revalidatePath(`/workspaces/${shopSlug}/finance/reports/payables-aging`);
    revalidatePath(`/workspaces/${shopSlug}/finance/reports/trial-balance`);
    revalidatePath(`/workspaces/${shopSlug}/finance/reports/balance-sheet`);

    return { success: true, newStatus };
}

/**
 * Cancel a Vendor Bill
 */
export async function cancelVendorBill(billId: string, shopSlug: string) {
    const shop = await db.query.shops.findFirst({
        where: eq(shops.slug, shopSlug),
    });

    if (!shop) {
        return { success: false, error: "Workspace not found" };
    }

    await enforcePermission(shop.id, "manage_expenses");

    const bill = await db.query.vendorBills.findFirst({
        where: and(eq(vendorBills.id, billId), eq(vendorBills.shopId, shop.id)),
    });

    if (!bill) {
        return { success: false, error: "Vendor bill not found" };
    }

    if (bill.status === "PAID") {
        return { success: false, error: "Cannot cancel a fully settled bill." };
    }

    await db.update(vendorBills).set({
        status: "CANCELLED",
        updatedAt: new Date(),
    }).where(eq(vendorBills.id, bill.id));

    revalidatePath(`/workspaces/${shopSlug}/finance/bills`);
    revalidatePath(`/workspaces/${shopSlug}/finance/reports/payables-aging`);

    return { success: true };
}

/**
 * Delete a Draft Vendor Bill
 */
export async function deleteVendorBill(billId: string, shopSlug: string) {
    const shop = await db.query.shops.findFirst({
        where: eq(shops.slug, shopSlug),
    });

    if (!shop) {
        return { success: false, error: "Workspace not found" };
    }

    await enforcePermission(shop.id, "manage_expenses");

    const bill = await db.query.vendorBills.findFirst({
        where: and(eq(vendorBills.id, billId), eq(vendorBills.shopId, shop.id)),
    });

    if (!bill) {
        return { success: false, error: "Vendor bill not found" };
    }

    if (bill.status !== "DRAFT") {
        return { success: false, error: "Only draft bills can be permanently deleted. Please cancel approved bills instead." };
    }

    await db.delete(vendorBills).where(eq(vendorBills.id, bill.id));

    revalidatePath(`/workspaces/${shopSlug}/finance/bills`);
    revalidatePath(`/workspaces/${shopSlug}/finance/reports/payables-aging`);

    return { success: true };
}
