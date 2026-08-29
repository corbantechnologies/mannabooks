import { db } from "@/db";
import { shops, clients } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getClientStatement } from "@/lib/actions/reports";
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

    const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
    if (!shop) redirect("/dashboard");

    const client = await db.query.clients.findFirst({
        where: and(eq(clients.id, id), eq(clients.shopId, shop.id)),
    });
    if (!client) notFound();

    const startDate = start ? new Date(start + "T00:00:00") : undefined;
    const endDate = end ? new Date(end + "T23:59:59") : undefined;

    const result = await getClientStatement(shop.id, client.id, startDate, endDate);
    const data = result.success ? result.data : null;

    return (
        <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white">
            <ClientStatementView
                shopId={shop.id}
                shopSlug={slug}
                clientId={client.id}
                initialData={data}
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
