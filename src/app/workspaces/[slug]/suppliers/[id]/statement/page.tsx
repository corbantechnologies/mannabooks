import { db } from "@/db";
import { shops, suppliers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getSupplierStatement } from "@/lib/actions/reports";
import SupplierStatementView from "./SupplierStatementView";

export default async function SupplierStatementPage({
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

    const supplier = await db.query.suppliers.findFirst({
        where: and(eq(suppliers.id, id), eq(suppliers.shopId, shop.id)),
    });
    if (!supplier) notFound();

    const startDate = start ? new Date(start + "T00:00:00") : undefined;
    const endDate = end ? new Date(end + "T23:59:59") : undefined;

    const result = await getSupplierStatement(shop.id, supplier.id, startDate, endDate);
    const data = result.success ? result.data : null;

    return (
        <div className="p-5 sm:p-7 space-y-6">
            <SupplierStatementView
                shopId={shop.id}
                shopSlug={slug}
                supplierId={supplier.id}
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
