import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getTaxComputation } from "@/lib/actions/tax";
import TaxComputationClient from "./TaxComputationClient";

export default async function TaxComputationPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
    if (!shop) redirect("/dashboard");

    if (!shop.isCitActive) {
        return (
            <div className="p-5 sm:p-7 space-y-6">
                <div className="space-y-2">
                    <span className="text-xs text-zinc-400 font-medium">Corporate Tax Liability</span>
                    <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Corporate Tax Computation</h1>
                </div>
                <div className="border border-zinc-200 rounded-xl p-8 text-center max-w-xl mx-auto space-y-4 bg-white">
                    <div className="text-4xl">📝</div>
                    <h3 className="font-sans text-base font-semibold text-black uppercase">Corporate Tax Computation is Inactive</h3>
                    <p className="text-xs text-zinc-500 max-w-md mx-auto">
                        To compute your annual corporate income tax liability (CIT), please enable CIT under your Tax Profile settings.
                    </p>
                    <div className="pt-2">
                        <a href={`/workspaces/${slug}/finance/tax/settings`} className="inline-block bg-black text-white px-5 py-2.5 rounded-lg text-xs font-mono font-bold uppercase hover:bg-zinc-800 transition-colors">
                            Configure Tax Profile
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    const year = new Date().getFullYear();
    const result = await getTaxComputation(shop.id, year);
    const data = result.success ? result.data : null;

    return (
        <div className="p-5 sm:p-7 space-y-6">
            <div className="space-y-2">
                <span className="text-xs text-zinc-400 font-medium">Corporate Tax Liability</span>
                <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Corporate Tax Computation</h1>
                <p className="text-sm text-zinc-500 mt-1">
                    KRA corporate income tax computation based on P&L statement, non-deductible add-backs, and capital allowances.
                </p>
            </div>

            <TaxComputationClient
                shopId={shop.id}
                year={year}
                currency={shop.currency || "KES"}
                initialData={data}
            />
        </div>
    );
}
