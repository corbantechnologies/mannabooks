// src/app/workspaces/[slug]/settings/page.tsx
import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { getShopPaymentMethods } from "@/lib/actions/payments";
import { SettingsForm } from "./SettingsForm";

interface SettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceSettingsPage({ params }: SettingsPageProps) {
  const { slug } = await params;

  // Fetch context server-side — avoids the client useEffect + redirect() issue
  const { shop } = await getActiveWorkspaceContext(slug);
  const paymentMethods = await getShopPaymentMethods(shop.id);

  return (
    <div className="p-8 max-w-7xl space-y-8 selection:bg-black selection:text-white">
      <div>
        <span className="font-mono text-xs text-zinc-400 uppercase">SYS_PROPERTIES // ENVIRONMENT_CONFIG</span>
        <h1 className="text-3xl font-bold uppercase tracking-tighter mt-1">Compliance &amp; Profile</h1>
      </div>

      <SettingsForm
        shopId={shop.id}
        shopSlug={slug}
        initialName={shop.name}
        initialShortName={shop.shortName || ""}
        initialPhone={shop.phone || ""}
        initialWebsite={shop.website || ""}
        initialPrimaryColor={shop.primaryColor || "#000000"}
        initialLogoUrl={shop.logoUrl || ""}
        initialTaxPin={shop.taxPin || ""}
        initialIsVatRegistered={shop.isVatRegistered}
        initialCurrency={shop.currency}
        paymentMethods={paymentMethods}
      />
    </div>
  );
}
