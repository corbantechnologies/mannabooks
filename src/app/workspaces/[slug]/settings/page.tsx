// src/app/workspaces/[slug]/settings/page.tsx
import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { getShopPaymentMethods } from "@/lib/actions/payments";
import { getShopTerms } from "@/lib/actions/terms";
import { SettingsForm } from "./SettingsForm";

import Link from "next/link";

interface SettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceSettingsPage({ params }: SettingsPageProps) {
  const { slug } = await params;

  // Fetch context server-side — avoids the client useEffect + redirect() issue
  const { shop } = await getActiveWorkspaceContext(slug);
  const paymentMethods = await getShopPaymentMethods(shop.id);
  const shopTerms = await getShopTerms(shop.id);

  return (
    <div className="p-4 sm:p-8 max-w-7xl space-y-8 selection:bg-black selection:text-white font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-100 pb-4">
        <div>
          <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">System Configuration</span>
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tighter mt-1 text-black">Workspace Settings</h1>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <Link
            href={`/workspaces/${slug}/team`}
            className="px-3.5 py-1.5 bg-black text-white hover:bg-zinc-800 rounded transition-colors"
          >
            👥 Staff &amp; Permissions →
          </Link>
          <Link
            href={`/workspaces/${slug}/settings/billing`}
            className="px-3.5 py-1.5 border border-zinc-300 hover:border-black rounded transition-colors text-zinc-700 hover:text-black"
          >
            ⚡ Billing &amp; Plan
          </Link>
          <Link
            href={`/workspaces/${slug}/settings/currencies`}
            className="px-3.5 py-1.5 border border-zinc-300 hover:border-black rounded transition-colors text-zinc-700 hover:text-black"
          >
            💱 Multi-Currency
          </Link>
        </div>
      </div>

      <SettingsForm
        shopId={shop.id}
        shopSlug={slug}
        initialName={shop.name}
        initialShortName={shop.shortName || ""}
        initialCode={shop.code || ""}
        initialPhone={shop.phone || ""}
        initialWebsite={shop.website || ""}
        initialPrimaryColor={shop.primaryColor || "#000000"}
        initialLogoUrl={shop.logoUrl || ""}
        initialTaxPin={shop.taxPin || ""}
        initialEmail={shop.email || ""}
        initialIsVatRegistered={shop.isVatRegistered}
        initialVatNumber={shop.vatNumber || ""}
        initialCurrency={shop.currency}
        initialFiscalYearStartMonth={shop.fiscalYearStartMonth}
        paymentMethods={paymentMethods}
        initialTerms={shopTerms}
      />
    </div>
  );
}
