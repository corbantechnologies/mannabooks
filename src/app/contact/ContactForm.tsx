// src/app/contact/ContactForm.tsx
"use client";

import { useState } from "react";
import { submitContactForm } from "@/lib/actions/contact";
import { toast } from "react-hot-toast";

const SUBJECTS = [
    "Pricing & Plans",
    "Enterprise Onboarding",
    "Technical Support",
    "KRA eTIMS Integration",
    "Partnership Inquiry",
    "Custom Integration Request",
    "General Question",
];

export function ContactForm() {
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const form = e.currentTarget;
        const data = new FormData(form);

        const toastId = toast.loading("Sending your message...");

        const res = await submitContactForm({
            name: data.get("name") as string,
            email: data.get("email") as string,
            company: data.get("company") as string,
            phone: data.get("phone") as string,
            subject: data.get("subject") as string,
            message: data.get("message") as string,
        });

        setLoading(false);

        if (res.success) {
            toast.success("Message sent! We'll be in touch soon.", { id: toastId });
            setSent(true);
        } else {
            toast.error(res.error || "Something went wrong. Please try again.", { id: toastId });
        }
    }

    if (sent) {
        return (
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-8 shadow-sm text-center space-y-5">
                <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                </div>
                <div>
                    <h3 className="text-lg font-bold uppercase tracking-tight text-black">Message Received</h3>
                    <p className="text-sm text-zinc-500 mt-2 leading-relaxed">Check your inbox — we&apos;ve sent you a confirmation. Our team will respond within 1–2 business days.</p>
                </div>
                <button
                    onClick={() => setSent(false)}
                    className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500 hover:text-black underline"
                >
                    Send another message
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-8 shadow-sm">
            <div className="mb-6">
                <h2 className="text-base font-bold uppercase tracking-tight text-black">Send us a message</h2>
                <p className="text-xs text-zinc-500 mt-1 font-mono">All fields marked * are required.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-500 block">Full Name *</label>
                        <input
                            type="text"
                            name="name"
                            placeholder="Jane Kamau"
                            required
                            className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-sm placeholder:text-zinc-300"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-500 block">Email Address *</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="jane@company.com"
                            required
                            className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-sm placeholder:text-zinc-300"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-500 block">Company / Business</label>
                        <input
                            type="text"
                            name="company"
                            placeholder="Acme Enterprises Ltd"
                            className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-sm placeholder:text-zinc-300"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-500 block">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            placeholder="+254 712 345 678"
                            className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-sm placeholder:text-zinc-300"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-500 block">Subject *</label>
                    <select
                        name="subject"
                        required
                        className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-sm text-black"
                    >
                        <option value="" disabled>Select a topic...</option>
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-500 block">Message *</label>
                    <textarea
                        name="message"
                        required
                        rows={5}
                        placeholder="Tell us about your business and what you need..."
                        className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-sm resize-none placeholder:text-zinc-300"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary-modern w-full py-3 text-xs font-bold uppercase tracking-widest disabled:bg-zinc-300 disabled:cursor-not-allowed"
                >
                    {loading ? "Sending..." : "Send Message →"}
                </button>

                <p className="text-[10px] text-zinc-400 font-mono text-center">
                    By submitting this form, you agree to our{" "}
                    <a href="/privacy" className="underline hover:text-black">Privacy Policy</a>.
                </p>
            </form>
        </div>
    );
}
