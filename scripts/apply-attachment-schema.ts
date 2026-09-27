import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { Client } from "pg";

async function main() {
    console.log("Applying MinIO attachment schema updates to documents and vendor_bills...");

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL not found");
    }

    const client = new Client({
        connectionString,
        connectionTimeoutMillis: 30000,
    });

    await client.connect();
    console.log("Connected to database...");

    // Documents table (for Payment Vouchers & Inbound receipts)
    await client.query("ALTER TABLE documents ADD COLUMN IF NOT EXISTS attachment_url text;");
    await client.query("ALTER TABLE documents ADD COLUMN IF NOT EXISTS attachment_name varchar(255);");
    await client.query("ALTER TABLE documents ADD COLUMN IF NOT EXISTS attachment_size integer;");
    console.log("✓ Added attachment_url, attachment_name, attachment_size to documents");

    // Vendor Bills table
    await client.query("ALTER TABLE vendor_bills ADD COLUMN IF NOT EXISTS attachment_url text;");
    await client.query("ALTER TABLE vendor_bills ADD COLUMN IF NOT EXISTS attachment_name varchar(255);");
    await client.query("ALTER TABLE vendor_bills ADD COLUMN IF NOT EXISTS attachment_size integer;");
    console.log("✓ Added attachment_url, attachment_name, attachment_size to vendor_bills");

    await client.end();
    console.log("✓ MinIO attachment schema applied successfully!");
    process.exit(0);
}

main().catch(err => {
    console.error("Migration error:", err);
    process.exit(1);
});
