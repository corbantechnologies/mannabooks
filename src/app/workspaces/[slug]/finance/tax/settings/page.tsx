export const dynamic = 'force-dynamic';

import { db } from "@/db";
import { shops, fiscalYears } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import TaxSettingsClient from "./TaxSettingsClient";

export default async function TaxSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
    if (!shop) redirect("/dashboard");

    const years = await db.query.fiscalYears.findMany({
        where: eq(fiscalYears.shopId, shop.id),
        orderBy: (f, { desc }) => [desc(f.startDate)],
    });

    return (
        <div className="p-5 sm:p-7 space-y-6">
            <div className="space-y-2">
                <span className="text-xs text-zinc-400 font-medium">Tax Configurations</span>
                <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Tax Profile & Settings</h1>
                <p className="text-sm text-zinc-500 mt-1">Configure your workspace's tax regime, rates, and active Fiscal Years for KRA compliance.</p>
            </div>

            <TaxSettingsClient
                shopId={shop.id}
                shopSlug={slug}
                isGlEnabled={shop.isGlEnabled}
                initialFiscalYears={years.map(y => ({
                    id: y.id,
                    label: y.label,
                    startDate: y.startDate,
                    endDate: y.endDate,
                    isClosed: y.isClosed,
                }))}
                initialSettings={{
                    isCitActive: shop.isCitActive,
                    isTotActive: shop.isTotActive,
                    citRate: parseFloat(shop.citRate || "30.00"),
                    estimatedAnnualProfit: parseFloat(shop.estimatedAnnualProfit || "0.00"),
                }}
            />
        </div>
    );
}
