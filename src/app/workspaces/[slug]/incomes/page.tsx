import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import IncomeTrackerClient from "./IncomeTrackerClient";

export default async function IncomesPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const { shop } = await getActiveWorkspaceContext(slug);

    return (
        <div className="p-5 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <span className="text-xs text-zinc-400 font-medium">Other Incomes</span>
                    <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Income Tracker</h1>
                </div>
            </div>

            <IncomeTrackerClient shopId={shop.id} currency={shop.currency || "KES"} />
        </div>
    );
}
