import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getCashFlowStatement } from "@/lib/actions/reports";
import CashFlowClient from "./CashFlowClient";

export default async function CashFlowPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
    if (!shop) redirect("/dashboard");

    const result = await getCashFlowStatement(shop.id, "THIS_MONTH");
    const data = result.success ? result.data : null;

    return (
        <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white">
            <div className="border-b border-zinc-200/80 pb-6">
                <span className="font-mono text-xs text-zinc-400 font-semibold">FINANCE // REPORTS</span>
                <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Cash Flow Statement</h1>
                <p className="text-sm text-zinc-500 mt-1">A structured view of cash movement across operating and investing activities.</p>
            </div>
            <CashFlowClient shopId={shop.id} initialData={data} currency={shop.currency || "KES"} />
        </div>
    );
}
