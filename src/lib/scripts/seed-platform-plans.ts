import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
    const { db } = await import("../../db");
    const { platformPlans } = await import("../../db/schema");
    const { PLAN_SPECS } = await import("../paywall");

    console.log("Seeding platform plans table with standard default plans...");

    for (const [idx, plan] of Object.values(PLAN_SPECS).entries()) {
        await db.insert(platformPlans).values({
            id: plan.id,
            name: plan.name,
            tagline: plan.tagline,
            priceKesMonthly: plan.priceKesMonthly,
            priceKesAnnually: plan.priceKesAnnually,
            annualDiscountPercent: plan.annualDiscountPercent,
            maxMembers: plan.maxMembers === Infinity ? -1 : plan.maxMembers,
            maxLocations: plan.maxLocations === Infinity ? -1 : plan.maxLocations,
            canTransferStock: plan.canTransferStock,
            hasGeneralLedger: plan.hasGeneralLedger,
            hasReconciliation: plan.hasReconciliation,
            hasStatutoryPayroll: plan.hasStatutoryPayroll,
            hasApiAccess: plan.hasApiAccess,
            badge: plan.badge,
            isHighlighted: plan.isHighlighted || false,
            featuresJson: JSON.stringify(plan.features),
            isActive: true,
            displayOrder: idx,
        }).onConflictDoUpdate({
            target: platformPlans.id,
            set: {
                name: plan.name,
                tagline: plan.tagline,
                priceKesMonthly: plan.priceKesMonthly,
                priceKesAnnually: plan.priceKesAnnually,
                annualDiscountPercent: plan.annualDiscountPercent,
                maxMembers: plan.maxMembers === Infinity ? -1 : plan.maxMembers,
                maxLocations: plan.maxLocations === Infinity ? -1 : plan.maxLocations,
                canTransferStock: plan.canTransferStock,
                hasGeneralLedger: plan.hasGeneralLedger,
                hasReconciliation: plan.hasReconciliation,
                hasStatutoryPayroll: plan.hasStatutoryPayroll,
                hasApiAccess: plan.hasApiAccess,
                badge: plan.badge,
                isHighlighted: plan.isHighlighted || false,
                featuresJson: JSON.stringify(plan.features),
                isActive: true,
                displayOrder: idx,
            }
        });
        console.log(`✓ Seeded ${plan.name} (${plan.id})`);
    }

    const all = await db.query.platformPlans.findMany();
    console.log(`\n✅ Done! Total active platform plans in database: ${all.length}`);
    for (const p of all) {
        console.log(` - [${p.id}] ${p.name}: KES ${p.priceKesMonthly}/mo | KES ${p.priceKesAnnually}/yr`);
    }
    process.exit(0);
}

main().catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
});
