import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { CashbookClient } from "@/components/CashbookClient";

export default async function IncomesPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const { shop } = await getActiveWorkspaceContext(slug);

    return <CashbookClient kind="income" shopId={shop.id} shopSlug={slug} currency={shop.currency || "KES"} />;
}
