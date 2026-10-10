import { enforceSuperAdmin } from "@/lib/auth/session";
import { PLAN_SPECS } from "@/lib/paywall";
import { redirect } from "next/navigation";
import { AdminPricingClient } from "./AdminPricingClient";

export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
    const adminUser = await enforceSuperAdmin();
    if (!adminUser) {
        redirect("/dashboard");
    }

    const plans = Object.values(PLAN_SPECS);

    return (
        <div className="flex-1 space-y-6">
            <AdminPricingClient initialPlans={plans} />
        </div>
    );
}
