import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getPLStatement } from "@/lib/actions/reports";
import PLStatementClient from "./PLStatementClient";

export default async function PLStatementPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
    if (!shop) redirect("/dashboard");

    const result = await getPLStatement(shop.id, "THIS_MONTH");
    const data = result.success ? result.data : null;

    return (
        <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white">
            <div className="border-b border-zinc-200/80 pb-6">
                <span className="font-mono text-xs text-zinc-400 font-semibold">FINANCE // REPORTS</span>
                <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Profit & Loss Statement</h1>
                <p className="text-sm text-zinc-500 mt-1">Formal income statement for your accountant. Exportable as PDF and CSV.</p>
            </div>
            <PLStatementClient shopId={shop.id} shopSlug={slug} initialData={data} currency={shop.currency || "KES"} />
        </div>
    );
}
