import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getBudgetsWithActuals } from "@/lib/actions/budgets";
import BudgetsClient from "./BudgetsClient";

export default async function BudgetsPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ month?: string; year?: string }>;
}) {
    const { slug } = await params;
    const { month: qMonth, year: qYear } = await searchParams;

    const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
    if (!shop) redirect("/dashboard");

    const now = new Date();
    const parsedMonth = qMonth ? parseInt(qMonth, 10) : now.getMonth() + 1;
    const parsedYear = qYear ? parseInt(qYear, 10) : now.getFullYear();

    const month = (!isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) ? parsedMonth : now.getMonth() + 1;
    const year = (!isNaN(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100) ? parsedYear : now.getFullYear();

    const budgetLines = shop.isGlEnabled ? await getBudgetsWithActuals(shop.id, month, year) : [];

    return (
        <div className="p-5 sm:p-7 space-y-6">
            <div className="space-y-2">
                <span className="text-xs text-zinc-400 font-medium">Operating Budgets</span>
                <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Monthly Budgets</h1>
                <p className="text-sm text-zinc-500 mt-1">
                    Set monthly spending limits per expense category. Alerts fire at 80% and 100%.
                </p>
            </div>
            <BudgetsClient
                shopId={shop.id}
                shopSlug={slug}
                isGlEnabled={shop.isGlEnabled}
                month={month}
                year={year}
                currency={shop.currency || "KES"}
                lines={budgetLines}
            />
        </div>
    );
}
