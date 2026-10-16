import { enforceSuperAdmin } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { StatutoryRatesClient } from "./StatutoryRatesClient";

export const dynamic = "force-dynamic";

export default async function AdminStatutoryRatesPage() {
    const adminUser = await enforceSuperAdmin();
    if (!adminUser) {
        redirect("/dashboard");
    }
    return (
        <div className="flex-1 space-y-6">
            <StatutoryRatesClient />
        </div>
    );
}
