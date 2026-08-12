import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getTurnoverTaxQuarterly } from "@/lib/actions/tax";
import TurnoverTaxClient from "./TurnoverTaxClient";

export default async function TurnoverTaxPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
    if (!shop) redirect("/dashboard");

    if (!shop.isTotActive) {
        return (
            <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white">
                <div className="border-b border-zinc-200/80 pb-6">
                    <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Turnover Tax</span>
                    <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Turnover Tax (TOT) Tracker</h1>
                </div>
                <div className="border border-zinc-200 rounded-xl p-8 text-center max-w-xl mx-auto space-y-4 bg-white">
                    <div className="text-4xl">📊</div>
                    <h3 className="font-sans text-base font-semibold text-black uppercase">Turnover Tax (TOT) is Inactive</h3>
                    <p className="text-xs text-zinc-500 max-w-md mx-auto">
                        To track monthly/quarterly turnover tax (1.5% of gross sales), please enable Turnover Tax under your Tax Profile settings.
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
    const result = await getTurnoverTaxQuarterly(shop.id, year);
    const quarters = result.success ? result.quarters : [];

    return (
        <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white">
            <div className="border-b border-zinc-200/80 pb-6">
                <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Turnover Tax</span>
                <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Turnover Tax (TOT) Tracker</h1>
                <p className="text-sm text-zinc-500 mt-1">
                    Track quarterly Turnover Tax (TOT) liabilities. TOT is assessed at 1.5% of gross sales for small businesses.
                </p>
            </div>

            <TurnoverTaxClient
                shopId={shop.id}
                year={year}
                quarters={quarters}
                currency={shop.currency || "KES"}
            />
        </div>
    );
}
