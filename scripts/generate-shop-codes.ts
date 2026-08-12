import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {``
    const { db } = await import("../src/db");
    const { shops } = await import("../src/db/schema");
    const { eq } = await import("drizzle-orm");

    console.log("Loading all shops to generate codes...");
    const allShops = await db.query.shops.findMany();

    const usedCodes = new Set<string>();

    function cleanCodeName(name: string): string {
        return name
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "")
            .slice(0, 5);
    }

    function generateRandomCode(): string {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "";
        for (let i = 0; i < 5; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    for (const shop of allShops) {
        // If shop already has a code, record it as used and skip
        if (shop.code) {
            usedCodes.add(shop.code.toUpperCase());
            console.log(`Shop "${shop.name}" already has code: ${shop.code}`);
            continue;
        }

        let newCode = "";
        const base = cleanCodeName(shop.shortName || shop.name);
        
        if (base.length >= 3 && !usedCodes.has(base)) {
            newCode = base;
        } else {
            // Try adding numeric suffixes
            let found = false;
            const prefix = base.slice(0, 4);
            for (let i = 1; i <= 9; i++) {
                const candidate = `${prefix}${i}`;
                if (!usedCodes.has(candidate)) {
                    newCode = candidate;
                    found = true;
                    break;
                }
            }
            if (!found) {
                // Fallback to random alphanumeric code
                while (true) {
                    const candidate = generateRandomCode();
                    if (!usedCodes.has(candidate)) {
                        newCode = candidate;
                        break;
                    }
                }
            }
        }

        usedCodes.add(newCode);
        console.log(`Assigning code "${newCode}" to shop "${shop.name}"...`);

        await db.update(shops)
            .set({ code: newCode })
            .where(eq(shops.id, shop.id));
    }

    console.log("Shop codes generation completed!");
    process.exit(0);
}

main().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
