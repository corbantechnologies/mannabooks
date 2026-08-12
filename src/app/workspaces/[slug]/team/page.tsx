import { db } from "@/db";
import { shopMembers, shops, shopInvitations } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { enforcePermission } from "@/lib/actions/rbac";
import TeamManagementClient from "./TeamManagementClient";

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const shop = await db.query.shops.findFirst({
        where: eq(shops.slug, slug)
    });

    if (!shop) {
        redirect("/dashboard");
    }

    // Verify they have permission to view/manage team
    let canManageTeam = false;
    try {
        await enforcePermission(shop.id, "manage_team");
        canManageTeam = true;
    } catch (error) {
        console.error("Permission check failed:", error);
        redirect(`/workspaces/${slug}`);
    }

    const membersRaw = await db.query.shopMembers.findMany({
        where: eq(shopMembers.shopId, shop.id),
        with: {
            user: true
        },
        orderBy: [desc(shopMembers.createdAt)]
    });

    const allInvites = await db.query.shopInvitations.findMany({
        where: eq(shopInvitations.shopId, shop.id),
        orderBy: [desc(shopInvitations.createdAt)]
    });

    const members = membersRaw.map(m => ({
        id: m.id,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        isActive: m.isActive,
        createdAt: m.createdAt.toISOString(),
        customPermissions: JSON.parse(m.customPermissions || "{}")
    }));

    const safeInvites = allInvites.map(inv => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        createdAt: inv.createdAt.toISOString(),
    }));

    return (
        <div className="p-4 sm:p-8 space-y-12 selection:bg-black selection:text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/80 pb-6">
                <div>
                    <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Access Control & Team</span>
                    <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Team Management</h1>
                </div>
            </div>

            <TeamManagementClient 
                shopId={shop.id} 
                initialMembers={members} 
                initialInvites={safeInvites}
            />
        </div>
    );
}
