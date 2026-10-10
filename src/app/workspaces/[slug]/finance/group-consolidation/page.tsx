import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { apiClient } from "@/lib/api/client";
import { notFound } from "next/navigation";
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

  const { shop } = await getActiveWorkspaceContext(slug);

  if (!shop) {
    notFound();
  }

  // Fetch all user's holding groups and owned workspaces
  const [groupsRes, workspacesRes] = await Promise.all([
    apiClient.get<any>("/v1/group-consolidation/groups"),
    apiClient.get<any>("/v1/workspaces/my-workspaces"),
  ]);

  const groups: any[] = groupsRes.data?.groups || [];
  const userShops: any[] = (workspacesRes.data?.workspaces || []).map((w: any) => ({
    id: w.id,
    name: w.name,
    slug: w.slug,
    code: w.code || w.slug?.substring(0, 4).toUpperCase(),
    currency: w.currency || "KES",
  }));

  // Determine active group (from URL or first available)
  const activeGroupId = queryGroupId || groups[0]?.id || null;

  let initialPnL = null;
  let initialBalanceSheet = null;
  let activeGroupDetails = null;

  if (activeGroupId) {
    const [pnlRes, bsRes, grpRes] = await Promise.all([
      apiClient.get<any>(`/v1/group-consolidation/pnl?group_id=${activeGroupId}&period=THIS_MONTH`),
      apiClient.get<any>(`/v1/group-consolidation/balance-sheet?group_id=${activeGroupId}`),
      apiClient.get<any>(`/v1/group-consolidation/groups/${activeGroupId}`),
    ]);

    if (pnlRes.data?.success) initialPnL = pnlRes.data;
    if (bsRes.data?.success) initialBalanceSheet = bsRes.data;
    if (grpRes.data?.success) activeGroupDetails = grpRes.data.group;
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
                members: (activeGroupDetails.memberships || []).map((m: any) => ({
                  id: m.id,
                  shopId: m.shop?.id || m.shopId,
                  shopName: m.shop?.name || "",
                  shopSlug: m.shop?.slug || "",
                  shopCode: m.shop?.code || "",
                  entityType: m.entityType,
                  ownershipPercentage: parseFloat(m.ownershipPercentage || "100"),
                  joinedAt: typeof m.joinedAt === "string" ? m.joinedAt : (m.joinedAt?.toISOString?.() || ""),
                })),
                transactions: (activeGroupDetails.interCompanyTransactions || []).map((tx: any) => ({
                  id: tx.id,
                  sourceShopId: tx.sourceShopId,
                  sourceShopName: tx.sourceShop?.name || "",
                  targetShopId: tx.targetShopId,
                  targetShopName: tx.targetShop?.name || "",
                  amount: parseFloat(tx.amount || "0"),
                  currency: tx.currency,
                  transactionType: tx.transactionType,
                  isEliminated: tx.isEliminated,
                  notes: tx.notes,
                  createdAt: typeof tx.createdAt === "string" ? tx.createdAt : (tx.createdAt?.toISOString?.() || ""),
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
