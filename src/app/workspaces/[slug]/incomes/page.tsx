import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { enforcePermission } from "@/lib/actions/rbac";
import { getIncomes } from "@/lib/actions/incomes";
import { redirect } from "next/navigation";
import IncomeTrackerClient from "./IncomeTrackerClient";

export default async function IncomesPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const { shop } = await getActiveWorkspaceContext(slug);

    try {
        await enforcePermission(shop.id, "manage_expenses");
    } catch (error) {
        console.error("Permission check failed:", error);
        redirect(`/workspaces/${slug}`);
    }

    const incomesRes = await getIncomes(shop.id);
    const incomesList = (incomesRes.incomes || []).map((i: any) => ({
        id: i.id,
        description: i.description,
        amount: i.amount,
        currency: i.currency || shop.currency || "KES",
        category: i.category,
        incomeDate: typeof i.incomeDate === "string" ? i.incomeDate : (i.incomeDate?.toISOString?.() || new Date().toISOString()),
        attachmentUrl: i.attachmentUrl,
        paymentChannel: i.paymentChannel,
        paymentReference: i.paymentReference
    }));

    return (
        <div className="p-5 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <span className="text-xs text-zinc-400 font-medium">Other Incomes</span>
                    <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Income Tracker</h1>
                </div>
            </div>

            <IncomeTrackerClient shopId={shop.id} currency={shop.currency || "KES"} initialIncomes={incomesList} />
        </div>
    );
}
