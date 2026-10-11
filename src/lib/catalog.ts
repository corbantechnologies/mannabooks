import { apiClient } from "@/lib/api/client";
import { decodeCatalogToken, encodeCatalogToken } from "@/lib/catalog-token";
import type { PublicCatalogItem, PublicShopProfile, PublicShopTerm } from "@/types/catalog";

export { decodeCatalogToken, encodeCatalogToken };

export async function getPublicCatalogData(slug: string, search?: string, itemIds?: string[]): Promise<{
    success: boolean;
    shop?: PublicShopProfile;
    products?: PublicCatalogItem[];
    terms?: PublicShopTerm[];
    error?: string;
}> {
    try {
        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (itemIds && itemIds.length > 0) params.item_ids = itemIds.join(",");

        const res = await apiClient.get<any>(`/v1/catalog/${slug}`, { params });
        if (res.data?.success && res.data.shop) {
            return res.data;
        }

        // Fallback: fetch workspace context and products from backend
        const contextRes = await apiClient.get<any>(`/v1/workspaces/by-slug/${slug}/context`);
        const shop = contextRes.data?.shop;
        if (!shop) {
            return { success: false, error: "Workspace not found." };
        }

        const productsRes = await apiClient.get<any>(`/v1/products`, {
            params: { shop_id: shop.id }
        });
        let allProducts: any[] = Array.isArray(productsRes.data) ? productsRes.data : productsRes.data?.items || [];

        if (itemIds && itemIds.length > 0) {
            const itemSet = new Set(itemIds);
            allProducts = allProducts.filter((p) => itemSet.has(p.id));
        }

        if (search && search.trim() !== "") {
            const q = search.toLowerCase().trim();
            allProducts = allProducts.filter(
                (p) =>
                    (p.name && p.name.toLowerCase().includes(q)) ||
                    (p.sku && p.sku.toLowerCase().includes(q))
            );
        }

        const publicProducts: PublicCatalogItem[] = allProducts.map((p) => ({
            id: p.id,
            name: p.name,
            sku: p.sku || null,
            itemType: p.itemType || p.item_type || "PRODUCT",
            unitPrice: parseFloat(String(p.unitPrice || p.unit_price || "0")),
            defaultTaxType: p.defaultTaxType || p.default_tax_type || "V_16",
            trackStock: Boolean(p.trackStock ?? p.track_stock),
            stockQuantity: parseFloat(String(p.stockQuantity || p.stock_quantity || "0")),
        }));

        const publicShop: PublicShopProfile = {
            id: shop.id,
            name: shop.name,
            shortName: shop.shortName || shop.short_name || null,
            slug: shop.slug,
            currency: shop.currency || "KES",
            phone: shop.phone || null,
            email: shop.email || null,
            website: shop.website || null,
            logoUrl: shop.logoUrl || shop.logo_url || null,
            primaryColor: shop.primaryColor || shop.primary_color || "#000000",
            taxPin: shop.taxPin || shop.tax_pin || null,
            isVatRegistered: Boolean(shop.isVatRegistered ?? shop.is_vat_registered),
        };

        return {
            success: true,
            shop: publicShop,
            products: publicProducts,
            terms: [],
        };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to load catalog." };
    }
}
