import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
    const { db } = await import("../src/db");
    const { shops, users, billingTransactions } = await import("../src/db/schema");
    const { eq } = await import("drizzle-orm");

    const allShops = await db.query.shops.findMany({
        with: {
            owner: true,
        }
    });

    console.log("=== SHOPS IN DATABASE ===");
    for (const s of allShops) {
        console.log(`Shop: [${s.slug}] "${s.name}" | Shop Plan: ${s.plan} | Owner: ${s.owner?.email} (User Plan: ${s.owner?.plan}, Lifetime: ${s.owner?.isLifetimePro})`);
    }

    const txs = await db.query.billingTransactions.findMany();
    console.log("\n=== BILLING TRANSACTIONS ===");
    for (const t of txs) {
        console.log(`TX [${t.id}] Target: ${t.targetPlan} | Status: ${t.status} | Receipt: ${t.mpesaReceiptNumber} | ShopId: ${t.shopId}`);
    }

    process.exit(0);
}

main().catch(console.error);
