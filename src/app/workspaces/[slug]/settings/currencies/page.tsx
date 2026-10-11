import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { apiClient } from "@/lib/api/client";
import { CurrencySettingsClient } from "./CurrencySettingsClient";

interface CurrencySettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CurrencySettingsPage({ params }: CurrencySettingsPageProps) {
  const { slug } = await params;
  const { shop } = await getActiveWorkspaceContext(slug);

  const res = await apiClient.get<any>(`/v1/workspaces/${shop.id}/currencies`);
  const currencies = res.data?.currencies || (Array.isArray(res.data) ? res.data : []);

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
