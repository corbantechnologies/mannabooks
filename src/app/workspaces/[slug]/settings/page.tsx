// src/app/workspaces/[slug]/settings/page.tsx
"use client";

import { useEffect, useState, use } from "react";
import { getActiveWorkspaceContext, updateShopSettings } from "@/lib/actions/workspace";
import { useRouter } from "next/navigation";

interface SettingsPageProps {
    params: Promise<{ slug: string }>;
}

export default function WorkspaceSettingsPage({ params }: SettingsPageProps) {
    const router = useRouter();
    const resolvedParams = use(params);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form States
    const [shopId, setShopId] = useState("");
    const [businessName, setBusinessName] = useState("");
    const [taxPin, setTaxPin] = useState("");
    const [isVatRegistered, setIsVatRegistered] = useState(false);
    const [currency, setCurrency] = useState("KES");

    useEffect(() => {
        async function loadContext() {
            try {
                const context = await getActiveWorkspaceContext(resolvedParams.slug);
                setShopId(context.shop.id);
                setBusinessName(context.shop.name);
                setTaxPin(context.shop.taxPin || "");
                setIsVatRegistered(context.shop.isVatRegistered);
                setCurrency(context.shop.currency);
            } catch (err) {
                console.error(err);
                setError("Failed to initialize security and workspace parameters.");
            } finally {
                setLoading(false);
            }
        }
        loadContext();
    }, [resolvedParams.slug]);

    async function handleFormSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setSaving(true);

        // Validation guardrail if tax calculation processing is selected
        if (isVatRegistered && !taxPin) {
            setError("A registered Tax identity PIN is strictly required if VAT processing is active.");
            setSaving(false);
            return;
        }

        if (taxPin) {
            const pinRegex = /^[A-Z]\d{11}[A-Z]$/;
            if (!pinRegex.test(taxPin.toUpperCase().trim())) {
                setError("Invalid statutory PIN format. Ensure it matches official structures.");
                setSaving(false);
                return;
            }
        }

        const res = await updateShopSettings({
            shopId,
            name: businessName,
            taxPin,
            isVatRegistered,
            currency,
        });

        setSaving(false);
        if (!res.success) {
            setError(res.error || "Execution failed.");
        } else {
            setSuccess(true);
            router.refresh(); // Refresh layout sidebar with new business metadata fields
        }
    }

    if (loading) {
        return (
            <div className="p-8 font-mono text-xs text-zinc-400 italic">
                &gt; MOUNTING WORKSPACE NODE CONFIGURATIONS...
            </div>
        );
    }

    return (
        <div className="p-8 max-w-2xl space-y-8 selection:bg-black selection:text-white">
            <div>
                <span className="font-mono text-xs text-zinc-400 uppercase">SYS_PROPERTIES // ENVIRONMENT_CONFIG</span>
                <h1 className="text-3xl font-bold uppercase tracking-tighter mt-1">Compliance & Profile</h1>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6 font-mono text-xs border border-black p-6 bg-white">
                {error && (
                    <div className="border border-black bg-zinc-50 p-3 text-black font-bold uppercase">
                        &gt; STACK_ERROR: {error}
                    </div>
                )}

                {success && (
                    <div className="border border-black bg-black text-white p-3 font-bold uppercase">
                        &gt; SUCCESS: CONFIGURATION MATRIX UPDATE COMMITTED.
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-zinc-400 uppercase block">Trading Profile Name</label>
                    <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black rounded-none"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-zinc-400 uppercase block">Operating Currency</label>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black rounded-none"
                        >
                            <option value="KES">KES(Kenya Shilling)</option>
                            <option value="USD">USD(US Dollar)</option>
                            <option value="EUR">EUR(Euro)</option>
                            <option value="TZS">TZS(Tanzanian Shilling)</option>
                            <option value="UGX">UGX(Ugandan Shilling)</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-zinc-400 uppercase block">Statutory Corporate PIN(KRA PIN)</label>
                        <input
                            type="text"
                            value={taxPin}
                            onChange={(e) => setTaxPin(e.target.value)}
                            placeholder="e.g., P0511XXXXXXZ"
                            className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 uppercase rounded-none"
                        />
                    </div>
                </div>

                <div className="border-t border-dashed border-zinc-200 pt-4 flex items-start gap-3">
                    <input
                        type="checkbox"
                        id="vatActive"
                        checked={isVatRegistered}
                        onChange={(e) => setIsVatRegistered(e.target.checked)}
                        className="w-4 h-4 border border-black accent-black rounded-none mt-0.5 cursor-pointer"
                    />
                    <div className="space-y-1">
                        <label htmlFor="vatActive" className="font-bold uppercase tracking-tight block cursor-pointer select-none">
                            This entity is officially VAT registered
                        </label>
                        <p className="font-sans text-[11px] text-zinc-500 normal-case leading-tight">
                            When checked, the document compiler will automatically process and overlay a standard statutory 16 % VAT layer on all billing items that aren't explicitly marked as Exempt or Zero-Rated.
                        </p>
                    </div>
                </div>

                <div className="border-t border-black pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-black text-white px-6 py-2.5 font-bold uppercase tracking-wider hover:bg-zinc-900 transition-colors disabled:bg-zinc-300 rounded-none"
                    >
                        {saving ? "SAVING PARAMETERS..." : "COMMIT CHANGES"}
                    </button>
                </div>
            </form>
        </div>
    );
}
