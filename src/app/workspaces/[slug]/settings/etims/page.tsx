// src/app/workspaces/[slug]/settings/etims/page.tsx
import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { EtimsSettingsClient } from "./EtimsSettingsClient";
import Link from "next/link";

interface EtimsSettingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EtimsSettingsPage({ params }: EtimsSettingsPageProps) {
  const { slug } = await params;
  const { shop } = await getActiveWorkspaceContext(slug);

  return (
    <div className="p-4 sm:p-8 max-w-5xl space-y-8 font-sans selection:bg-black selection:text-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-bold uppercase tracking-wider">
            <Link href={`/workspaces/${slug}/settings`} className="hover:text-black transition-colors">Settings</Link>
            <span>/</span>
            <span>Tax Compliance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight mt-1 text-black">
            🇰🇪 KRA eTIMS Fiscal Integration
          </h1>
        </div>
        <Link
          href={`/workspaces/${slug}/settings`}
          className="text-xs font-semibold px-3 py-1.5 border border-zinc-300 hover:border-black rounded transition-colors"
        >
          ← Back to Settings
        </Link>
      </div>

      <EtimsSettingsClient
        shopId={shop.id}
        shopSlug={slug}
        initialTaxPin={shop.taxPin || ""}
        initialShopName={shop.name}
      />
    </div>
  );
}
