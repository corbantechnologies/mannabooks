import { config } from 'dotenv';
config({ path: '.env.local' });

import { Pool } from 'pg';

async function runMigration() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is missing');
    }

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    console.log('Connecting to database...');
    const client = await pool.connect();

    try {
        console.log('Starting migration for Phase 1 (Employees extension & Expense Claims)...');

        await client.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employment_type') THEN
                    CREATE TYPE employment_type AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN');
                END IF;
            END $$;

            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_claim_status') THEN
                    CREATE TYPE expense_claim_status AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'DISBURSED');
                END IF;
            END $$;

            ALTER TABLE employees
            ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL,
            ADD COLUMN IF NOT EXISTS department VARCHAR(100),
            ADD COLUMN IF NOT EXISTS designation VARCHAR(100),
            ADD COLUMN IF NOT EXISTS employment_type employment_type NOT NULL DEFAULT 'FULL_TIME',
            ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
            ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50),
            ADD COLUMN IF NOT EXISTS bank_branch VARCHAR(100),
            ADD COLUMN IF NOT EXISTS mpesa_phone VARCHAR(30);

            CREATE TABLE IF NOT EXISTS expense_claims (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
                employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
                claim_number VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                amount NUMERIC(15, 2) NOT NULL,
                claim_date DATE NOT NULL,
                category expense_category NOT NULL DEFAULT 'OFFICE_SUPPLIES',
                cost_center_id UUID REFERENCES cost_centers(id) ON DELETE SET NULL,
                receipt_url TEXT,
                status expense_claim_status NOT NULL DEFAULT 'DRAFT',
                approved_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
                approved_at TIMESTAMP,
                approval_notes TEXT,
                disbursed_expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
                disbursed_at TIMESTAMP,
                created_at TIMESTAMP NOT NULL DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_expense_claims_shop ON expense_claims(shop_id);
            CREATE INDEX IF NOT EXISTS idx_expense_claims_employee ON expense_claims(employee_id);
            CREATE INDEX IF NOT EXISTS idx_expense_claims_status ON expense_claims(status);
        `);

        console.log('Migration executed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
