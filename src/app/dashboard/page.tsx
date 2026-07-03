// src/app/dashboard/page.tsx
import { db } from "@/db";
import { shopMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { verifyAndGetSession } from "@/lib/actions/auth";

export default async function DashboardProxyPage() {
  const session = await verifyAndGetSession();
  
  if (!session) {
    redirect("/login");
  }

  // Fetch all active memberships for this user
  const memberships = await db.query.shopMembers.findMany({
    where: and(
      eq(shopMembers.userId, session.userId),
      eq(shopMembers.isActive, true)
    ),
    with: {
      shop: true,
    },
  });

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