// src/app/workspaces/[slug]/inventory/transfers/[id]/page.tsx
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getStockTransfer } from "@/lib/actions/stock-transfers";
import { TransferDetailClient } from "./TransferDetailClient";

interface TransferDetailPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function TransferDetailPage({ params }: TransferDetailPageProps) {
  const { slug, id } = await params;

  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (!shop) notFound();

  const transfer = await getStockTransfer(id);
  if (!transfer || transfer.shopId !== shop.id) notFound();

  return (
    <TransferDetailClient
      transfer={transfer}
      shopSlug={slug}
      shopCurrency={shop.currency}
    />
  );
}
