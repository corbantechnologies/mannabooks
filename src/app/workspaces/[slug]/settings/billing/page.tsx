import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getShopBillingData } from "@/lib/actions/billing";
import { BillingSettingsClient } from "./BillingSettingsClient";

export const dynamic = "force-dynamic";

interface BillingSettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BillingSettingsPage({ params }: BillingSettingsPageProps) {
  const { slug } = await params;

  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) {
    notFound();
  }

  const billingDataRes = await getShopBillingData(shop.id);

  if (!billingDataRes.success || !billingDataRes.planDetails) {
    return (
      <div className="p-8 max-w-4xl mx-auto font-mono text-xs text-rose-900 bg-rose-50 border border-rose-200 rounded-xl">
        <h2 className="font-bold text-sm mb-1">⚠️ Error Loading Billing Information</h2>
        <p>{billingDataRes.error || "Failed to load workspace billing details."}</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      <BillingSettingsClient
        shop={shop}
        planDetails={billingDataRes.planDetails}
        availablePlans={billingDataRes.availablePlans || []}
        transactions={billingDataRes.transactions || []}
      />
    </div>
  );
}
