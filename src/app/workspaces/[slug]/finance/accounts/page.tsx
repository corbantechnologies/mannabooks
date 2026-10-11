import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { redirect } from "next/navigation";
import { ChartOfAccountsWrapper } from "./ChartOfAccountsWrapper";

export default async function ChartOfAccountsPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const { shop } = await getActiveWorkspaceContext(slug);
    if (!shop) redirect("/dashboard");

    return (
        <ChartOfAccountsWrapper
            shopId={shop.id}
            shopSlug={slug}
            currency={shop.currency}
            isGlEnabled={Boolean(shop.isGlEnabled)}
            glOnboardingMode={Boolean(shop.glOnboardingMode)}
        />
    );
}
