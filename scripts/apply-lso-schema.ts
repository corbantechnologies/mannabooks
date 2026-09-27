import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { Client } from "pg";

async function main() {
    console.log("Applying LSO and Service Completion Note schema updates...");

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

    await client.query("ALTER TYPE doc_type ADD VALUE IF NOT EXISTS 'LSO'");
    console.log("✓ Added 'LSO'");

    await client.query("ALTER TYPE doc_type ADD VALUE IF NOT EXISTS 'SERVICE_COMPLETION_NOTE'");
    console.log("✓ Added 'SERVICE_COMPLETION_NOTE'");

    await client.end();
    console.log("✓ LSO and SERVICE_COMPLETION_NOTE enum values added successfully!");
    process.exit(0);
}

main().catch(err => {
    console.error("Migration error:", err);
    process.exit(1);
});
