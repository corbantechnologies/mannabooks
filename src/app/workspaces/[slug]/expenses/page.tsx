import { db } from "@/db";
import { shops, expenses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { enforcePermission } from "@/lib/actions/rbac";
import ExpenseTrackerClient from "./ExpenseTrackerClient";

export default async function ExpensesPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const shop = await db.query.shops.findFirst({
        where: eq(shops.slug, slug)
    });

    if (!shop) {
        redirect("/dashboard");
    }

    let canManageExpenses = false;
    try {
        await enforcePermission(shop.id, "manage_expenses");
        canManageExpenses = true;
    } catch (error) {
        console.error("Permission check failed:", error);
        redirect(`/workspaces/${slug}`);
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
        receiptUrl: e.receiptUrl,
        paymentChannel: e.paymentChannel,
        paymentReference: e.paymentReference
    }));

    return (
        <div className="p-4 sm:p-8 space-y-12 selection:bg-black selection:text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/80 pb-6">
                <div>
                    <span className="font-mono text-xs text-zinc-400 font-semibold">FINANCIALS // OPERATING_EXPENSES</span>
                    <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Expense Tracker</h1>
                </div>
            </div>

            <ExpenseTrackerClient shopId={shop.id} shopCurrency={shop.currency} initialExpenses={expensesList} />
        </div>
    );
}
