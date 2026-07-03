// src/app/dashboard/page.tsx
import { db } from "@/db";
import { shopMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";

// Placeholder function: Replace this with your actual NextAuth/Better Auth 
// or custom JWT cookie retrieval logic later in Tasks 1.1 and 1.2
async function getServerSession() {
  // Simulating a dummy authenticated session lookup for the shop owner
  const mockUserEmail = "owner@mannabooks.com"; 
  
  const userRecord = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, mockUserEmail),
  });

  return userRecord ? { userId: userRecord.id } : null;
}

export default async function DashboardProxyPage() {
  // 1. Verify user session presence
  const session = await getServerSession();
  
  if (!session) {
    redirect("/login");
  }

  // 2. Query the bridge membership table to locate their active shop workspace
  const activeMembership = await db.query.shopMembers.findFirst({
    where: and(
      eq(shopMembers.userId, session.userId),
      eq(shopMembers.isActive, true)
    ),
    with: {
      shop: true, // Hydrates the associated shop fields automatically
    },
  });

  // 3. If they don't have an active shop membership, drop them to an onboarding screen
  if (!activeMembership || !activeMembership.shop) {
    redirect("/onboarding/create-shop");
  }

  // 4. Proxy/Redirect the user seamlessly into their specific branded URL workspace slug
  // For example: /workspaces/manna-hardware
  redirect(`/workspaces/${activeMembership.shop.slug}`);
}