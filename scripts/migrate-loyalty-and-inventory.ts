import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { Pool } from "pg";

async function runMigration() {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is missing from environment layout contexts.");
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 10000,
    });

    const client = await pool.connect();

    try {
        console.log("🚀 Running database migration for Inventory Automation & Loyalty Engine...");

        await client.query("BEGIN;");

        // 1. Create Enums if they don't exist
        await client.query(`
            DO $$ BEGIN
                CREATE TYPE loyalty_engine_mode AS ENUM ('OFF', 'POINTS_ONLY', 'TIERS_ONLY', 'HYBRID');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await client.query(`
            DO $$ BEGIN
                CREATE TYPE loyalty_movement_type AS ENUM ('EARN', 'REDEEM', 'MANUAL_ADJUST', 'EXPIRE', 'WALLET_TOPUP', 'WALLET_DEBIT', 'VOID');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // 2. Add columns to shops table
        await client.query(`
            ALTER TABLE shops 
            ADD COLUMN IF NOT EXISTS auto_stock_deduction_enabled BOOLEAN NOT NULL DEFAULT true,
            ADD COLUMN IF NOT EXISTS loyalty_engine_mode loyalty_engine_mode NOT NULL DEFAULT 'OFF';
        `);

        // 3. Add columns to documents table
        await client.query(`
            ALTER TABLE documents 
            ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES stock_locations(id) ON DELETE SET NULL,
            ADD COLUMN IF NOT EXISTS loyalty_points_earned INTEGER NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS loyalty_points_redeemed INTEGER NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS loyalty_discount_amount NUMERIC(12, 2) NOT NULL DEFAULT '0.00';
        `);

        // 4. Create loyalty_programs table
        await client.query(`
            CREATE TABLE IF NOT EXISTS loyalty_programs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                shop_id UUID NOT NULL UNIQUE REFERENCES shops(id) ON DELETE CASCADE,
                is_enabled BOOLEAN NOT NULL DEFAULT false,
                engine_mode loyalty_engine_mode NOT NULL DEFAULT 'HYBRID',
                program_name VARCHAR(100) NOT NULL DEFAULT 'Rewards Club',
                earn_rate_kes NUMERIC(10, 2) NOT NULL DEFAULT '100.00',
                point_value_kes NUMERIC(10, 2) NOT NULL DEFAULT '1.00',
                min_redeem_points INTEGER NOT NULL DEFAULT 50,
                points_expiry_days INTEGER,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
        `);

        // 5. Create membership_tiers table
        await client.query(`
            CREATE TABLE IF NOT EXISTS membership_tiers (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
                name VARCHAR(50) NOT NULL,
                min_spend_kes NUMERIC(12, 2) NOT NULL DEFAULT '0.00',
                discount_percent NUMERIC(5, 2) NOT NULL DEFAULT '0.00',
                points_multiplier NUMERIC(4, 2) NOT NULL DEFAULT '1.00',
                badge_color VARCHAR(20) NOT NULL DEFAULT '#71717a',
                display_order INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
        `);

        // 6. Create client_loyalty_accounts table
        await client.query(`
            CREATE TABLE IF NOT EXISTS client_loyalty_accounts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
                client_id UUID NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
                member_number VARCHAR(50) NOT NULL UNIQUE,
                tier_id UUID REFERENCES membership_tiers(id) ON DELETE SET NULL,
                current_points INTEGER NOT NULL DEFAULT 0,
                lifetime_points INTEGER NOT NULL DEFAULT 0,
                wallet_balance_kes NUMERIC(12, 2) NOT NULL DEFAULT '0.00',
                membership_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
                expires_at TIMESTAMP,
                created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
        `);

        // 7. Create loyalty_ledger table
        await client.query(`
            CREATE TABLE IF NOT EXISTS loyalty_ledger (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
                account_id UUID NOT NULL REFERENCES client_loyalty_accounts(id) ON DELETE CASCADE,
                movement_type loyalty_movement_type NOT NULL,
                points_delta INTEGER NOT NULL DEFAULT 0,
                wallet_delta_kes NUMERIC(12, 2) NOT NULL DEFAULT '0.00',
                running_points_balance INTEGER NOT NULL,
                running_wallet_balance_kes NUMERIC(12, 2) NOT NULL,
                source_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
                notes TEXT,
                created_by_id UUID REFERENCES users(id),
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
            );
        `);

        await client.query("COMMIT;");
        console.log("✅ Migration completed successfully!");
    } catch (err) {
        await client.query("ROLLBACK;");
        console.error("❌ Migration failed:", err);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration().catch(console.error);
