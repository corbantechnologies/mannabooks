// src/app/workspaces/[slug]/clients/[id]/statement/page.tsx
import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { redirect } from "next/navigation";
import ClientStatementView from "./ClientStatementView";

export default async function ClientStatementPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string; id: string }>;
    searchParams: Promise<{ start?: string; end?: string }>;
}) {
    const { slug, id } = await params;
    const { start, end } = await searchParams;

    const { shop } = await getActiveWorkspaceContext(slug);
    if (!shop) redirect("/dashboard");

    return (
        <div className="p-5 sm:p-7 space-y-6">
            <ClientStatementView
                shopId={shop.id}
                shopSlug={slug}
                clientId={id}
                initialData={null}
                shopName={shop.name}
                shopPhone={shop.phone}
                shopEmail={shop.email}
                shopTaxPin={shop.taxPin}
                initialStart={start}
                initialEnd={end}
            />
        </div>
    );
}
