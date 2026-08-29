import { enforceSuperAdmin } from "@/lib/actions/admin";
import { getAdminPlatformPlans } from "@/lib/actions/admin-pricing";
import { redirect } from "next/navigation";
import { AdminPricingClient } from "./AdminPricingClient";

export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
    const adminUser = await enforceSuperAdmin();
    if (!adminUser) {
        redirect("/dashboard");
    }

    const res = await getAdminPlatformPlans();
    const plans = res.success && res.plans ? res.plans : [];

    return (
        <div className="flex-1 space-y-6">
            <AdminPricingClient initialPlans={plans} />
        </div>
    );
}
