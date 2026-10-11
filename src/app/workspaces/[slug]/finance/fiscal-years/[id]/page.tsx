import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { redirect } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import FiscalYearDetailClient from "./FiscalYearDetailClient";

export default async function FiscalYearDetailPage({
    params,
}: {
    params: Promise<{ slug: string; id: string }>;
}) {
    const { slug, id } = await params;
    const { shop } = await getActiveWorkspaceContext(slug);
    if (!shop) redirect("/dashboard");

    const result = await apiClient.get<any>(`/v1/accounts/fiscal-years/${id}`, {
        params: { shop_id: shop.id },
    });
    const fyData = result.data?.data || (result.data?.fiscalYear ? result.data : null);
    if (!fyData) {
        redirect(`/workspaces/${slug}/finance/tax/settings`);
    }

    return (
        <div className="p-5 sm:p-7 space-y-6">
            <FiscalYearDetailClient
                shopId={shop.id}
                shopSlug={slug}
                currency={shop.currency || "KES"}
                isGlEnabled={shop.isGlEnabled}
                glOnboardingMode={shop.glOnboardingMode}
                initialData={fyData}
            />
        </div>
    );
}
