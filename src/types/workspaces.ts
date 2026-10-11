// src/types/workspaces.ts
/**
 * Pure TypeScript domain definitions for Workspace Directory and Staff Members.
 */

export interface OrganizationStaffMember {
    userId: string;
    name: string;
    email: string;
    memberships: {
        membershipId: string;
        shopId: string;
        shopName: string;
        shopSlug: string;
        role: string;
        isActive: boolean;
        customPermissions: Record<string, boolean>;
    }[];
}

export interface WorkspaceSummary {
    id: string;
    name: string;
    slug: string;
}
