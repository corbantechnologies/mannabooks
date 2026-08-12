import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
    const { db } = await import("../src/db");
    const { createBillingDocument } = await import("../src/lib/actions/documents");
    const { generateUniqueShopCode } = await import("../src/lib/actions/shopCode");
    const { shops, documents } = await import("../src/db/schema");
    const { eq, desc } = await import("drizzle-orm");

    console.log("=== Verification Step 1: Shop Code Generation ===");
    const testCode = await generateUniqueShopCode();
    console.log("Generated code:", testCode);
    if (testCode.length !== 5 || !/^[A-Z0-9]+$/.test(testCode)) {
        throw new Error("FAIL: Code is not 5-character alphanumeric uppercase!");
    }
    console.log("PASS: Code is 5-character alphanumeric uppercase.");

    console.log("\n=== Verification Step 2: Document Creation with Prefix & Max-Sequence ===");
    // Find the shop CORBA
    const shop = await db.query.shops.findFirst({
        where: eq(shops.code, "CORBA")
    });

    if (!shop) {
        throw new Error("FAIL: Corban Technologies shop not found in DB.");
    }

    console.log("Shop Info:", { id: shop.id, name: shop.name, code: shop.code });

    // Let's create an invoice for this shop and verify its docNumber
    // Note: We know last document was INV-FY26-0009. The new sequence should be CORBA-INV-FY26-0010.
    const result = await createBillingDocument({
        shopId: shop.id,
        shopSlug: shop.slug,
        type: "INVOICE",
        dueDate: new Date(),
        items: [
            {
                description: "Verification Consulting Item",
                quantity: 2,
                unitPrice: 1500,
                taxType: "EXEMPT"
            }
        ]
    });

    console.log("Billing Document Creation Result:", result);
    if (!result.success) {
        throw new Error(`FAIL: Failed to create billing document: ${result.error}`);
    }

    const createdDoc = await db.query.documents.findFirst({
        where: eq(documents.id, result.documentId)
    });

    if (!createdDoc) {
        throw new Error("FAIL: Created document not found in DB.");
    }

    console.log("Created Document Number:", createdDoc.docNumber);
    if (!createdDoc.docNumber.startsWith("CORBA-INV-FY")) {
        throw new Error(`FAIL: Document number "${createdDoc.docNumber}" does not start with CORBA-INV-FY`);
    }
    console.log("PASS: Document number is correctly formatted and prefixed.");

    // Clean up: delete the test document so we don't leave garbage in the DB
    console.log("\n=== Verification Step 3: Cleanup ===");
    await db.delete(documents).where(eq(documents.id, createdDoc.id));
    console.log("PASS: Test document cleaned up successfully.");

    console.log("\nALL VERIFICATIONS PASSED SUCCESSFULLY!");
    process.exit(0);
}

main().catch(err => {
    console.error("Verification failed:", err);
    process.exit(1);
});
