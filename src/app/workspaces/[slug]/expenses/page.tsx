import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { enforcePermission } from "@/lib/actions/rbac";
import { getExpenses } from "@/lib/actions/expenses";
import { redirect } from "next/navigation";
import ExpenseTrackerClient from "./ExpenseTrackerClient";

export default async function ExpensesPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const { shop } = await getActiveWorkspaceContext(slug);

    try {
        await enforcePermission(shop.id, "manage_expenses");
    } catch (error) {
        console.error("Permission check failed:", error);
        redirect(`/workspaces/${slug}`);
    }

    const expensesRes = await getExpenses(shop.id);
    const expensesList = (expensesRes.expenses || []).map((e: any) => ({
        id: e.id,
        description: e.description,
        amount: e.amount,
        currency: e.currency || shop.currency || "KES",
        category: e.category,
        expenseDate: typeof e.expenseDate === "string" ? e.expenseDate : (e.expenseDate?.toISOString?.() || new Date().toISOString()),
        receiptUrl: e.receiptUrl,
        paymentChannel: e.paymentChannel,
        paymentReference: e.paymentReference,
        isNonDeductible: Boolean(e.isNonDeductible),
    }));

    return (
        <div className="p-5 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <span className="text-xs text-zinc-400 font-medium">Operating Expenses</span>
                    <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Expense Tracker</h1>
                </div>
            </div>

            <ExpenseTrackerClient shopId={shop.id} shopCurrency={shop.currency || "KES"} initialExpenses={expensesList} />
        </div>
    );
}
