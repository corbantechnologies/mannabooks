// src/app/pricing/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/PublicNavbar";

export const metadata: Metadata = {
    title: "Pricing | Manna Books — Simple, Transparent Plans for Kenyan SMEs",
    description:
        "Simple, workspace-based pricing for Manna Books. Start free, scale as your team grows. Basic, Professional, and Enterprise plans available.",
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

const plans = [
    {
        name: "Starter",
        price: "Free",
        priceNote: "Forever",
        description: "Perfect for solo operators, traders, and freelancers getting started.",
        highlight: false,
        badge: null,
        workspaces: 1,
        teamMembers: 1,
        features: [
            "1 Workspace",
            "Owner account only",
            "Unlimited invoices & receipts",
            "Shareable digital product catalog",
            "Walk-in POS sales terminal",
            "Stock quantity tracking",
            "Client & supplier directory",
            "Vector PDF generation & rate cards",
            "Passwordless client portals",
            "Basic analytics dashboard",
        ],
        cta: "Get Started Free",
        ctaHref: "/signup",
        ctaVariant: "secondary",
    },
    {
        name: "Basic",
        price: "KES 1,500",
        priceNote: "per month",
        description: "For small teams and growing retail/service businesses that need collaboration.",
        highlight: true,
        badge: "Most Popular",
        workspaces: 1,
        teamMembers: 3,
        features: [
            "1 Workspace",
            "Up to 3 team members",
            "All Starter features",
            "Curated WhatsApp catalog sharing",
            "Role-based access control (RBAC)",
            "Team email invitation system",
            "Statutory payroll (PAYE, SHIF, AHL, NSSF)",
            "Operating expenses tracker",
            "20th VAT return automation",
            "A/R aging & gross margin analytics",
            "Priority email & WhatsApp support",
        ],
        cta: "Initialize Workspace",
        ctaHref: "/signup",
        ctaVariant: "primary",
    },
    {
        name: "Professional",
        price: "KES 3,500",
        priceNote: "per month",
        description: "For established businesses with larger teams and multiple warehouse locations.",
        highlight: false,
        badge: null,
        workspaces: 3,
        teamMembers: 10,
        features: [
            "Up to 3 Workspaces",
            "Up to 10 team members per workspace",
            "All Basic features",
            "Multi-workspace switching",
            "Unlimited digital catalog models",
            "Multi-location inventory (warehouses & stores)",
            "Auditable stock ledger & branch transfers",
            "Double-Entry General Ledger & Budgets",
            "Multi-currency billing (KES, USD, GBP, EUR)",
            "COGS & gross margin intelligence",
            "Dedicated account manager",
        ],
        cta: "Contact Sales",
        ctaHref: "/contact?subject=Professional+Plan",
        ctaVariant: "secondary",
    },
    {
        name: "Enterprise",
        price: "Custom",
        priceNote: "Talk to us",
        description: "For large organizations with custom requirements, integrations, and SLA compliance.",
        highlight: false,
        badge: null,
        workspaces: -1,
        teamMembers: -1,
        features: [
            "Unlimited Workspaces",
            "Unlimited team members",
            "All Professional features",
            "Custom KRA eTIMS server integration",
            "SSO & advanced security governance",
            "Custom ERP & API integrations",
            "White-label branding options",
            "SLA-backed 99.9% uptime guarantee",
            "On-site team training & onboarding",
            "24/7 dedicated technical support",
        ],
        cta: "Contact Sales",
        ctaHref: "/contact?subject=Enterprise+Onboarding",
        ctaVariant: "secondary",
    },
];

const faqs = [
    {
        q: "Is there a free trial?",
        a: "Yes — the Starter plan is completely free forever. You can create your workspace, add products, generate invoices, share digital catalogs, and run the POS without entering a credit card."
    },
    {
        q: "How does team member billing work?",
        a: "Each plan includes a fixed number of team members per workspace. A team member is any user (Admin, Manager, Accountant, Employee, or Viewer) invited to your workspace beyond the owner."
    },
    {
        q: "Can I have multiple workspaces?",
        a: "The Starter and Basic plans support one workspace. Professional supports up to 3 workspaces (e.g., for different branches or separate legal entities). Enterprise supports unlimited workspaces."
    },
    {
        q: "What payment methods do you accept?",
        a: "We accept M-Pesa (Paybill & Till), bank transfers, and credit/debit card payments for subscription billing. Invoicing is monthly or annual."
    },
    {
        q: "Do you offer annual billing discounts?",
        a: "Yes — annual billing comes with a 2-month discount (equivalent to paying 10 months for 12 full months). Contact us to activate an annual plan."
    },
];

export default function PricingPage() {
    return (
        <div className="flex-1 flex flex-col bg-white text-black selection:bg-[#064e3b] selection:text-white font-sans min-h-screen">
            <PublicNavbar />

            <main className="flex-1 flex flex-col">

                {/* HERO */}
                <section className="border-b border-zinc-200/80 px-6 py-16 md:py-20 max-w-7xl mx-auto w-full text-center space-y-6 bg-white">
                    <div className="inline-flex items-center gap-2 border border-emerald-200 px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-widest bg-emerald-50 rounded-full font-semibold text-[#064e3b]">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Simple, transparent pricing
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter leading-none uppercase text-black">
                        Pay for what<br />
                        <span className="gradient-text-emerald">you actually use.</span>
                    </h1>
                    <p className="text-base md:text-lg text-zinc-600 max-w-2xl mx-auto font-normal leading-relaxed">
                        Workspace-based pricing means you only pay as your team grows. Start free, upgrade when ready — no lock-in, no hidden fees.
                    </p>
                </section>

                {/* PRICING CARDS */}
                <section className="px-6 py-16 max-w-7xl mx-auto w-full bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`relative flex flex-col rounded-2xl p-6 transition-all ${
                                    plan.highlight
                                        ? "border-2 border-[#064e3b] bg-gradient-to-b from-[#064e3b] to-[#022c22] text-white shadow-2xl scale-[1.03] z-10"
                                        : "card-emerald-accent bg-white hover:border-emerald-300"
                                }`}
                            >
                                {plan.badge && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="bg-white text-[#064e3b] text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-200 shadow-sm">
                                            {plan.badge}
                                        </span>
                                    </div>
                                )}

                                {/* PLAN HEADER */}
                                <div className={`mb-6 pb-6 border-b ${plan.highlight ? "border-emerald-400/30" : "border-zinc-200/80"}`}>
                                    <h2 className={`font-bold text-xs font-mono uppercase tracking-widest mb-3 ${plan.highlight ? "text-emerald-200" : "text-zinc-500"}`}>
                                        {plan.name}
                                    </h2>
                                    <div className="flex items-baseline gap-1.5 mb-2">
                                        <span className="text-3xl font-black tracking-tighter">{plan.price}</span>
                                        <span className={`text-xs font-mono ${plan.highlight ? "text-emerald-200" : "text-zinc-400"}`}>{plan.priceNote}</span>
                                    </div>
                                    <p className={`text-xs leading-relaxed ${plan.highlight ? "text-emerald-100" : "text-zinc-500"}`}>{plan.description}</p>
                                </div>

                                {/* LIMITS */}
                                <div className={`flex gap-3 mb-5 p-3 rounded-xl ${plan.highlight ? "bg-white/10" : "bg-emerald-50/50 border border-emerald-100"}`}>
                                    <div className="text-center flex-1">
                                        <p className={`text-lg font-black ${plan.highlight ? "text-white" : "text-black"}`}>
                                            {plan.workspaces === -1 ? "∞" : plan.workspaces}
                                        </p>
                                        <p className={`text-[9px] font-mono uppercase font-semibold ${plan.highlight ? "text-emerald-200" : "text-zinc-500"}`}>Workspace{plan.workspaces !== 1 ? "s" : ""}</p>
                                    </div>
                                    <div className={`w-px ${plan.highlight ? "bg-white/20" : "bg-emerald-200"}`} />
                                    <div className="text-center flex-1">
                                        <p className={`text-lg font-black ${plan.highlight ? "text-white" : "text-black"}`}>
                                            {plan.teamMembers === -1 ? "∞" : plan.teamMembers}
                                        </p>
                                        <p className={`text-[9px] font-mono uppercase font-semibold ${plan.highlight ? "text-emerald-200" : "text-zinc-500"}`}>Team Members</p>
                                    </div>
                                </div>

                                {/* FEATURES */}
                                <ul className="space-y-2.5 flex-1 mb-6">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex items-start gap-2.5">
                                            <svg className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${plan.highlight ? "text-emerald-300" : "text-[#064e3b]"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                                            <span className={`text-xs leading-relaxed ${plan.highlight ? "text-emerald-100" : "text-zinc-600"}`}>{f}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                <Link
                                    href={plan.ctaHref}
                                    className={`block text-center py-3 px-4 rounded-lg font-mono text-xs font-bold uppercase tracking-widest transition-all ${
                                        plan.highlight
                                            ? "bg-white text-[#064e3b] hover:bg-emerald-50 shadow-md font-bold"
                                            : "btn-secondary-emerald"
                                    }`}
                                >
                                    {plan.cta}
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>

                {/* COMPARISON NOTE */}
                <section className="px-6 pb-8 max-w-7xl mx-auto w-full bg-white">
                    <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-5 text-center">
                        <p className="text-sm text-[#064e3b] font-sans">
                            <strong>Note:</strong> All plans include full access to digital product catalogs, invoicing, POS, payroll, expenses, analytics, and vector PDF generation. 
                            Pricing is in Kenyan Shillings (KES) and billed monthly. Annual plans available with 2 months free.
                        </p>
                    </div>
                </section>

                {/* FAQ */}
                <section className="px-6 py-16 border-t border-zinc-200/80 max-w-4xl mx-auto w-full space-y-10 bg-white">
                    <div className="text-center">
                        <span className="font-mono text-[10px] text-[#064e3b] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest font-semibold inline-block mb-3">
                            Frequently Asked
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-black font-sans">Pricing Questions</h2>
                    </div>
                    <div className="space-y-4">
                        {faqs.map((faq) => (
                            <div key={faq.q} className="card-emerald-accent p-5 hover:border-emerald-300 transition-all bg-white">
                                <h3 className="font-bold text-sm text-black mb-2">{faq.q}</h3>
                                <p className="text-sm text-zinc-600 leading-relaxed font-sans">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* BOTTOM CTA */}
                <section className="border-t border-zinc-200/80 bg-zinc-950 text-white py-20 px-6 text-center space-y-6">
                    <div className="max-w-2xl mx-auto space-y-5">
                        <span className="font-mono text-[10px] text-emerald-300 uppercase tracking-widest font-semibold block">Not sure which plan is right for you?</span>
                        <h2 className="text-2xl sm:text-4xl font-bold uppercase tracking-tight font-sans">
                            Talk to our team.
                        </h2>
                        <p className="text-sm text-zinc-400 font-sans leading-relaxed">
                            Our team can walk you through the right plan for your business size and requirements. No sales pressure — just honest guidance.
                        </p>
                        <div className="pt-2 flex flex-col sm:flex-row gap-4 justify-center font-mono text-xs">
                            <Link href="/contact" className="btn-primary-emerald px-10 py-4 text-xs font-bold uppercase tracking-wider inline-block">
                                Contact Sales →
                            </Link>
                            <Link href="/signup" className="border border-zinc-700 text-zinc-300 hover:border-emerald-400 hover:text-white px-10 py-4 text-xs font-semibold uppercase tracking-wider inline-block rounded transition-all">
                                Start Free
                            </Link>
                        </div>
                    </div>
                </section>

            </main>

            {/* FOOTER */}
            <footer className="border-t border-zinc-200/80 px-6 py-8 flex flex-col sm:flex-row justify-between items-center bg-zinc-50 text-xs text-zinc-500 font-mono gap-4">
                <p>© 2026 Manna Books LTD. All rights reserved. Powered by <Link href="https://corbantechnologies.org/" target="_blank" className="hover:underline text-[#064e3b] font-semibold">Corban Technologies LTD</Link></p>
                <div className="flex gap-6">
                    <Link href="/features" className="hover:underline hover:text-[#064e3b]">Features</Link>
                    <Link href="/pricing" className="hover:underline hover:text-[#064e3b]">Pricing</Link>
                    <Link href="/guide" className="hover:underline hover:text-[#064e3b]">Guide</Link>
                    <Link href="/terms" className="hover:underline hover:text-[#064e3b]">Terms</Link>
                    <Link href="/privacy" className="hover:underline hover:text-[#064e3b]">Privacy</Link>
                </div>
            </footer>
        </div>
    );
}
