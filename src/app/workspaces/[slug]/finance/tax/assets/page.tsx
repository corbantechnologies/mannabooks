import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getFixedAssets } from "@/lib/actions/tax";
import FixedAssetsClient from "./FixedAssetsClient";

export default async function FixedAssetsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
    if (!shop) redirect("/dashboard");

    if (!shop.isGlEnabled) redirect(`/workspaces/${slug}/finance/accounts`);

    const assets = await getFixedAssets(shop.id);

    return (
        <div className="p-5 sm:p-7 space-y-6">
            <div className="space-y-2">
                <span className="text-xs text-zinc-400 font-medium">Fixed Assets & Wear-and-Tear</span>
                <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Fixed Assets Register</h1>
                <p className="text-sm text-zinc-500 mt-1">
                    Track capital equipment, compute annual capital allowances, and manage disposals.
                </p>
            </div>

            <FixedAssetsClient
                shopId={shop.id}
                shopSlug={slug}
                initialAssets={assets.map(a => ({
                    id: a.id,
                    name: a.name,
                    assetClass: a.assetClass,
                    purchaseDate: a.purchaseDate,
                    purchaseCost: a.purchaseCost,
                    taxWdv: a.taxWdv,
                    scrapValue: a.scrapValue,
                    isDisposed: a.isDisposed,
                    disposalDate: a.disposalDate,
                    disposalProceeds: a.disposalProceeds,
                }))}
                currency={shop.currency || "KES"}
            />
        </div>
    );
}
