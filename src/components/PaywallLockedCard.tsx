"use client";

import Link from "next/link";

interface PaywallLockedCardProps {
    shopSlug: string;
    featureName: string;
    requiredPlan?: "BASIC" | "PRO" | "ENTERPRISE";
    description?: string;
    benefits?: string[];
}

export function PaywallLockedCard({
    shopSlug,
    featureName,
    requiredPlan = "PRO",
    description,
    benefits = [],
}: PaywallLockedCardProps) {
    const planName = requiredPlan === "BASIC" ? "Basic" : requiredPlan === "PRO" ? "Professional" : "Enterprise";
    const priceText = requiredPlan === "BASIC" ? "KES 1,500 / month" : "KES 3,500 / month";

    return (
        <div className="max-w-2xl mx-auto my-12 bg-white border border-zinc-200/80 rounded-2xl p-8 sm:p-10 shadow-sm font-sans text-center space-y-6 relative overflow-hidden">
            
            {/* Background subtle badge */}
            <div className="w-16 h-16 bg-zinc-100 border border-zinc-200 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-xs">
                🔒
            </div>

            <div className="space-y-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                    {planName} Feature Locked
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black mt-2">
                    Unlock {featureName}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 max-w-md mx-auto leading-relaxed">
                    {description || `This module requires an active ${planName} subscription (${priceText}) to process advanced financial transactions and reporting.`}
                </p>
            </div>

            {benefits.length > 0 && (
                <div className="bg-zinc-50 border border-zinc-200/70 rounded-xl p-4 text-left max-w-md mx-auto space-y-2 font-mono text-xs text-zinc-700">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        Included in {planName}:
                    </span>
                    {benefits.map((b, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>{b}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 font-mono text-xs">
                <Link
                    href={`/workspaces/${shopSlug}/settings/billing`}
                    className="w-full sm:w-auto bg-black hover:bg-zinc-800 text-white font-bold uppercase px-6 py-3 rounded-lg shadow-sm transition-colors no-underline flex items-center justify-center gap-2"
                >
                    <span>⚡</span>
                    <span>Upgrade via M-Pesa ({priceText})</span>
                </Link>
                <Link
                    href={`/workspaces/${shopSlug}`}
                    className="w-full sm:w-auto bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-bold uppercase px-5 py-3 rounded-lg transition-colors no-underline text-center"
                >
                    Back to Workspace
                </Link>
            </div>

            <div className="pt-2 text-[10px] font-mono text-zinc-400">
                Lipa Na M-Pesa STK Push instant activation • Cancel anytime • 100% Tax Compliant
            </div>

        </div>
    );
}
