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

        const res = await apiClient.get<any>(`/v1/catalog/${encodeURIComponent(slug)}`, { params, anonymous: true });
        if (res.data?.success && res.data.shop) {
            return res.data;
        }

        // No fallback to private endpoints: the public catalog must only expose what /v1/catalog returns.
        return { success: false, error: res.error || "Catalog not found." };
    } catch (err: any) {
        return { success: false, error: err.message || "Failed to load catalog." };
    }
}
