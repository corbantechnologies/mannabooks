"use server";

import { db } from "@/db";
import { shops, products, clients, documents } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { createBillingDocument } from "./documents";
import { revalidatePath } from "next/cache";
import zlib from "zlib";

/**
 * Encodes an array of UUIDs into a short, URL-safe compact token.
 */
export async function encodeCatalogToken(productIds: string[]): Promise<string> {
    if (!productIds || productIds.length === 0) return "";
    try {
        const hex = productIds.map((id) => id.replace(/-/g, "")).join("");
        const buf = Buffer.from(hex, "hex");
        const compressed = zlib.deflateRawSync(buf);
        return compressed.toString("base64url");
    } catch {
        return productIds.join(",");
    }
}

/**
 * Decodes a compact catalog token back into an array of full UUID strings.
 */
export async function decodeCatalogToken(token: string): Promise<string[]> {
    if (!token) return [];
    if (token.includes(",")) {
        return token.split(",").map((t) => t.trim()).filter(Boolean);
    }
    // If it's a raw 32-char hex string (e.g. concatenated UUIDs without hyphens)
    if (/^[0-9a-fA-F]{32,}$/.test(token) && token.length % 32 === 0) {
        const ids: string[] = [];
        for (let i = 0; i < token.length; i += 32) {
            const chunk = token.slice(i, i + 32);
            ids.push(
                `${chunk.slice(0, 8)}-${chunk.slice(8, 12)}-${chunk.slice(12, 16)}-${chunk.slice(16, 20)}-${chunk.slice(20, 32)}`
            );
        }
        return ids;
    }
    try {
        const compressed = Buffer.from(token, "base64url");
        const decompressed = zlib.inflateRawSync(compressed);
        const hex = decompressed.toString("hex");
        const ids: string[] = [];
        for (let i = 0; i < hex.length; i += 32) {
            const chunk = hex.slice(i, i + 32);
            if (chunk.length === 32) {
                const formatted = `${chunk.slice(0, 8)}-${chunk.slice(8, 12)}-${chunk.slice(12, 16)}-${chunk.slice(16, 20)}-${chunk.slice(20, 32)}`;
                ids.push(formatted);
            }
        }
        return ids.length > 0 ? ids : [token];
    } catch {
        return token.split(",").map((t) => t.trim()).filter(Boolean);
    }
}

export interface PublicCatalogItem {
    id: string;
    name: string;
    sku: string | null;
    itemType: string;
    unitPrice: number;
    defaultTaxType: "V_16" | "V_0" | "EXEMPT";
    trackStock: boolean;
    stockQuantity: number;
}

export interface PublicShopProfile {
    id: string;
    name: string;
    shortName: string | null;
    slug: string;
    currency: string;
    phone: string | null;
    email: string | null;
    website: string | null;
    logoUrl: string | null;
    primaryColor: string;
    taxPin: string | null;
    isVatRegistered: boolean;
}

/**
 * Fetches publicly shareable catalog and merchant details (strictly hiding cost/margins).
 */
export async function getPublicCatalogData(slug: string, search?: string, itemIds?: string[]) {
    try {
        const shop = await db.query.shops.findFirst({
            where: eq(shops.slug, slug),
        });

        if (!shop) {
            return { success: false, error: "Workspace not found." };
        }

        let allProducts = await db.query.products.findMany({
            where: eq(products.shopId, shop.id),
            orderBy: [desc(products.createdAt)],
        });

        // Filter for specifically curated item IDs if provided
        if (itemIds && itemIds.length > 0) {
            const itemSet = new Set(itemIds);
            allProducts = allProducts.filter((p) => itemSet.has(p.id));
        }

        if (search && search.trim() !== "") {
            const q = search.toLowerCase().trim();
            allProducts = allProducts.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    (p.sku && p.sku.toLowerCase().includes(q))
            );
        }

        const publicProducts: PublicCatalogItem[] = allProducts.map((p) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            itemType: p.itemType,
            unitPrice: parseFloat(p.unitPrice || "0"),
            defaultTaxType: p.defaultTaxType as any,
            trackStock: p.trackStock,
            stockQuantity: parseFloat(p.stockQuantity || "0"),
        }));

        const publicShop: PublicShopProfile = {
            id: shop.id,
            name: shop.name,
            shortName: shop.shortName,
            slug: shop.slug,
            currency: shop.currency || "KES",
            phone: shop.phone,
            email: shop.email,
            website: shop.website,
            logoUrl: shop.logoUrl,
            primaryColor: shop.primaryColor || "#000000",
            taxPin: shop.taxPin,
            isVatRegistered: shop.isVatRegistered,
        };

        return {
            success: true,
            shop: publicShop,
            products: publicProducts,
        };
    } catch (error: any) {
        console.error("Public catalog fetch error:", error);
        return { success: false, error: error.message || "Failed to load catalog." };
    }
}

export interface QuoteRequestItem {
    productId: string;
    quantity: number;
    notes?: string;
}

export interface CatalogQuoteRequestInput {
    shopId: string;
    shopSlug: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    customerNotes?: string;
    items: QuoteRequestItem[];
}

/**
 * Generates an official draft Quotation in the merchant's workspace from the customer's selection.
 */
export async function requestCatalogQuotationAction(input: CatalogQuoteRequestInput) {
    try {
        if (!input.items || input.items.length === 0) {
            return { success: false, error: "Please select at least one product." };
        }

        if (!input.customerName || input.customerName.trim() === "") {
            return { success: false, error: "Please provide your name or business name." };
        }

        const shop = await db.query.shops.findFirst({
            where: eq(shops.id, input.shopId),
        });
        if (!shop) return { success: false, error: "Workspace not found." };

        // 1. Find or create client
        let clientId: string | undefined;

        if (input.customerEmail || input.customerPhone) {
            const existingClient = await db.query.clients.findFirst({
                where: and(
                    eq(clients.shopId, input.shopId),
                    input.customerEmail ? eq(clients.email, input.customerEmail.trim()) : undefined
                ),
            });
            if (existingClient) {
                clientId = existingClient.id;
            }
        }

        if (!clientId) {
            const safeEmail = input.customerEmail?.trim() || `client_${Date.now()}@${shop.slug}.mannabooks.local`;
            const [newClient] = await db.insert(clients).values({
                shopId: input.shopId,
                name: input.customerName.trim(),
                email: safeEmail,
                phone: input.customerPhone ? input.customerPhone.trim() : null,
                clientType: "INDIVIDUAL",
            }).returning();
            clientId = newClient.id;
        }

        // 2. Fetch selected products
        const productIds = input.items.map((i) => i.productId);
        const fetchedProducts = await db.query.products.findMany({
            where: and(
                eq(products.shopId, input.shopId),
                inArray(products.id, productIds)
            ),
        });

        const productMap = new Map(fetchedProducts.map((p) => [p.id, p]));

        const documentItems = input.items.map((item) => {
            const prod = productMap.get(item.productId);
            const unitPrice = prod ? parseFloat(prod.unitPrice || "0") : 0;
            const description = prod ? prod.name : "Product";
            const taxType = (prod?.defaultTaxType as any) || "EXEMPT";

            return {
                productId: item.productId,
                description,
                notes: item.notes || undefined,
                quantity: item.quantity,
                unitPrice,
                taxType,
            };
        });

        const quoteNotes = input.customerNotes 
            ? `Customer Quote Request Note: ${input.customerNotes.trim()}`
            : "Requested via Public Digital Product Catalog";

        const res = await createBillingDocument({
            shopId: input.shopId,
            shopSlug: input.shopSlug,
            clientId,
            type: "QUOTATION",
            items: documentItems,
            notes: quoteNotes,
            currency: shop.currency || "KES",
        });

        if (!res.success) {
            return { success: false, error: (res as any).error || "Failed to generate quotation." };
        }

        revalidatePath(`/workspaces/${input.shopSlug}/documents`);
        return {
            success: true,
            documentId: res.documentId,
            serial: res.serial,
        };
    } catch (error: any) {
        console.error("Catalog quotation request error:", error);
        return { success: false, error: error.message || "Failed to process quote request." };
    }
}
