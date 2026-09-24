import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
    const { db } = await import("../src/db");
    const { sql } = await import("drizzle-orm");

    console.log("🚀 Starting enterprise modules schema migration...");

    // 1. Create Enums safely
    console.log("Creating enterprise enums...");
    await db.execute(sql`
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_request_type') THEN
                CREATE TYPE approval_request_type AS ENUM (
                    'PURCHASE_ORDER', 'EXPENSE_CLAIM', 'CREDIT_NOTE', 'STOCK_WRITEOFF', 'QUOTE_DISCOUNT', 'INVOICE_CANCELLATION', 'CUSTOM'
                );
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
                CREATE TYPE approval_status AS ENUM (
                    'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'
                );
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_priority') THEN
                CREATE TYPE approval_priority AS ENUM (
                    'LOW', 'NORMAL', 'HIGH', 'URGENT'
                );
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'production_order_status') THEN
                CREATE TYPE production_order_status AS ENUM (
                    'DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
                );
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stocktake_status') THEN
                CREATE TYPE stocktake_status AS ENUM (
                    'DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
                );
            END IF;
        END $$;
    `);

    // 2. Create Approvals Tables
    console.log("Creating approvals tables...");
    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS approval_policies (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
            request_type approval_request_type NOT NULL,
            name VARCHAR(150) NOT NULL,
            min_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
            max_amount NUMERIC(14, 2),
            required_role user_role NOT NULL DEFAULT 'MANAGER',
            auto_approve_below NUMERIC(14, 2) NOT NULL DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS approval_requests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
            policy_id UUID REFERENCES approval_policies(id) ON DELETE SET NULL,
            request_type approval_request_type NOT NULL,
            request_number VARCHAR(50) NOT NULL,
            requester_user_id UUID NOT NULL REFERENCES users(id),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
            currency VARCHAR(10) NOT NULL DEFAULT 'KES',
            priority approval_priority NOT NULL DEFAULT 'NORMAL',
            status approval_status NOT NULL DEFAULT 'PENDING',
            target_entity_type VARCHAR(50) NOT NULL,
            target_entity_id UUID NOT NULL,
            payload_snapshot JSONB,
            decision_by_user_id UUID REFERENCES users(id),
            decision_at TIMESTAMP,
            decision_reason TEXT,
            approval_token VARCHAR(64) UNIQUE,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS approval_timeline (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
            user_id UUID REFERENCES users(id),
            action VARCHAR(50) NOT NULL,
            comment TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `);

    // 3. Create WMS Storage Bins & Batches Tables
    console.log("Creating WMS Storage Bins & Batches tables...");
    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS storage_bins (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
            location_id UUID NOT NULL REFERENCES stock_locations(id) ON DELETE CASCADE,
            zone VARCHAR(50) NOT NULL,
            rack VARCHAR(50),
            shelf VARCHAR(50),
            bin_code VARCHAR(50) NOT NULL,
            description TEXT,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS product_batches (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
            product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            location_id UUID NOT NULL REFERENCES stock_locations(id),
            bin_id UUID REFERENCES storage_bins(id) ON DELETE SET NULL,
            batch_number VARCHAR(100) NOT NULL,
            manufacture_date DATE,
            expiry_date DATE NOT NULL,
            initial_quantity NUMERIC(12, 2) NOT NULL,
            current_quantity NUMERIC(12, 2) NOT NULL,
            cost_price NUMERIC(14, 2) NOT NULL,
            supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `);

    // 4. Create BOM & Production Tables
    console.log("Creating BOM & Production tables...");
    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS bill_of_materials (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
            finished_product_id UUID NOT NULL REFERENCES products(id),
            name VARCHAR(255) NOT NULL,
            labor_cost_estimate NUMERIC(14, 2) DEFAULT 0,
            overhead_cost_estimate NUMERIC(14, 2) DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS bom_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            bom_id UUID NOT NULL REFERENCES bill_of_materials(id) ON DELETE CASCADE,
            raw_material_product_id UUID NOT NULL REFERENCES products(id),
            quantity_required NUMERIC(12, 4) NOT NULL,
            wastage_percentage NUMERIC(5, 2) DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS production_orders (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
            bom_id UUID NOT NULL REFERENCES bill_of_materials(id),
            order_number VARCHAR(50) NOT NULL,
            target_location_id UUID NOT NULL REFERENCES stock_locations(id),
            units_to_produce NUMERIC(12, 2) NOT NULL,
            total_cost_kes NUMERIC(14, 2) NOT NULL DEFAULT 0,
            status production_order_status NOT NULL DEFAULT 'DRAFT',
            completed_at TIMESTAMP,
            notes TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
    `);

    // 5. Create Stocktakes Tables
    console.log("Creating Stocktake Reconciliation tables...");
    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS stocktakes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
            location_id UUID NOT NULL REFERENCES stock_locations(id),
            stocktake_number VARCHAR(50) NOT NULL,
            status stocktake_status NOT NULL DEFAULT 'DRAFT',
            conducted_by_user_id UUID NOT NULL REFERENCES users(id),
            started_at TIMESTAMP NOT NULL DEFAULT NOW(),
            completed_at TIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS stocktake_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            stocktake_id UUID NOT NULL REFERENCES stocktakes(id) ON DELETE CASCADE,
            product_id UUID NOT NULL REFERENCES products(id),
            bin_id UUID REFERENCES storage_bins(id) ON DELETE SET NULL,
            batch_id UUID REFERENCES product_batches(id) ON DELETE SET NULL,
            book_quantity NUMERIC(12, 2) NOT NULL,
            counted_quantity NUMERIC(12, 2) NOT NULL,
            variance_quantity NUMERIC(12, 2) NOT NULL,
            variance_cost_kes NUMERIC(14, 2) NOT NULL,
            notes TEXT
        );
    `);

    // 6. Safe Indexes & Unique Constraints
    console.log("Creating indexes & constraints...");
    await db.execute(sql`
        -- Unique constraints
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_shop_request_number') THEN
                ALTER TABLE approval_requests ADD CONSTRAINT unique_shop_request_number UNIQUE (shop_id, request_number);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_shop_location_bin') THEN
                ALTER TABLE storage_bins ADD CONSTRAINT unique_shop_location_bin UNIQUE (shop_id, location_id, bin_code);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_shop_production_order_number') THEN
                ALTER TABLE production_orders ADD CONSTRAINT unique_shop_production_order_number UNIQUE (shop_id, order_number);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_shop_stocktake_number') THEN
                ALTER TABLE stocktakes ADD CONSTRAINT unique_shop_stocktake_number UNIQUE (shop_id, stocktake_number);
            END IF;
        END $$;

        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_approvals_shop_status ON approval_requests(shop_id, status);
        CREATE INDEX IF NOT EXISTS idx_approvals_requester ON approval_requests(requester_user_id);
        CREATE INDEX IF NOT EXISTS idx_storage_bins_location ON storage_bins(location_id);
        CREATE INDEX IF NOT EXISTS idx_batches_product ON product_batches(product_id);
        CREATE INDEX IF NOT EXISTS idx_batches_expiry ON product_batches(expiry_date);
        CREATE INDEX IF NOT EXISTS idx_batches_location ON product_batches(location_id);
        CREATE INDEX IF NOT EXISTS idx_bom_finished_product ON bill_of_materials(finished_product_id);
        CREATE INDEX IF NOT EXISTS idx_bom_items_bom ON bom_items(bom_id);
        CREATE INDEX IF NOT EXISTS idx_production_orders_shop ON production_orders(shop_id);
        CREATE INDEX IF NOT EXISTS idx_stocktakes_shop ON stocktakes(shop_id);
        CREATE INDEX IF NOT EXISTS idx_stocktake_items_stocktake ON stocktake_items(stocktake_id);
    `);

    console.log("✅ All enterprise database tables, enums, and indexes migrated successfully!");
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
});
