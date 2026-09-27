import { db } from "@/db";
import { shops, groupEntities, groupMemberships } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { verifyAndGetSession } from "@/lib/actions/auth";
import { getUserGroups, getConsolidatedPnL, getConsolidatedBalanceSheet, getGroupById } from "@/lib/actions/group-consolidation";
import { GroupConsolidationClient } from "./GroupConsolidationClient";

interface GroupConsolidationPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ groupId?: string }>;
}

export default async function GroupConsolidationPage({
  params,
  searchParams,
}: GroupConsolidationPageProps) {
  const { slug } = await params;
  const { groupId: queryGroupId } = await searchParams;

  const session = await verifyAndGetSession();
  if (!session) {
    redirect("/login");
  }

  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) {
    notFound();
  }

  // Fetch all user's holding groups
  const groups = await getUserGroups(slug);

  // Fetch all user's owned workspaces for subsidiary enrollment
  const userShops = await db.query.shops.findMany({
    where: eq(shops.ownerId, session.user.id),
    orderBy: [asc(shops.name)],
    columns: {
      id: true,
      name: true,
      slug: true,
      code: true,
      currency: true,
    },
  });

  // Determine active group (from URL or first available)
  const activeGroupId = queryGroupId || groups[0]?.id || null;

  let initialPnL = null;
  let initialBalanceSheet = null;
  let activeGroupDetails = null;

  if (activeGroupId) {
    const [pnlRes, bsRes, grpDetails] = await Promise.all([
      getConsolidatedPnL(activeGroupId, "THIS_MONTH"),
      getConsolidatedBalanceSheet(activeGroupId),
      getGroupById(activeGroupId),
    ]);

    if (pnlRes.success) initialPnL = pnlRes.data;
    if (bsRes.success) initialBalanceSheet = bsRes.data;
    activeGroupDetails = grpDetails;
  }

  return (
    <div className="p-5 sm:p-7 space-y-6">
      <div className="space-y-1">
        <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider">Holding Entity & Multi-Tenant Financials</span>
        <h1 className="text-[22px] font-semibold text-zinc-900 leading-tight">Consolidated Group Financials</h1>
        <p className="text-sm text-zinc-500">
          Governs multi-entity corporate structures, consolidates subsidiary P&Ls and Balance Sheets with automated
          Inter-Company Eliminations, and tracks minority non-controlling interests.
        </p>
      </div>

      <GroupConsolidationClient
        shopSlug={slug}
        currentShop={{
          id: shop.id,
          name: shop.name,
          slug: shop.slug,
          currency: shop.currency,
        }}
        groups={groups.map((g) => ({
          id: g.id,
          name: g.name,
          code: g.code,
          reportingCurrency: g.reportingCurrency,
          description: g.description,
          membersCount: g.memberships.length,
          transactionsCount: g.interCompanyTransactions.length,
        }))}
        activeGroupId={activeGroupId}
        activeGroupDetails={
          activeGroupDetails
            ? {
                id: activeGroupDetails.id,
                name: activeGroupDetails.name,
                code: activeGroupDetails.code,
                reportingCurrency: activeGroupDetails.reportingCurrency,
                description: activeGroupDetails.description,
                members: activeGroupDetails.memberships.map((m) => ({
                  id: m.id,
                  shopId: m.shop.id,
                  shopName: m.shop.name,
                  shopSlug: m.shop.slug,
                  shopCode: m.shop.code,
                  entityType: m.entityType,
                  ownershipPercentage: parseFloat(m.ownershipPercentage || "100"),
                  joinedAt: m.joinedAt.toISOString(),
                })),
                transactions: activeGroupDetails.interCompanyTransactions.map((tx) => ({
                  id: tx.id,
                  sourceShopId: tx.sourceShopId,
                  sourceShopName: tx.sourceShop.name,
                  targetShopId: tx.targetShopId,
                  targetShopName: tx.targetShop.name,
                  amount: parseFloat(tx.amount),
                  currency: tx.currency,
                  transactionType: tx.transactionType,
                  isEliminated: tx.isEliminated,
                  notes: tx.notes,
                  createdAt: tx.createdAt.toISOString(),
                })),
              }
            : null
        }
        initialPnL={initialPnL}
        initialBalanceSheet={initialBalanceSheet}
        userShops={userShops}
      />
    </div>
  );
}
