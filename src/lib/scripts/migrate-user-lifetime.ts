import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
    const { db } = await import("../../db");
    const { sql } = await import("drizzle-orm");

    console.log("Adding is_lifetime_pro column to users table if not exists...");
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_lifetime_pro BOOLEAN DEFAULT FALSE NOT NULL;`);
    console.log("✅ is_lifetime_pro column ensured on users table!");

    console.log("Elevating mannabooksconsole@gmail.com to Super Admin & Lifetime PRO...");
    await db.execute(sql`
        UPDATE users 
        SET is_super_admin = true, is_lifetime_pro = true 
        WHERE LOWER(email) = 'mannabooksconsole@gmail.com';
    `);

    console.log("Upgrading all workspaces owned by mannabooksconsole@gmail.com...");
    await db.execute(sql`
        UPDATE shops 
        SET is_lifetime_pro = true, subscription_status = 'LIFETIME_FREE', plan = 'PRO' 
        WHERE owner_id IN (SELECT id FROM users WHERE LOWER(email) = 'mannabooksconsole@gmail.com');
    `);

    console.log("👑 SUCCESS! User and all owned workspaces are now permanently Lifetime PRO.");
    process.exit(0);
}

main().catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
});
