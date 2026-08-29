import { db } from "../src/db";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
    const targetEmail = process.argv[2]?.trim().toLowerCase();

    if (!targetEmail) {
        console.error("❌ Please provide an email address.");
        console.log("Usage: npx ts-node scripts/make-admin.ts <email@domain.com>");
        process.exit(1);
    }

    console.log(`🔍 Searching for account: ${targetEmail}...`);

    const user = await db.query.users.findFirst({
        where: eq(users.email, targetEmail),
    });

    if (!user) {
        console.error(`❌ No user found with email: ${targetEmail}`);
        process.exit(1);
    }

    await db.update(users).set({
        isSuperAdmin: true,
    }).where(eq(users.id, user.id));

    console.log(`👑 SUCCESS! ${user.name} (${user.email}) has been elevated to Super Admin (ROOT).`);
    console.log(`You can now log in and access the administrative terminal at /admin`);
    process.exit(0);
}

main().catch((err) => {
    console.error("Fatal error executing make-admin script:", err);
    process.exit(1);
});
