import { db } from "@/db";
import { shops, expenses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { enforcePermission } from "@/lib/actions/rbac";
import ExpenseTrackerClient from "./ExpenseTrackerClient";

export default async function ExpensesPage({ params }: { params: { slug: string } }) {
    const shop = await db.query.shops.findFirst({
        where: eq(shops.slug, params.slug)
    });

    if (!shop) {
        redirect("/dashboard");
    }

    let canManageExpenses = false;
    try {
        await enforcePermission(shop.id, "manage_expenses");
        canManageExpenses = true;
    } catch {
        redirect(`/workspaces/${params.slug}`);
    }

    const expensesRaw = await db.query.expenses.findMany({
        where: eq(expenses.shopId, shop.id),
        orderBy: [desc(expenses.expenseDate), desc(expenses.createdAt)]
    });

    const expensesList = expensesRaw.map(e => ({
        id: e.id,
        description: e.description,
        amount: e.amount,
        currency: e.currency,
        category: e.category,
        expenseDate: e.expenseDate.toISOString(),
        receiptUrl: e.receiptUrl
    }));

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-black">Expense Tracker</h1>
                    <p className="text-sm text-zinc-500 font-mono mt-1">Log operating costs to calculate true net profit.</p>
                </div>
            </div>

            <ExpenseTrackerClient shopId={shop.id} shopCurrency={shop.currency} initialExpenses={expensesList} />
        </div>
    );
}
