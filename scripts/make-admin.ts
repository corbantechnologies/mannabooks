import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
    const targetEmail = process.argv[2]?.trim().toLowerCase();

    if (!targetEmail) {
        console.error("❌ Please provide an email address.");
        console.log("Usage: npm run make:admin <email@domain.com>");
        process.exit(1);
    }

    // Dynamically import db after dotenv has populated process.env.DATABASE_URL
    const { db } = await import("../src/db");
    const { users } = await import("../src/db/schema");
    const { eq } = await import("drizzle-orm");

    console.log(`🔍 Searching for account: ${targetEmail}...`);

    const user = await db.query.users.findFirst({
        where: eq(users.email, targetEmail),
    });

    if (!user) {
        console.error(`❌ No user found with email: ${targetEmail}`);
        console.log("Please ensure this user has registered/signed up on MannaBooks first.");
        process.exit(1);
    }

    await db.update(users).set({
        isSuperAdmin: true,
    }).where(eq(users.id, user.id));

    console.log(`👑 SUCCESS! ${user.name || user.email} (${user.email}) has been elevated to Super Admin (ROOT).`);
    console.log(`Access the administrative terminal directly at: http://localhost:3000/admin or https://www.mannabooks.co.ke/admin`);
    process.exit(0);
}

main().catch((err) => {
    console.error("Fatal error executing make-admin script:", err);
    process.exit(1);
});
