import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
    console.log("Applying 3-Way Matching and Group Consolidation schema updates...");

    const { db } = await import("../src/db");
    const { sql } = await import("drizzle-orm");

    await db.execute(sql`
        ALTER TABLE vendor_bills ADD COLUMN IF NOT EXISTS source_po_id uuid REFERENCES documents(id) ON DELETE SET NULL;
        ALTER TABLE vendor_bills ADD COLUMN IF NOT EXISTS source_grn_id uuid REFERENCES documents(id) ON DELETE SET NULL;
        ALTER TABLE vendor_bills ADD COLUMN IF NOT EXISTS matching_status varchar(30) DEFAULT 'UNMATCHED' NOT NULL;
        ALTER TABLE vendor_bills ADD COLUMN IF NOT EXISTS price_variance_amount numeric(12, 2) DEFAULT 0.00 NOT NULL;
        ALTER TABLE vendor_bills ADD COLUMN IF NOT EXISTS quantity_variance_count numeric(12, 2) DEFAULT 0.00 NOT NULL;
        ALTER TABLE vendor_bills ADD COLUMN IF NOT EXISTS variance_notes text;

        ALTER TABLE vendor_bill_items ADD COLUMN IF NOT EXISTS po_item_id uuid;
        ALTER TABLE vendor_bill_items ADD COLUMN IF NOT EXISTS po_unit_price numeric(12, 2);
        ALTER TABLE vendor_bill_items ADD COLUMN IF NOT EXISTS grn_quantity numeric(12, 2);

        CREATE TABLE IF NOT EXISTS group_entities (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            name varchar(150) NOT NULL,
            code varchar(20) NOT NULL UNIQUE,
            reporting_currency varchar(3) DEFAULT 'KES' NOT NULL,
            owner_id uuid NOT NULL REFERENCES users(id),
            description text,
            created_at timestamp DEFAULT now() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS group_memberships (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            group_id uuid NOT NULL REFERENCES group_entities(id) ON DELETE CASCADE,
            shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
            entity_type varchar(30) DEFAULT 'SUBSIDIARY' NOT NULL,
            ownership_percentage numeric(5, 2) DEFAULT 100.00 NOT NULL,
            joined_at timestamp DEFAULT now() NOT NULL,
            CONSTRAINT unique_group_shop UNIQUE (group_id, shop_id)
        );

        CREATE TABLE IF NOT EXISTS inter_company_transactions (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            group_id uuid NOT NULL REFERENCES group_entities(id) ON DELETE CASCADE,
            source_shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
            target_shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
            source_document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
            target_bill_id uuid REFERENCES vendor_bills(id) ON DELETE SET NULL,
            amount numeric(15, 2) NOT NULL,
            currency varchar(3) DEFAULT 'KES' NOT NULL,
            transaction_type varchar(50) DEFAULT 'MANAGEMENT_SERVICES' NOT NULL,
            is_eliminated boolean DEFAULT true NOT NULL,
            notes text,
            created_at timestamp DEFAULT now() NOT NULL
        );
    `);

    console.log("✓ Schema migration executed successfully!");
    process.exit(0);
}

main().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
