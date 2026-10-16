export const dynamic = 'force-dynamic';

import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { redirect } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import TaxSettingsClient from "./TaxSettingsClient";

export default async function TaxSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const { shop } = await getActiveWorkspaceContext(slug);
    if (!shop) redirect("/dashboard");

    const res = await apiClient<{ success: boolean; fiscalYears: any[] }>(`/v1/accounts/fiscal-years?shop_id=${shop.id}`);
    const years = (res.data?.fiscalYears || []).map((y: any) => ({
        id: y.id,
        label: y.label,
        startDate: y.startDate,
        endDate: y.endDate,
        isClosed: y.isClosed,
    }));

    return (
        <div className="p-5 sm:p-7 space-y-6">
            <div className="space-y-2">
                <span className="text-xs text-zinc-400 font-medium">Tax Configurations</span>
                <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Tax Profile & Settings</h1>
                <p className="text-sm text-zinc-500 mt-1">Configure your workspace&apos;s tax regime, rates, and active Fiscal Years for KRA compliance.</p>
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
