// src/types/catalog.ts
/**
 * Pure TypeScript domain definitions for Public Catalog & Quotations.
 */

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
