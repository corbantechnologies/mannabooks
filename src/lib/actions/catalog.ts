"use server";

import { db } from "@/db";
import { shops, products, clients, documents, documentTokens, shopTerms } from "@/db/schema";
import { eq, and, desc, asc, inArray } from "drizzle-orm";
import { createBillingDocument } from "./documents";
import { dispatchDocumentEmail } from "./email";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
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
 * Decodes a compact catalog token back into an array of product UUIDs.
 */
export async function decodeCatalogToken(token: string): Promise<string[]> {
    if (!token || token.trim() === "") return [];
    try {
        const buf = Buffer.from(token, "base64url");
        const decompressed = zlib.inflateRawSync(buf);
        const hex = decompressed.toString("hex");
        const productIds: string[] = [];
        for (let i = 0; i < hex.length; i += 32) {
            const h = hex.slice(i, i + 32);
            if (h.length === 32) {
                const uuid = `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
                productIds.push(uuid);
            }
        }
        return productIds;
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

export interface PublicShopTerm {
    title: string;
    content: string;
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

        const activeCatalogTerms = await db.query.shopTerms.findMany({
            where: and(
                eq(shopTerms.shopId, shop.id),
                eq(shopTerms.isDefaultCatalog, true)
            ),
            orderBy: [asc(shopTerms.displayOrder), asc(shopTerms.createdAt)],
        });

        const publicTerms: PublicShopTerm[] = activeCatalogTerms.map(t => ({
            title: t.title,
            content: t.content,
        }));

        return {
            success: true,
            shop: publicShop,
            products: publicProducts,
            terms: publicTerms,
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

        const catalogTerms = await db.query.shopTerms.findMany({
            where: and(
                eq(shopTerms.shopId, input.shopId),
                eq(shopTerms.isDefaultCatalog, true)
            ),
            orderBy: [asc(shopTerms.displayOrder), asc(shopTerms.createdAt)],
        });

        const termsAndConditions = catalogTerms.length > 0 
            ? JSON.stringify(catalogTerms.map(t => `${t.title}: ${t.content}`))
            : undefined;

        const res = await createBillingDocument({
            shopId: input.shopId,
            shopSlug: input.shopSlug,
            clientId,
            type: "QUOTATION",
            items: documentItems,
            notes: quoteNotes,
            termsAndConditions,
            currency: shop.currency || "KES",
        });

        if (!res.success || !res.documentId) {
            return { success: false, error: (res as any).error || "Failed to generate quotation." };
        }

        // 3. Mark the Quotation as ISSUED immediately
        await db
            .update(documents)
            .set({ status: "ISSUED" })
            .where(eq(documents.id, res.documentId));

        // 4. Retrieve the secure passwordless access token for this document
        const docToken = await db.query.documentTokens.findFirst({
            where: eq(documentTokens.documentId, res.documentId),
        });

        const createdDoc = await db.query.documents.findFirst({
            where: eq(documents.id, res.documentId),
            with: { items: true },
        });

        // 5. Automatic Email to Client (if email provided)
        if (input.customerEmail && input.customerEmail.includes("@")) {
            try {
                await dispatchDocumentEmail({ documentId: res.documentId });
            } catch (err) {
                console.warn("Could not dispatch client quotation copy email:", err);
            }
        }

        // 6. Automatic Alert Email to Merchant
        if (shop.email && process.env.RESEND_FROM_EMAIL) {
            try {
                const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");
                const fromAddress = process.env.RESEND_FROM_EMAIL || "Manna Books <billing@corbantechnologies.org>";
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://www.mannabooks.co.ke";
                const dashboardDocUrl = `${appUrl}/workspaces/${shop.slug}/documents/${res.documentId}`;

                const itemsTableHtml = (createdDoc?.items || [])
                    .map(
                        (it, idx) => `
                    <tr style="border-bottom: 1px solid #e4e4e7;">
                        <td style="padding: 8px; font-size: 12px; font-weight: bold; color: #18181b;">${idx + 1}. ${it.description}</td>
                        <td style="padding: 8px; font-size: 12px; text-align: center; font-family: monospace;">${parseFloat(it.quantity || "1")}</td>
                        <td style="padding: 8px; font-size: 12px; text-align: right; font-family: monospace; font-weight: bold;">${shop.currency} ${parseFloat(it.itemTotal || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                `
                    )
                    .join("");

                await resend.emails.send({
                    from: fromAddress,
                    to: [shop.email.trim()],
                    replyTo: input.customerEmail ? [input.customerEmail.trim()] : undefined,
                    subject: `🚨 New Quotation Request: ${res.serial} from ${input.customerName.trim()} (${shop.currency} ${parseFloat(createdDoc?.grandTotal || "0").toLocaleString()})`,
                    html: `
                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; background-color: #ffffff; color: #09090b; border: 1px solid #e2e8f0; border-radius: 8px;">
                            <div style="border-bottom: 2px solid #000000; padding-bottom: 14px; margin-bottom: 20px;">
                                <span style="font-family: monospace; font-size: 10px; font-weight: bold; background-color: #fef08a; color: #854d0e; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">
                                    New Online Quotation Request
                                </span>
                                <h2 style="font-size: 18px; font-weight: bold; margin: 8px 0 0 0; text-transform: uppercase;">
                                    Quotation ${res.serial} Issued Online
                                </h2>
                            </div>

                            <p style="font-size: 13px; color: #334155; line-height: 1.5; margin-bottom: 16px;">
                                A customer has just submitted a formal quotation request from your public digital catalog. The quotation has been automatically created in your workspace at <strong>ISSUED</strong> status.
                            </p>

                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; margin-bottom: 20px; font-size: 12px; line-height: 1.6;">
                                <div>👤 <strong>Client Name:</strong> ${input.customerName.trim()}</div>
                                ${input.customerEmail ? `<div>✉️ <strong>Client Email:</strong> <a href="mailto:${input.customerEmail.trim()}">${input.customerEmail.trim()}</a></div>` : `<div>✉️ <strong>Client Email:</strong> <span style="color: #94a3b8;">Not provided</span></div>`}
                                ${input.customerPhone ? `<div>📞 <strong>Client Phone / WhatsApp:</strong> <a href="tel:${input.customerPhone.trim()}">${input.customerPhone.trim()}</a> &nbsp;•&nbsp; <a href="https://wa.me/${input.customerPhone.replace(/[^0-9]/g, "")}" target="_blank" style="color: #16a34a; font-weight: bold;">WhatsApp →</a></div>` : `<div>📞 <strong>Client Phone:</strong> <span style="color: #94a3b8;">Not provided</span></div>`}
                                ${input.customerNotes ? `<div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #cbd5e1; font-style: italic; color: #475569;">💬 <strong>Client Notes:</strong> "${input.customerNotes.trim()}"</div>` : ""}
                            </div>

                            <div style="border: 1px solid #e4e4e7; border-radius: 6px; overflow: hidden; margin-bottom: 20px;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <thead>
                                        <tr style="background-color: #18181b; color: #ffffff;">
                                            <th style="padding: 8px; font-size: 11px; font-family: monospace; text-align: left; text-transform: uppercase;">Requested Items</th>
                                            <th style="padding: 8px; font-size: 11px; font-family: monospace; text-align: center; text-transform: uppercase;">Qty</th>
                                            <th style="padding: 8px; font-size: 11px; font-family: monospace; text-align: right; text-transform: uppercase;">Total (${shop.currency})</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${itemsTableHtml}
                                        <tr style="background-color: #f4f4f5; font-weight: bold;">
                                            <td colspan="2" style="padding: 10px 8px; font-size: 13px; text-align: right;">GRAND TOTAL:</td>
                                            <td style="padding: 10px 8px; font-size: 14px; text-align: right; font-family: monospace; color: #047857;">
                                                ${shop.currency} ${parseFloat(createdDoc?.grandTotal || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div style="text-align: center; margin-bottom: 16px;">
                                <a href="${dashboardDocUrl}" target="_blank" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 12px 24px; font-size: 12px; font-weight: bold; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                                    👉 Open Quotation in Manna Books Dashboard →
                                </a>
                            </div>

                            <div style="text-align: center; font-size: 10px; color: #94a3b8; font-family: monospace; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                                Notification generated automatically by Manna Books
                            </div>
                        </div>
                    `,
                });
            } catch (err) {
                console.warn("Could not dispatch merchant quote request alert email:", err);
            }
        }

        revalidatePath(`/workspaces/${input.shopSlug}/documents`);
        return {
            success: true,
            documentId: res.documentId,
            serial: res.serial,
            token: docToken?.token,
            grandTotal: createdDoc?.grandTotal,
        };
    } catch (error: any) {
        console.error("Catalog quotation request error:", error);
        return { success: false, error: error.message || "Failed to process quote request." };
    }
}

export interface SendCatalogEmailInput {
    shopSlug: string;
    recipientEmail: string;
    recipientName?: string;
    customMessage?: string;
    productIds?: string[];
    token?: string;
}

/**
 * Dispatches a beautifully branded catalog email to a prospective or existing client via Resend.
 */
export async function sendCatalogEmailAction(input: SendCatalogEmailInput) {
    try {
        if (!input.recipientEmail || !input.recipientEmail.includes("@")) {
            return { success: false, error: "Please provide a valid recipient email address." };
        }

        const shop = await db.query.shops.findFirst({
            where: eq(shops.slug, input.shopSlug),
        });

        if (!shop) {
            return { success: false, error: "Workspace not found." };
        }

        let itemIds = input.productIds;
        let activeToken = input.token;

        if (!itemIds && activeToken) {
            itemIds = await decodeCatalogToken(activeToken);
        } else if (itemIds && itemIds.length > 0 && !activeToken) {
            activeToken = await encodeCatalogToken(itemIds);
        }

        let catalogProducts: any[] = [];
        if (itemIds && itemIds.length > 0) {
            catalogProducts = await db.query.products.findMany({
                where: and(
                    eq(products.shopId, shop.id),
                    inArray(products.id, itemIds)
                ),
            });
        } else {
            catalogProducts = await db.query.products.findMany({
                where: eq(products.shopId, shop.id),
                orderBy: [desc(products.createdAt)],
                limit: 12,
            });
        }

        const isCurated = !!(itemIds && itemIds.length > 0);
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://www.mannabooks.co.ke";
        const catalogLink = `${appUrl}/portal/catalog/${shop.slug}${activeToken ? `?token=${encodeURIComponent(activeToken)}` : ""}`;
        const pdfLink = `${appUrl}/api/catalog/${shop.slug}/pdf${activeToken ? `?token=${encodeURIComponent(activeToken)}` : ""}`;

        const brandColor = shop.primaryColor || "#000000";
        const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");
        const rawFrom = process.env.RESEND_FROM_EMAIL || "Manna Books <billing@corbantechnologies.org>";
        const emailMatch = rawFrom.match(/<([^>]+)>/);
        const emailOnly = emailMatch ? emailMatch[1] : (rawFrom.includes("@") ? rawFrom.trim() : "billing@corbantechnologies.org");
        const cleanShopName = (shop?.name || "Manna Books").replace(/[<>"']/g, "").trim();
        const fromAddress = `${cleanShopName} <${emailOnly}>`;

        const clientSalutation = input.recipientName?.trim()
            ? `Dear <strong>${input.recipientName.trim()}</strong>,`
            : "Dear Valued Client,";

        const subject = isCurated
            ? `${shop.name} — Curated Product Selection & Pricing (${catalogProducts.length} Items)`
            : `${shop.name} — Official Product Catalog & Price List`;

        // Render preview table of items
        const previewItems = catalogProducts.slice(0, 8);
        const remainingCount = catalogProducts.length - previewItems.length;

        const tableRowsHtml = previewItems
            .map(
                (prod, idx) => `
            <tr style="border-bottom: 1px solid #e4e4e7;">
                <td style="padding: 10px 8px; font-size: 13px; font-weight: bold; color: #18181b;">
                    ${idx + 1}. ${prod.name}
                    ${prod.sku ? `<div style="font-size: 11px; font-family: monospace; color: #71717a; font-weight: normal; margin-top: 2px;">SKU: ${prod.sku}</div>` : ""}
                </td>
                <td style="padding: 10px 8px; font-size: 13px; font-family: monospace; font-weight: bold; color: #000000; text-align: right; white-space: nowrap;">
                    ${shop.currency} ${parseFloat(prod.unitPrice || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
            </tr>
        `
            )
            .join("");

        const html = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; color: #09090b; border: 1px solid #e4e4e7; border-radius: 8px;">
                
                <!-- HEADER BRANDING -->
                <div style="border-bottom: 2px solid ${brandColor}; padding-bottom: 16px; margin-bottom: 24px;">
                    <h1 style="font-size: 20px; font-weight: 800; text-transform: uppercase; margin: 0; color: ${brandColor}; letter-spacing: -0.03em;">
                        ${shop.name}
                    </h1>
                    <p style="font-family: monospace; font-size: 11px; color: #71717a; margin: 4px 0 0 0; text-transform: uppercase;">
                        ${isCurated ? `Curated Product Quotation Selection (${catalogProducts.length} Items)` : "Official Commercial Product Catalog"}
                    </p>
                </div>

                <!-- SALUTATION & INTRO -->
                <p style="font-size: 14px; margin-bottom: 16px; color: #18181b;">${clientSalutation}</p>
                <p style="font-size: 14px; line-height: 1.5; color: #3f3f46; margin-bottom: 20px;">
                    ${
                        isCurated
                            ? `Please find our official pricing and product specifications for the <strong>${catalogProducts.length} selected models</strong> below.`
                            : `Please find our official product catalog, specifications, and commercial pricing below.`
                    }
                </p>

                <!-- PERSONAL MESSAGE (IF PROVIDED) -->
                ${
                    input.customMessage?.trim()
                        ? `
                    <div style="background-color: #f8fafc; border-left: 3px solid ${brandColor}; padding: 14px 16px; margin-bottom: 24px; border-radius: 4px; font-size: 13px; color: #334155; font-style: italic; line-height: 1.5;">
                        "${input.customMessage.trim()}"
                    </div>
                `
                        : ""
                }

                <!-- PRODUCT PREVIEW TABLE -->
                <div style="background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 6px; overflow: hidden; margin-bottom: 24px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #18181b; color: #ffffff;">
                                <th style="padding: 8px 12px; font-size: 11px; font-family: monospace; text-transform: uppercase; text-align: left; font-weight: bold;">Product Specification</th>
                                <th style="padding: 8px 12px; font-size: 11px; font-family: monospace; text-transform: uppercase; text-align: right; font-weight: bold;">Price (${shop.currency})</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRowsHtml}
                        </tbody>
                    </table>
                    ${
                        remainingCount > 0
                            ? `
                        <div style="padding: 8px 12px; font-size: 12px; color: #71717a; text-align: center; background-color: #f4f4f5; font-family: monospace;">
                            + ${remainingCount} additional models listed in online catalog
                        </div>
                    `
                            : ""
                    }
                </div>

                <!-- PRIMARY ACTION CTA BUTTON -->
                <div style="text-align: center; margin-bottom: 24px;">
                    <a href="${catalogLink}" target="_blank" style="display: inline-block; background-color: ${brandColor}; color: #ffffff; text-decoration: none; padding: 14px 28px; font-size: 13px; font-weight: bold; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        👉 Open Interactive Catalog &amp; Request Quote →
                    </a>
                </div>

                <!-- PDF DOWNLOAD LINK -->
                <div style="text-align: center; margin-bottom: 24px;">
                    <a href="${pdfLink}" target="_blank" style="font-size: 12px; font-family: monospace; color: #52525b; text-decoration: underline;">
                        📄 Or download printable PDF rate card
                    </a>
                </div>

                <!-- DIRECT BUSINESS CONTACT & INQUIRIES CARD -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px; margin-bottom: 24px;">
                    <h4 style="margin: 0 0 8px 0; font-size: 11px; font-family: monospace; text-transform: uppercase; font-weight: bold; color: #0f172a; letter-spacing: 0.05em;">
                        Direct Merchant Contact &amp; Inquiries:
                    </h4>
                    <p style="margin: 0 0 12px 0; font-size: 12px; color: #475569; line-height: 1.4;">
                        For questions, bulk order discounts, delivery schedules, or immediate assistance, contact <strong>${shop.name}</strong> directly:
                    </p>
                    
                    <div style="font-size: 12px; color: #1e293b; line-height: 1.8;">
                        ${
                            shop.phone
                                ? `<div style="margin-bottom: 4px;">
                                    📞 <strong>Phone:</strong> <a href="tel:${shop.phone.replace(/[^0-9+]/g, "")}" style="color: ${brandColor}; font-weight: bold; text-decoration: none;">${shop.phone}</a>
                                    &nbsp;•&nbsp;
                                    💬 <strong>WhatsApp:</strong> <a href="https://wa.me/${shop.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${shop.name}, I am inquiring about your product catalog: ${catalogLink}`)}" target="_blank" style="color: #16a34a; font-weight: bold; text-decoration: none;">Chat on WhatsApp →</a>
                                </div>`
                                : ""
                        }
                        ${
                            shop.email
                                ? `<div style="margin-bottom: 4px;">
                                    ✉️ <strong>Direct Email:</strong> <a href="mailto:${shop.email}" style="color: ${brandColor}; font-weight: bold; text-decoration: none;">${shop.email}</a>
                                    <span style="color: #64748b; font-size: 11px;">(or reply directly to this email)</span>
                                </div>`
                                : ""
                        }
                        ${
                            shop.website
                                ? `<div style="margin-bottom: 4px;">
                                    🌐 <strong>Website:</strong> <a href="${shop.website.startsWith("http") ? shop.website : `https://${shop.website}`}" target="_blank" style="color: #2563eb; text-decoration: none;">${shop.website}</a>
                                </div>`
                                : ""
                        }
                        ${
                            shop.taxPin
                                ? `<div style="margin-top: 6px; font-family: monospace; font-size: 11px; color: #64748b;">
                                    🏛️ <strong>KRA Tax PIN:</strong> ${shop.taxPin}
                                </div>`
                                : ""
                        }
                    </div>
                </div>

                <!-- FOOTER -->
                <div style="border-top: 1px solid #e4e4e7; padding-top: 16px; font-size: 10px; color: #94a3b8; font-family: monospace; line-height: 1.5; text-align: center;">
                    <p style="margin: 0 0 2px 0; font-weight: bold; color: #475569; text-transform: uppercase;">
                        ${shop.name}
                    </p>
                    <p style="margin: 0;">
                        Official Digital Quotation &amp; Commercial Catalog Dispatch • Powered by Manna Books
                    </p>
                </div>

            </div>
        `;

        const { error: resendError } = await resend.emails.send({
            from: fromAddress,
            to: [input.recipientEmail.trim()],
            replyTo: shop.email ? shop.email.trim() : undefined,
            subject,
            html,
        });

        if (resendError) {
            console.error("Resend Catalog Dispatch Error:", resendError);
            return { success: false, error: resendError.message || "Failed to dispatch catalog email." };
        }

        return { success: true, message: `Catalog email sent to ${input.recipientEmail.trim()}` };
    } catch (error: any) {
        console.error("Failed to send catalog email:", error);
        return { success: false, error: error.message || "Internal server error dispatching email." };
    }
}
