// src/db/migrate-terms.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { db } from "./index";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Running direct schema migration for shop_terms and terms_and_conditions...");

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS shop_terms (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
            title VARCHAR(100) NOT NULL,
            content TEXT NOT NULL,
            is_default_invoice BOOLEAN NOT NULL DEFAULT false,
            is_default_catalog BOOLEAN NOT NULL DEFAULT false,
            display_order INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `);
    console.log("✓ Table shop_terms created or verified.");

    await db.execute(sql`
        ALTER TABLE documents 
        ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT;
    `);
    console.log("✓ Column terms_and_conditions added to documents.");

    try {
        await db.execute(sql`
            CREATE UNIQUE INDEX IF NOT EXISTS unique_shop_user 
            ON shop_members (shop_id, user_id);
        `);
        console.log("✓ Unique index unique_shop_user created on shop_members.");
    } catch (e: any) {
        console.log("Note on unique index:", e.message);
    }

    console.log("Migration finished successfully!");
    process.exit(0);
}

main().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
