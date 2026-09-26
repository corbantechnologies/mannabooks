import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getFiscalYearDetails } from "@/lib/actions/fiscal-years";
import FiscalYearDetailClient from "./FiscalYearDetailClient";

export default async function FiscalYearDetailPage({
    params,
}: {
    params: Promise<{ slug: string; id: string }>;
}) {
    const { slug, id } = await params;
    const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
    if (!shop) redirect("/dashboard");

    const result = await getFiscalYearDetails(shop.id, id);
    if (!result.success || !result.data) {
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
                initialData={result.data}
            />
        </div>
    );
}
