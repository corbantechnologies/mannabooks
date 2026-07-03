// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Standard Tailwind layout merging utility.
 * Mainative to support the flat, crisp, stark black-and-white theme.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Safely converts string-based database numeric values to Javascript floating points
 * strictly for user display layouts.
 */
export function formatCurrency(amount: string | number, currency = "KES"): string {
    const value = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(value)) return `${currency} 0.00`;

    return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value).replace("Ksh", "KES"); // Forces flat modern notation
}

export interface LineItemCalculationInput {
    quantity: number;
    unitPrice: number;
    taxType: "V_16" | "V_0" | "EXEMPT";
    isShopVatRegistered: boolean;
}

export interface LineItemCalculationOutput {
    subTotal: number;
    taxAmount: number;
    itemTotal: number;
}

/**
 * The core mathematical engine for Manna Books line items.
 * Computes individual row figures with zero-rounding leakages.
 */
export function calculateLineItem({
    quantity,
    unitPrice,
    taxType,
    isShopVatRegistered
}: LineItemCalculationInput): LineItemCalculationOutput {
    const subTotal = quantity * unitPrice;

    // If the merchant isn't VAT registered, or the item is exempt/zero-rated, tax is flat zero
    if (!isShopVatRegistered || taxType === "EXEMPT" || taxType === "V_0") {
        return {
            subTotal: Math.round(subTotal * 100) / 100,
            taxAmount: 0,
            itemTotal: Math.round(subTotal * 100) / 100,
        };
    }

    // Standard local statutory 16% VAT calculation
    const taxAmount = subTotal * 0.16;
    const itemTotal = subTotal + taxAmount;

    return {
        subTotal: Math.round(subTotal * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        itemTotal: Math.round(itemTotal * 100) / 100,
    };
}

interface DocumentTotalsInput {
    items: {
        quantity: number;
        unitPrice: number;
        taxType: "V_16" | "V_0" | "EXEMPT";
    }[];
    isShopVatRegistered: boolean;
}

/**
 * Aggregates all line item rows to compile the parent document snapshots.
 */
export function calculateDocumentTotals({ items, isShopVatRegistered }: DocumentTotalsInput) {
    return items.reduce(
        (acc, item) => {
            const row = calculateLineItem({
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxType: item.taxType,
                isShopVatRegistered,
            });

            acc.subTotal += row.subTotal;
            acc.taxAmount += row.taxAmount;
            acc.grandTotal += row.itemTotal;

            return acc;
        },
        { subTotal: 0, taxAmount: 0, grandTotal: 0 }
    );
}