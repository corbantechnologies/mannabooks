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

    const years = shop.isGlEnabled ? await db.query.fiscalYears.findMany({
        where: eq(fiscalYears.shopId, shop.id),
        orderBy: (f, { desc }) => [desc(f.startDate)],
    }) : [];

    return (
        <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white">
            <div className="border-b border-zinc-200/80 pb-6">
                <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Tax Configurations</span>
                <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Tax Profile & Settings</h1>
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
