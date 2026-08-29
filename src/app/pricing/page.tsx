// src/app/pricing/page.tsx
import type { Metadata } from "next";
import { PublicNavbar } from "@/components/PublicNavbar";
import { getDynamicPlanSpecs } from "@/lib/paywall";
import { PricingClientView } from "./PricingClientView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Pricing | Manna Books — Simple, Transparent Plans for Kenyan SMEs",
    description:
        "Simple, workspace-based pricing for Manna Books. Start free, scale as your team grows. Basic, Professional, and Enterprise plans available with monthly and annual discounts.",
    openGraph: {
        title: "Manna Books Pricing — Transparent Plans for Every Business",
        description: "Simple workspace-based pricing. One workspace, unlimited invoices. Scale your team with transparent, affordable plans.",
        url: "https://mannabooks.co.ke/pricing",
        siteName: "Manna Books",
        locale: "en_KE",
        type: "website",
    },
    alternates: {
        canonical: "https://mannabooks.co.ke/pricing",
    },
};

export default async function PricingPage() {
    const dynamicSpecs = await getDynamicPlanSpecs();
    const plansList = Object.values(dynamicSpecs);

    return (
        <div className="flex-1 flex flex-col bg-white text-black selection:bg-[#064e3b] selection:text-white font-sans min-h-screen">
            <PublicNavbar />
            <PricingClientView plans={plansList} />
        </div>
    );
}
