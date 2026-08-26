// src/app/contact/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/PublicNavbar";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
    title: "Contact Us | Manna Books — Kenyan Business Accounting Platform",
    description:
        "Get in touch with the Manna Books team. We're here to help with enterprise onboarding, custom integrations, partnership inquiries, and platform questions.",
    openGraph: {
        title: "Contact Manna Books — We're Here to Help",
        description: "Reach out to the Manna Books team for enterprise onboarding, pricing, or technical support. We respond within 1–2 business days.",
        url: "https://mannabooks.co.ke/contact",
        siteName: "Manna Books",
        locale: "en_KE",
        type: "website",
    },
    alternates: {
        canonical: "https://mannabooks.co.ke/contact",
    },
};

export default function ContactPage() {
    return (
        <div className="flex-1 flex flex-col bg-white text-black selection:bg-[#064e3b] selection:text-white font-sans min-h-screen">
            <PublicNavbar />

            <main className="flex-1 flex flex-col">

                {/* HERO */}
                <section className="border-b border-zinc-200/80 px-6 py-16 md:py-24 max-w-7xl mx-auto w-full bg-white">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                        
                        {/* LEFT: COPY */}
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 border border-emerald-200 px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-widest bg-emerald-50 rounded-full font-semibold text-[#064e3b]">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Response within 1–2 business days
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter leading-none uppercase text-black">
                                Let&apos;s talk<br />
                                <span className="gradient-text-emerald">business.</span>
                            </h1>
                            <p className="text-base text-zinc-600 leading-relaxed max-w-lg font-sans">
                                Whether you&apos;re exploring Manna Books for your team, need a custom enterprise plan, or have a technical question — our team is ready to assist.
                            </p>

                            {/* CONTACT POINTS */}
                            <div className="space-y-4 pt-2">
                                {[
                                    {
                                        label: "General Inquiries",
                                        value: "business@corbantechnologies.org",
                                        href: "mailto:business@corbantechnologies.org",
                                        icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
                                    },
                                    {
                                        label: "Platform & Billing",
                                        value: "mannabooks.co.ke",
                                        href: "https://mannabooks.co.ke",
                                        icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9",
                                    },
                                ].map((item) => (
                                    <a key={item.label} href={item.href} className="card-emerald-accent flex items-center gap-4 p-4 rounded-xl hover:border-emerald-300 transition-all group bg-white">
                                        <div className="w-9 h-9 border border-emerald-200 rounded-lg flex items-center justify-center bg-emerald-50 shrink-0 group-hover:bg-[#064e3b] group-hover:border-[#064e3b] transition-all">
                                            <svg className="w-4 h-4 text-[#064e3b] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={item.icon}/></svg>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">{item.label}</p>
                                            <p className="text-sm font-semibold text-black group-hover:text-[#064e3b] transition-colors">{item.value}</p>
                                        </div>
                                    </a>
                                ))}
                            </div>

                            {/* DIVIDER */}
                            <div className="pt-4 border-t border-zinc-200/80 space-y-3">
                                <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest font-semibold">What we can help with</p>
                                <div className="flex flex-wrap gap-2">
                                    {["Enterprise Onboarding", "Custom Integrations", "Digital Product Catalogs", "KRA eTIMS Questions", "Team & Pricing Plans", "Technical Support", "Partnership Inquiries"].map(t => (
                                        <span key={t} className="border border-emerald-200 text-[#064e3b] text-[10px] font-mono font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50/50">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: FORM */}
                        <ContactForm />
                    </div>
                </section>

            </main>

            {/* FOOTER */}
            <footer className="border-t border-zinc-200/80 px-6 py-8 flex flex-col sm:flex-row justify-between items-center bg-zinc-50 text-xs text-zinc-500 font-mono gap-4">
                <p>© 2026 Manna Books LTD. All rights reserved. Powered by <Link href="https://corbantechnologies.org/" target="_blank" className="hover:underline text-[#064e3b] font-semibold" rel="noreferrer">Corban Technologies LTD</Link></p>
                <div className="flex gap-6">
                    <Link href="/features" className="hover:underline hover:text-[#064e3b]">Features</Link>
                    <Link href="/pricing" className="hover:underline hover:text-[#064e3b]">Pricing</Link>
                    <Link href="/terms" className="hover:underline hover:text-[#064e3b]">Terms</Link>
                    <Link href="/privacy" className="hover:underline hover:text-[#064e3b]">Privacy</Link>
                </div>
            </footer>
        </div>
    );
}
