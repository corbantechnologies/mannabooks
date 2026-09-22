import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getLoyaltyProgram, getMembershipTiers } from "@/lib/actions/loyalty";
import LoyaltySettingsClient from "./LoyaltySettingsClient";

interface LoyaltySettingsPageProps {
    params: Promise<{ slug: string }>;
}

export default async function LoyaltySettingsPage({ params }: LoyaltySettingsPageProps) {
    const { slug } = await params;

    const shop = await db.query.shops.findFirst({
        where: eq(shops.slug, slug),
    });

    if (!shop) notFound();

    const [programRes, tiersRes] = await Promise.all([
        getLoyaltyProgram(shop.id),
        getMembershipTiers(shop.id),
    ]);

    const program = (programRes.success && programRes.data ? programRes.data : null);
    const tiers = (tiersRes.success && tiersRes.data ? tiersRes.data : []);

    return (
        <div className="p-4 sm:p-8 max-w-5xl space-y-8 font-sans">
            {/* TOP HEADER */}
            <div className="space-y-2">
                <Link
                    href={`/workspaces/${slug}/settings`}
                    className="font-sans text-xs font-bold text-zinc-400 hover:underline block"
                >
                    ← Back to Workspace Settings
                </Link>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-100 pb-4">
                    <div>
                        <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                            Customer Retention Engine
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black mt-1">
                            Loyalty &amp; Membership
                        </h1>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Configure points earn rates, redemption discounts, and corporate wholesale tier pricing.
                        </p>
                    </div>
                </div>
            </div>

            <LoyaltySettingsClient
                shopId={shop.id}
                shopSlug={slug}
                currency={shop.currency}
                initialProgram={program}
                initialTiers={tiers}
            />
        </div>
    );
}
