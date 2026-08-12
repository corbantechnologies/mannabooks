import { db } from "@/db";
import { shops, incomes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { enforcePermission } from "@/lib/actions/rbac";
import IncomeTrackerClient from "./IncomeTrackerClient";

export default async function IncomesPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const shop = await db.query.shops.findFirst({
        where: eq(shops.slug, slug)
    });

    if (!shop) {
        redirect("/dashboard");
    }

    try {
        await enforcePermission(shop.id, "manage_expenses");
    } catch (error) {
        console.error("Permission check failed:", error);
        redirect(`/workspaces/${slug}`);
    }

    const incomesRaw = await db.query.incomes.findMany({
        where: eq(incomes.shopId, shop.id),
        orderBy: [desc(incomes.incomeDate), desc(incomes.createdAt)]
    });

    const incomesList = incomesRaw.map(i => ({
        id: i.id,
        description: i.description,
        amount: i.amount,
        currency: i.currency,
        category: i.category,
        incomeDate: i.incomeDate.toISOString(),
        attachmentUrl: i.attachmentUrl,
        paymentChannel: i.paymentChannel,
        paymentReference: i.paymentReference
    }));

    return (
        <div className="p-4 sm:p-8 space-y-12 selection:bg-black selection:text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/80 pb-6">
                <div>
                    <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Other Incomes</span>
                    <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Income Tracker</h1>
                </div>
            </div>

            <IncomeTrackerClient shopId={shop.id} currency={shop.currency || "KES"} initialIncomes={incomesList} />
        </div>
    );
}
