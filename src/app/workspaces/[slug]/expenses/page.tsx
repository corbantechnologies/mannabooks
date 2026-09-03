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
        paymentReference: e.paymentReference,
        isNonDeductible: e.isNonDeductible,
    }));

    return (
        <div className="p-5 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <span className="text-xs text-zinc-400 font-medium">Operating Expenses</span>
                    <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Expense Tracker</h1>
                </div>
            </div>

            <ExpenseTrackerClient shopId={shop.id} shopCurrency={shop.currency} initialExpenses={expensesList} />
        </div>
    );
}
