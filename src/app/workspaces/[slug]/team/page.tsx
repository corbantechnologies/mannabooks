import { db } from "@/db";
import { shopMembers, shops } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { enforcePermission } from "@/lib/actions/rbac";
import TeamManagementClient from "./TeamManagementClient";

export default async function TeamPage({ params }: { params: { slug: string } }) {
    const shop = await db.query.shops.findFirst({
        where: eq(shops.slug, params.slug)
    });

    if (!shop) {
        redirect("/dashboard");
    }

    // Verify they have permission to view/manage team
    let canManageTeam = false;
    try {
        await enforcePermission(shop.id, "manage_team");
        canManageTeam = true;
    } catch {
        // If they can't manage team, redirect them to dashboard (or show a permission denied UI)
        redirect(`/workspaces/${params.slug}`);
    }

    const membersRaw = await db.query.shopMembers.findMany({
        where: eq(shopMembers.shopId, shop.id),
        with: {
            user: true
        },
        orderBy: [desc(shopMembers.createdAt)]
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

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-black">Team Management</h1>
                    <p className="text-sm text-zinc-500 font-mono mt-1">Manage workspace roles and granular permissions.</p>
                </div>
            </div>

            <TeamManagementClient shopId={shop.id} initialMembers={members} />
        </div>
    );
}
