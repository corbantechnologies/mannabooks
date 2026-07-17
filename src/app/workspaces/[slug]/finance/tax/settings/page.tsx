import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import TaxSettingsClient from "./TaxSettingsClient";

export default async function TaxSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
    if (!shop) redirect("/dashboard");

    return (
        <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white">
            <div className="border-b border-zinc-200/80 pb-6">
                <span className="font-mono text-xs text-zinc-400 font-semibold">FINANCE // TAX // SETTINGS</span>
                <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Tax Profile & Settings</h1>
                <p className="text-sm text-zinc-500 mt-1">Configure your workspace's tax regime and rates for KRA compliance.</p>
            </div>

            <TaxSettingsClient
                shopId={shop.id}
                shopSlug={slug}
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
