import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { redirect } from "next/navigation";
import { GeneralLedgerWrapper } from "./GeneralLedgerWrapper";

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

            <GeneralLedgerWrapper
                shopId={shop.id}
                shopSlug={slug}
                glOnboardingMode={Boolean(shop.glOnboardingMode)}
                initialSearch={initialSearch}
            />
        </div>
    );
}
