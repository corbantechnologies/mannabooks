import { db } from "../src/db";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import * as readline from "readline/promises";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function main() {
    console.log("\n=========================================");
    console.log("   MANNA BOOKS: SUPER ADMIN SETUP   ");
    console.log("=========================================\n");

    const name = await rl.question("Enter Admin Full Name: ");
    const email = await rl.question("Enter Admin Email: ");
    const password = await rl.question("Enter Secure Password (min 8 chars): ");

    if (password.length < 8) {
        console.error("\n[!] Error: Password must be at least 8 characters.");
        process.exit(1);
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
        console.log(`\n[*] Checking if user ${normalizedEmail} exists...`);
        const existing = await db.query.users.findFirst({
            where: eq(users.email, normalizedEmail)
        });

        const passwordHash = await bcrypt.hash(password, 10);

        if (existing) {
            console.log(`[*] User exists. Elevating to Super Admin and updating password...`);
            await db.update(users)
                .set({
                    passwordHash,
                    isSuperAdmin: true
                })
                .where(eq(users.id, existing.id));
        } else {
            console.log(`[*] Creating new Super Admin account...`);
            await db.insert(users).values({
                name,
                email: normalizedEmail,
                passwordHash,
                isSuperAdmin: true
            });
        }

        console.log("\n[+] SUCCESS! Super Admin account provisioned securely.");
        console.log("[+] You can now log in and access the /admin dashboard.\n");
    } catch (error) {
        console.error("\n[!] FATAL ERROR: Database operation failed.");
        console.error(error);
    } finally {
        rl.close();
        process.exit(0);
    }
}

main();
