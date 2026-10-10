import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { getShopCurrencies } from "@/lib/actions/currencies";
import { CurrencySettingsClient } from "./CurrencySettingsClient";

interface CurrencySettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CurrencySettingsPage({ params }: CurrencySettingsPageProps) {
  const { slug } = await params;
  const { shop } = await getActiveWorkspaceContext(slug);

  const currencies = await getShopCurrencies(shop.id, shop.currency || "KES");

  return (
    <div className="p-5 sm:p-7 space-y-6">
      <CurrencySettingsClient
        shopId={shop.id}
        shopSlug={slug}
        baseCurrency={shop.currency || "KES"}
        currencies={currencies}
      />
    </div>
  );
}
