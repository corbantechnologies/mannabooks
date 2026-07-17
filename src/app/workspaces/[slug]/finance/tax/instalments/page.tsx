import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getTaxInstalments } from "@/lib/actions/tax";
import InstalmentsClient from "./InstalmentsClient";

export default async function InstalmentsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
    if (!shop) redirect("/dashboard");

    if (!shop.isCitActive) {
        return (
            <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white">
                <div className="border-b border-zinc-200/80 pb-6">
                    <span className="font-mono text-xs text-zinc-400 font-semibold">FINANCE // TAX // INSTALMENTS</span>
                    <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Instalment Tax Schedule</h1>
                </div>
                <div className="border border-zinc-200 rounded-xl p-8 text-center max-w-xl mx-auto space-y-4 bg-white">
                    <div className="text-4xl">💰</div>
                    <h3 className="font-sans text-base font-semibold text-black uppercase">Instalment Tax (CIT) is Inactive</h3>
                    <p className="text-xs text-zinc-500 max-w-md mx-auto">
                        To manage corporate income tax instalments, please enable CIT under your Tax Profile settings.
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
    const instalments = await getTaxInstalments(shop.id, year);

    // Compute estimated annual tax liability to check KES 30,000 threshold
    const estProfit = parseFloat(shop.estimatedAnnualProfit || "0");
    const citRate = parseFloat(shop.citRate || "30.00") / 100;
    const estTax = estProfit * citRate;
    const instalmentsRequired = estTax >= 30000;

    return (
        <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white">
            <div className="border-b border-zinc-200/80 pb-6">
                <span className="font-mono text-xs text-zinc-400 font-semibold">FINANCE // TAX // INSTALMENTS</span>
                <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Instalment Tax Schedule</h1>
                <p className="text-sm text-zinc-500 mt-1">
                    Manage your quarterly instalment tax schedule. Required if estimated tax liability is KES 30,000 or more.
                </p>
            </div>

            <InstalmentsClient
                shopId={shop.id}
                shopSlug={slug}
                year={year}
                estimatedTax={estTax}
                instalmentsRequired={instalmentsRequired}
                initialInstalments={instalments.map(i => ({
                    id: i.id,
                    instalmentNumber: i.instalmentNumber,
                    dueDate: i.dueDate,
                    estimatedAmount: i.estimatedAmount,
                    paidAmount: i.paidAmount,
                    paidAt: i.paidAt?.toISOString() || null,
                    paymentReference: i.paymentReference,
                    status: i.status as "PENDING" | "PAID" | "OVERDUE",
                }))}
                currency={shop.currency || "KES"}
            />
        </div>
    );
}
