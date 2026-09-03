import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getRecurringInvoices } from "@/lib/actions/recurring";
import { RecurringInvoicesClient } from "./RecurringInvoicesClient";

interface RecurringInvoicesPageProps {
  params: Promise<{ slug: string }>;
}

export default async function RecurringInvoicesPage({ params }: RecurringInvoicesPageProps) {
  const { slug } = await params;

  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) {
    notFound();
  }

  const recurringInvoices = await getRecurringInvoices(shop.id);

  return (
    <div className="p-5 sm:p-7 space-y-6">
      <RecurringInvoicesClient
        shopId={shop.id}
        shopSlug={slug}
        currency={shop.currency || "KES"}
        recurringInvoices={recurringInvoices}
      />
    </div>
  );
}
