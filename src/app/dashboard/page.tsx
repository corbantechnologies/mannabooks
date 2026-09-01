import { db } from "@/db";
import { shopMembers, shops } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { verifyAndGetSession } from "@/lib/actions/auth";

export default async function DashboardProxyPage() {
  const session = await verifyAndGetSession();
  
  if (!session) {
    redirect("/login");
  }

  // 1. If the logged in account is a Super Admin (ROOT), land directly on the platform terminal
  if (session.user?.isSuperAdmin) {
    redirect("/admin");
  }

  // Fetch all active memberships for this user
  let memberships = await db.query.shopMembers.findMany({
    where: and(
      eq(shopMembers.userId, session.userId),
      eq(shopMembers.isActive, true)
    ),
    with: {
      shop: true,
    },
  });

  // Auto-heal: Check if this user owns shops directly in the shops table
  const ownedShops = await db.query.shops.findMany({
    where: eq(shops.ownerId, session.userId),
  });

  let didHeal = false;
  for (const shop of ownedShops) {
    if (!memberships.some(m => m.shopId === shop.id)) {
      try {
        await db.insert(shopMembers).values({
          shopId: shop.id,
          userId: session.userId,
          role: "OWNER",
          isActive: true,
        }).onConflictDoNothing();
        didHeal = true;
      } catch (e) {}
    }
  }

  if (didHeal) {
    memberships = await db.query.shopMembers.findMany({
      where: and(
        eq(shopMembers.userId, session.userId),
        eq(shopMembers.isActive, true)
      ),
      with: {
        shop: true,
      },
    });
  }

  if (memberships.length === 0) {
    // If they have no shop at all, force them to the initial shop creation screen
    redirect("/onboarding/create-shop");
  }

  if (memberships.length === 1 && memberships[0].shop) {
    // Solo shop account; jump straight into the workspace
    redirect(`/workspaces/${memberships[0].shop.slug}`);
  }

  // Multiple shops detected; route to the workspace multi-listing board
  redirect("/workspaces");
}