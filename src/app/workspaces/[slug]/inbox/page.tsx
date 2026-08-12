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
    <div className="p-4 sm:p-8 space-y-10 selection:bg-black selection:text-white font-mono text-xs">
      
      {/* HEADER TITLE */}
      <div className="border-b border-zinc-200/80 pb-6 space-y-1">
        <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">B2B Shared Inbox</span>
        <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">
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
