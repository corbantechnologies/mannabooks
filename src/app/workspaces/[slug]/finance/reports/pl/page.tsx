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
        <div className="p-5 sm:p-7 space-y-6">
            <div className="space-y-2">
                <span className="text-xs text-zinc-400 font-medium">Profit & Loss Statement</span>
                <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Profit & Loss Statement</h1>
                <p className="text-sm text-zinc-500 mt-1">Formal income statement for your accountant. Exportable as PDF and CSV.</p>
            </div>
            <PLStatementClient shopId={shop.id} shopSlug={slug} initialData={data} currency={shop.currency || "KES"} />
        </div>
    );
}
