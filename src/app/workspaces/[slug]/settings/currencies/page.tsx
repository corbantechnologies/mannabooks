import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getShopCurrencies } from "@/lib/actions/currencies";
import { CurrencySettingsClient } from "./CurrencySettingsClient";

interface CurrencySettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CurrencySettingsPage({ params }: CurrencySettingsPageProps) {
  const { slug } = await params;

  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) {
    notFound();
  }

  const currencies = await getShopCurrencies(shop.id, shop.currency || "KES");

  return (
    <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white">
      <CurrencySettingsClient
        shopId={shop.id}
        shopSlug={slug}
        baseCurrency={shop.currency || "KES"}
        currencies={currencies}
      />
    </div>
  );
}
