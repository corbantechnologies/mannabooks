import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
    const { getShopPlanDetails } = await import("../src/lib/paywall");
    const { db } = await import("../src/db");
    const { shops } = await import("../src/db/schema");
    const { eq } = await import("drizzle-orm");

    const shop = await db.query.shops.findFirst({
        where: eq(shops.slug, "ventures-of-africa"),
    });

    if (!shop) {
        console.log("Shop not found");
        return;
    }

    const details = await getShopPlanDetails(shop.id);
    console.log("=== AFRICAN VENTURES PLAN RESOLUTION ===");
    console.log("Effective Plan:", details?.plan);
    console.log("Plan Name:", details?.planSpec.name);
    console.log("Expires At:", details?.expiresAt);
    console.log("Days Remaining:", details?.daysRemaining);
    console.log("Can Transfer Stock:", details?.canTransferStock);
    console.log("Can Access Payroll:", details?.canAccessPayroll);
    process.exit(0);
}

main().catch(console.error);
