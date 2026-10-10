import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { apiClient } from "@/lib/api/client";
import { redirect } from "next/navigation";
import GeneralLedgerClient from "./GeneralLedgerClient";

export default async function GeneralLedgerPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams?: Promise<{ search?: string }>;
}) {
    const { slug } = await params;
    const resolvedSearchParams = searchParams ? await searchParams : undefined;
    const initialSearch = resolvedSearchParams?.search || "";
    const { shop } = await getActiveWorkspaceContext(slug);
    if (!shop) redirect("/dashboard");

    if (!shop.isGlEnabled) redirect(`/workspaces/${slug}/finance/accounts`);

    const [accRes, entriesRes, ccRes] = await Promise.all([
        apiClient.get<any[]>(`/v1/accounts?shop_id=${shop.id}`),
        apiClient.get<any>(`/v1/accounts/journal-entries?shop_id=${shop.id}&limit=200`),
        apiClient.get<any>(`/v1/operations/cost-centers?shop_id=${shop.id}`),
    ]);

    const accounts: any[] = accRes.data || [];
    const entries: any[] = entriesRes.data?.entries || [];
    const shopCostCenters: any[] = ccRes.data?.costCenters || [];

    return (
        <div className="p-5 sm:p-7 space-y-6">
            <div className="space-y-2">
                <span className="text-xs text-zinc-400 font-medium">Journal Entries</span>
                <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Journal Entries</h1>
                <p className="text-sm text-zinc-500 mt-1">
                    Complete double-entry journal. Use <strong>Post Manual Entry</strong> to record historical transactions
                    (e.g. Railway, Google Cloud subscriptions paid before Manna Books go-live).
                </p>
            </div>

            <GeneralLedgerClient
                shopId={shop.id}
                shopSlug={slug}
                glOnboardingMode={shop.glOnboardingMode}
                initialSearch={initialSearch}
                accounts={accounts.map((a: any) => ({
                    id: a.id,
                    code: a.code,
                    name: a.name,
                    accountType: a.accountType || a.account_type,
                }))}
                costCenters={shopCostCenters.map((c: any) => ({
                    id: c.id,
                    code: c.code,
                    name: c.name,
                }))}
                entries={entries.map((e: any) => ({
                    id: e.id,
                    entryDate: typeof e.entryDate === "string" ? e.entryDate : (e.entryDate?.toISOString?.() || ""),
                    description: e.description,
                    debitAccountCode: e.debitAccountCode || "",
                    debitAccountName: e.debitAccountName || "",
                    creditAccountCode: e.creditAccountCode || "",
                    creditAccountName: e.creditAccountName || "",
                    amount: String(e.amount),
                    sourceType: e.sourceType,
                    periodName: e.periodName || null,
                    isBackdated: Boolean(e.isBackdated),
                    backdatedReason: e.backdatedReason || null,
                    createdByName: e.createdByName || null,
                    costCenterCode: e.costCenterCode || null,
                    costCenterName: e.costCenterName || null,
                }))}
            />
        </div>
    );
}

