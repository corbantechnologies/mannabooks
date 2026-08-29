import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
    const { db } = await import("../../db");
    const { sql } = await import("drizzle-orm");

    console.log("Ensuring user subscription columns exist in database...");
    await db.execute(sql`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(30) DEFAULT 'FREE' NOT NULL;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(30) DEFAULT 'ACTIVE' NOT NULL;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_lifetime_pro BOOLEAN DEFAULT FALSE NOT NULL;
    `);

    console.log("Setting baseline default plan = 'FREE' for standard users...");
    await db.execute(sql`
        UPDATE users 
        SET plan = 'FREE', is_lifetime_pro = false, subscription_status = 'ACTIVE'
        WHERE is_super_admin = false AND is_lifetime_pro = false;
    `);

    console.log("Ensuring ROOT account mannabooksconsole@gmail.com is Lifetime PRO...");
    await db.execute(sql`
        UPDATE users 
        SET is_super_admin = true, is_lifetime_pro = true, plan = 'PRO', subscription_status = 'LIFETIME_FREE'
        WHERE LOWER(email) = 'mannabooksconsole@gmail.com';
    `);

    console.log("Syncing shops to match their owner user plans...");
    await db.execute(sql`
        UPDATE shops 
        SET plan = users.plan, 
            is_lifetime_pro = (users.is_lifetime_pro OR users.is_super_admin),
            subscription_status = CASE 
                WHEN (users.is_lifetime_pro OR users.is_super_admin) THEN 'LIFETIME_FREE'
                ELSE 'ACTIVE'
            END
        FROM users 
        WHERE shops.owner_id = users.id;
    `);

    console.log("👑 SUCCESS! User-Centric subscriptions aligned across all accounts and workspaces.");
    process.exit(0);
}

main().catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
});
