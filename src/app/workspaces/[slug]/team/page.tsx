import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { apiClient } from "@/lib/api/client";
import { redirect } from "next/navigation";
import { enforcePermission } from "@/lib/actions/rbac";
import TeamManagementClient from "./TeamManagementClient";

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const { shop } = await getActiveWorkspaceContext(slug);

    // Verify they have permission to view/manage team
    try {
        await enforcePermission(shop.id, "manage_team");
    } catch (error) {
        console.error("Permission check failed:", error);
        redirect(`/workspaces/${slug}`);
    }

    const [membersRes, invitesRes] = await Promise.all([
        apiClient.get<any[]>(`/v1/workspaces/${shop.id}/members`),
        apiClient.get<any[]>(`/v1/workspaces/${shop.id}/invitations`),
    ]);

    const membersRaw = membersRes.data || [];
    const allInvites = invitesRes.data || [];

    const members = membersRaw.map((m: any) => {
        let permissions = {};
        try {
            permissions = typeof m.customPermissions === "string" ? JSON.parse(m.customPermissions || "{}") : (m.customPermissions || {});
        } catch {}

        return {
            id: m.id,
            userId: m.userId,
            name: m.user?.name || "Staff Member",
            email: m.user?.email || "—",
            role: m.role,
            isActive: Boolean(m.isActive),
            createdAt: m.createdAt || new Date().toISOString(),
            customPermissions: permissions,
        };
    });

    const safeInvites = allInvites.map((inv: any) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        createdAt: inv.createdAt || new Date().toISOString(),
    }));

    return (
        <div className="p-5 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <span className="text-xs text-zinc-400 font-medium">Access Control &amp; Team</span>
                    <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Team Management</h1>
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
