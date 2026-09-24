import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
    const { db } = await import("../src/db");
    const { sql } = await import("drizzle-orm");

    console.log("🚀 Starting enterprise roles and scoping migration...");

    // 1. Add new enum values to user_role
    console.log("Adding new roles to user_role enum...");
    await db.execute(sql`
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'STOREKEEPER';
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'CASHIER';
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'DISPATCHER';
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SALES_REP';
    `);

    // 2. Add scoping and security columns to shop_members
    console.log("Adding columns to shop_members...");
    await db.execute(sql`
        ALTER TABLE shop_members ADD COLUMN IF NOT EXISTS assigned_location_ids JSONB DEFAULT '[]'::jsonb NOT NULL;
        ALTER TABLE shop_members ADD COLUMN IF NOT EXISTS hide_cost_prices BOOLEAN DEFAULT false NOT NULL;
        ALTER TABLE shop_members ADD COLUMN IF NOT EXISTS direct_approval_limit NUMERIC(12, 2) DEFAULT 0.00 NOT NULL;
    `);

    // 3. Add scoping and security columns to shop_invitations
    console.log("Adding columns to shop_invitations...");
    await db.execute(sql`
        ALTER TABLE shop_invitations ADD COLUMN IF NOT EXISTS assigned_location_ids JSONB DEFAULT '[]'::jsonb NOT NULL;
        ALTER TABLE shop_invitations ADD COLUMN IF NOT EXISTS hide_cost_prices BOOLEAN DEFAULT false NOT NULL;
        ALTER TABLE shop_invitations ADD COLUMN IF NOT EXISTS direct_approval_limit NUMERIC(12, 2) DEFAULT 0.00 NOT NULL;
    `);

    console.log("✅ Enterprise roles and location scoping successfully migrated!");
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
});
