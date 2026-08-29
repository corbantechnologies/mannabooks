import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
    const { db } = await import("../src/db");
    const { shops, users } = await import("../src/db/schema");
    const { eq } = await import("drizzle-orm");

    console.log("Aligning venturesofafrica@gmail.com to BASIC plan in users table...");

    const user = await db.query.users.findFirst({
        where: eq(users.email, "venturesofafrica@gmail.com"),
    });

    if (user) {
        const d = new Date();
        d.setDate(d.getDate() + 30);

        await db.update(users).set({
            plan: "BASIC",
            subscriptionStatus: "ACTIVE",
            subscriptionExpiresAt: d,
        }).where(eq(users.id, user.id));

        await db.update(shops).set({
            plan: "BASIC",
            subscriptionStatus: "ACTIVE",
            subscriptionExpiresAt: d,
        }).where(eq(shops.ownerId, user.id));

        console.log(`✅ Successfully updated user "${user.name}" (${user.email}) to BASIC plan!`);
    } else {
        console.log("User not found.");
    }

    process.exit(0);
}

main().catch(console.error);
