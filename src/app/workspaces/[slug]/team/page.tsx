import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { redirect } from "next/navigation";
import TeamManagementClient from "./TeamManagementClient";

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const { shop, role } = await getActiveWorkspaceContext(slug);

    if (role && role !== "OWNER" && role !== "ADMIN") {
        redirect(`/workspaces/${slug}`);
    }

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
            />
        </div>
    );
}
