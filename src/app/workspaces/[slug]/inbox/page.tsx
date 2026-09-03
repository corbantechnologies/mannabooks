// src/app/workspaces/[slug]/inbox/page.tsx
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { getB2BInboxDocuments } from "@/lib/actions/b2b";
import { B2BInboxClient } from "./B2BInboxClient";

interface B2BInboxPageProps {
  params: Promise<{ slug: string }>;
}

export default async function B2BInboxPage({ params }: B2BInboxPageProps) {
  const { slug } = await params;

  // 1. Authenticate user session and retrieve active shop context
  const { shop, user } = await getActiveWorkspaceContext(slug);

  if (!shop) {
    notFound();
  }

  // 2. Fetch B2B Inbox documents
  const inboxData = await getB2BInboxDocuments(shop.id);

  return (
    <div className="p-5 sm:p-7 space-y-6 font-mono text-xs">
      
      {/* HEADER TITLE */}
      <div className="space-y-1">
        <span className="text-xs text-zinc-400 font-medium">B2B Shared Inbox</span>
        <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">
          Shared Inbox
        </h1>
        <p className="font-sans text-xs text-zinc-600">
          Review incoming bills, price quotes, and purchase orders dispatched to your business PIN from other Mannabooks members.
        </p>
      </div>

      <B2BInboxClient
        shopId={shop.id}
        shopSlug={slug}
        shopName={shop.name}
        shopTaxPin={shop.taxPin}
        initialBills={inboxData.incomingBills}
        initialOrders={inboxData.incomingOrders}
      />

    </div>
  );
}
