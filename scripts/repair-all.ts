import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
    // Dynamically import to ensure dotenv.config() loads environment variables first
    const { db } = await import("../src/db");
    const { repairLedgerAction } = await import("../src/lib/actions/documents");

    console.log("Loading shops from database...");
    const allShops = await db.query.shops.findMany();
    console.log(`Found ${allShops.length} workspace(s). Rebuilding ledgers sequentially...`);
    
    for (const shop of allShops) {
        console.log(`Repairing workspace: "${shop.name}" (${shop.id})...`);
        const res = await repairLedgerAction(shop.id, shop.slug, true);
        if (res.success) {
            console.log(`✓ Successfully repaired: "${shop.name}"`);
        } else {
            console.error(`✕ Failed to repair: "${shop.name}":`, res.error);
        }
    }
    
    console.log("Ledger repair complete for all workspaces!");
    process.exit(0);
}

main().catch(err => {
    console.error("Critical failure during ledger repair script execution:", err);
    process.exit(1);
});
