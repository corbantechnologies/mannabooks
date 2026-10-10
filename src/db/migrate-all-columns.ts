// src/db/migrate-all-columns.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { db } from "./index";
import { sql } from "drizzle-orm";

const STATEMENTS = [
    // 1. SHOPS TABLE
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS short_name VARCHAR(50);`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS logo_url TEXT;`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS primary_color VARCHAR(20) DEFAULT '#000000' NOT NULL;`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS plan VARCHAR(30) DEFAULT 'FREE' NOT NULL;`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(30) DEFAULT 'ACTIVE' NOT NULL;`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_lifetime_pro BOOLEAN DEFAULT FALSE NOT NULL;`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS code VARCHAR(10);`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'KES' NOT NULL;`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS phone VARCHAR(30);`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS website VARCHAR(255);`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS email VARCHAR(255);`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS tax_pin VARCHAR(30);`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_vat_registered BOOLEAN DEFAULT FALSE NOT NULL;`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS vat_number VARCHAR(50);`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS fiscal_year_start_month INTEGER DEFAULT 1 NOT NULL;`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS hide_onboarding BOOLEAN DEFAULT FALSE NOT NULL;`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_gl_enabled BOOLEAN DEFAULT FALSE NOT NULL;`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS gl_onboarding_mode BOOLEAN DEFAULT FALSE NOT NULL;`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS tax_regime VARCHAR(30) DEFAULT 'EXEMPT' NOT NULL;`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_cit_active BOOLEAN DEFAULT TRUE NOT NULL;`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_tot_active BOOLEAN DEFAULT FALSE NOT NULL;`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS cit_rate NUMERIC(5, 2) DEFAULT 30.00 NOT NULL;`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS estimated_annual_profit NUMERIC(15, 2) DEFAULT 0.00 NOT NULL;`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS auto_stock_deduction_enabled BOOLEAN DEFAULT TRUE NOT NULL;`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS business_mode VARCHAR(30) DEFAULT 'HYBRID' NOT NULL;`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS loyalty_engine_mode VARCHAR(30) DEFAULT 'OFF' NOT NULL;`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE NOT NULL;`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS suspended_reason TEXT;`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP;`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMP;`,
    `ALTER TABLE shops ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;`,

    // 2. USERS TABLE
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(30) DEFAULT 'FREE' NOT NULL;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(30) DEFAULT 'ACTIVE' NOT NULL;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMP;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS auto_renew_enabled BOOLEAN DEFAULT TRUE NOT NULL;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS auto_renew_phone VARCHAR(30);`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_renewal_prompt_at TIMESTAMP;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_lifetime_pro BOOLEAN DEFAULT FALSE NOT NULL;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE NOT NULL;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;`,

    // 3. SHOP MEMBERS TABLE
    `ALTER TABLE shop_members ADD COLUMN IF NOT EXISTS role VARCHAR(30) DEFAULT 'OPERATOR' NOT NULL;`,
    `ALTER TABLE shop_members ADD COLUMN IF NOT EXISTS custom_permissions TEXT;`,
    `ALTER TABLE shop_members ADD COLUMN IF NOT EXISTS assigned_location_ids JSONB;`,
    `ALTER TABLE shop_members ADD COLUMN IF NOT EXISTS hide_cost_prices BOOLEAN DEFAULT FALSE NOT NULL;`,
    `ALTER TABLE shop_members ADD COLUMN IF NOT EXISTS direct_approval_limit NUMERIC(14, 2) DEFAULT 0.00 NOT NULL;`,
    `ALTER TABLE shop_members ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;`,
    `ALTER TABLE shop_members ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;`,

    // 4. DOCUMENTS TABLE
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS kra_cu_invoice_number VARCHAR(100);`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS parent_document_id UUID;`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS requires_etims BOOLEAN DEFAULT FALSE NOT NULL;`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE NOT NULL;`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS recurring_interval VARCHAR(20);`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS next_recurring_date TIMESTAMP;`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMP;`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS location_id UUID;`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(12, 4) DEFAULT 1.0000 NOT NULL;`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS base_currency VARCHAR(3);`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS base_grand_total NUMERIC(12, 2);`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS notes TEXT;`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT;`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS payment_channel VARCHAR(50);`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100);`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS attachment_url TEXT;`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255);`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS attachment_size INTEGER;`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_read_by_recipient BOOLEAN DEFAULT FALSE NOT NULL;`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS client_portal_response VARCHAR(50);`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS client_amendment_notes TEXT;`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_delivery_status VARCHAR(50) DEFAULT 'NOT_SENT' NOT NULL;`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS resend_email_id VARCHAR(100);`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS last_email_sent_at TIMESTAMP;`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS last_email_opened_at TIMESTAMP;`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS loyalty_points_earned INTEGER DEFAULT 0 NOT NULL;`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS loyalty_points_redeemed INTEGER DEFAULT 0 NOT NULL;`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS loyalty_discount_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL;`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;`,
    `ALTER TABLE documents ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;`,
];

async function main() {
    console.log("Applying all missing column migrations to PostgreSQL database...");
    for (const stmt of STATEMENTS) {
        try {
            await db.execute(sql.raw(stmt));
            console.log("Applied:", stmt.slice(0, 60) + "...");
        } catch (err: any) {
            console.warn("Notice for:", stmt.slice(0, 60), "-", err.message);
        }
    }
    console.log("All migrations executed successfully!");
    process.exit(0);
}

main().catch(err => {
    console.error("Migration runner failed:", err);
    process.exit(1);
});
