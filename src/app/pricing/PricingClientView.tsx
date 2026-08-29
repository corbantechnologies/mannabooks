"use client";

import { useState } from "react";
import Link from "next/link";
import { type PlanDefinition } from "@/lib/paywall";
import { formatCurrency } from "@/lib/utils";

interface PricingClientViewProps {
  plans: PlanDefinition[];
}

const faqs = [
  {
    q: "Is there a free tier?",
    a: "Yes — the Free Starter plan is 100% free forever. You can create your workspace, add products, generate invoices and receipts, share digital catalogs, and operate the walk-in POS without entering a payment method."
  },
  {
    q: "How does team member quota work?",
    a: "Each plan includes a fixed quota of team members. Basic includes up to 3 members with granular RBAC roles. Professional includes up to 10 team members across multiple workspaces. Enterprise includes unlimited team members."
  },
  {
    q: "How does multi-location stock tracking work?",
    a: "Basic supports up to 3 physical locations with inter-branch stock transfers and audit trails. Professional and Enterprise provide unlimited physical stock locations and warehouses with live valuation."
  },
  {
    q: "What payment methods do you accept?",
    a: "We support instant Lipa Na M-Pesa STK Push online activation, direct Paybill / Till Number payments, Bank EFT/RTGS transfers, and corporate invoicing."
  },
  {
    q: "How much do I save with annual billing?",
    a: "Annual billing gives you a 20% discount (equivalent to getting more than 2 full months free compared to month-to-month billing)."
  },
];

export function PricingClientView({ plans }: PricingClientViewProps) {
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const isAnnual = billingCycle === "ANNUAL";

  return (
    <main className="flex-1 flex flex-col font-sans">
      
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
          Workspace-based pricing means you only pay as your team grows. Start free, upgrade via instant M-Pesa when ready — cancel anytime.
        </p>

        {/* BILLING CYCLE TOGGLE */}
        <div className="pt-4 flex items-center justify-center">
          <div className="inline-flex items-center p-1 rounded-xl bg-zinc-100 border border-zinc-200 font-mono text-xs font-bold">
            <button
              type="button"
              onClick={() => setBillingCycle("MONTHLY")}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                !isAnnual ? "bg-black text-white shadow-xs" : "text-zinc-600 hover:text-black"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("ANNUAL")}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                isAnnual ? "bg-black text-white shadow-xs" : "text-zinc-600 hover:text-black"
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[9px] bg-emerald-400 text-black px-1.5 py-0.5 rounded font-bold">Save 20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="px-6 py-16 max-w-7xl mx-auto w-full bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
          {plans.map((plan) => {
            const isHighlight = Boolean(plan.isHighlighted);
            const displayPrice = isAnnual ? plan.priceKesAnnually : plan.priceKesMonthly;
            const monthlyEquivalent = isAnnual && plan.priceKesAnnually > 0 ? Math.round(plan.priceKesAnnually / 12) : plan.priceKesMonthly;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl p-6 transition-all ${
                  isHighlight
                    ? "border-2 border-[#064e3b] bg-gradient-to-b from-[#064e3b] to-[#022c22] text-white shadow-2xl scale-[1.02] z-10"
                    : "card-emerald-accent bg-white hover:border-emerald-300"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-white text-[#064e3b] text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-200 shadow-xs">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* PLAN HEADER */}
                <div className={`mb-6 pb-6 border-b ${isHighlight ? "border-emerald-400/30" : "border-zinc-200/80"}`}>
                  <h2 className={`font-bold text-xs font-mono uppercase tracking-widest mb-3 ${isHighlight ? "text-emerald-200" : "text-zinc-500"}`}>
                    {plan.name}
                  </h2>
                  
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-3xl sm:text-4xl font-black tracking-tighter">
                      {displayPrice === 0 ? "Free" : formatCurrency(displayPrice, "KES")}
                    </span>
                    {displayPrice > 0 && (
                      <span className={`text-xs font-mono ${isHighlight ? "text-emerald-200" : "text-zinc-400"}`}>
                        {isAnnual ? "/ year" : "/ month"}
                      </span>
                    )}
                  </div>

                  {isAnnual && plan.priceKesAnnually > 0 && (
                    <span className={`text-[11px] font-mono font-bold block ${isHighlight ? "text-emerald-300" : "text-emerald-700"}`}>
                      (equiv. {formatCurrency(monthlyEquivalent, "KES")}/mo)
                    </span>
                  )}

                  <p className={`text-xs mt-3 leading-relaxed ${isHighlight ? "text-emerald-100/80" : "text-zinc-500"}`}>
                    {plan.tagline}
                  </p>
                </div>

                {/* CAPACITY BADGES */}
                <div className="mb-6 space-y-1.5 font-mono text-xs">
                  <div className={`flex items-center justify-between text-[11px] px-3 py-1.5 rounded-lg ${isHighlight ? "bg-white/10 text-emerald-100" : "bg-zinc-50 text-zinc-600 border border-zinc-200/80"}`}>
                    <span>Team Quota:</span>
                    <span className="font-bold">{plan.maxMembers === Infinity ? "Unlimited" : `${plan.maxMembers} Member${plan.maxMembers > 1 ? "s" : ""}`}</span>
                  </div>
                  <div className={`flex items-center justify-between text-[11px] px-3 py-1.5 rounded-lg ${isHighlight ? "bg-white/10 text-emerald-100" : "bg-zinc-50 text-zinc-600 border border-zinc-200/80"}`}>
                    <span>Locations:</span>
                    <span className="font-bold">{plan.maxLocations === Infinity ? "Unlimited" : `${plan.maxLocations} Location${plan.maxLocations > 1 ? "s" : ""}`}</span>
                  </div>
                </div>

                {/* FEATURE BULLETS */}
                <ul className="space-y-2.5 mb-8 flex-1 font-mono text-xs">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[11px] leading-tight">
                      <span className={`font-bold mt-0.5 shrink-0 ${isHighlight ? "text-emerald-300" : "text-emerald-600"}`}>
                        ✓
                      </span>
                      <span className={isHighlight ? "text-emerald-50" : "text-zinc-700"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA BUTTON */}
                <div>
                  <Link
                    href={plan.id === "ENTERPRISE" ? "/contact?subject=Enterprise+Onboarding" : "/signup"}
                    className={`w-full block py-3 rounded-lg text-center font-mono text-xs font-bold uppercase tracking-wider transition-all no-underline ${
                      isHighlight
                        ? "bg-white text-[#064e3b] hover:bg-emerald-50 shadow-md font-black"
                        : "bg-black text-white hover:bg-zinc-800"
                    }`}
                  >
                    {plan.id === "FREE" ? "Get Started Free" : plan.id === "ENTERPRISE" ? "Contact Enterprise Sales" : "Start Workspace"}
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ ACCORDION SECTION */}
      <section className="border-t border-zinc-200/80 px-6 py-16 md:py-20 max-w-4xl mx-auto w-full bg-white space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-zinc-500 font-mono">
            Everything you need to know about plans, billing intervals, and upgrades.
          </p>
        </div>

        <div className="space-y-4 font-sans">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-zinc-200 rounded-xl p-5 bg-zinc-50/50 space-y-1.5">
              <h3 className="font-bold text-sm text-black uppercase tracking-tight font-mono">
                {faq.q}
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
