"use client";
// src/app/onboarding/create-shop/page.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { verifyAndGetSession } from "@/lib/actions/auth";
import Link from "next/link";

import { createAdditionalShop } from "@/lib/actions/workspace";

export default function CreateShopPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [currency, setCurrency] = useState("KES");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!businessName.trim()) {
      setError("Business name is required.");
      return;
    }

    setLoading(true);

    try {
      const session = await verifyAndGetSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const res = await createAdditionalShop({
        userId: session.userId,
        businessName,
        currency,
      });

      if (res.success) {
        router.push(`/workspaces/${res.shopSlug}`);
      }
    } catch {
      setError("Failed to create shop. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center px-6 py-12 selection:bg-black selection:text-white">
      <div className="card-modern w-full max-w-md p-8 space-y-6 bg-white">

        <div className="space-y-1.5">
          <Link href="/dashboard" className="font-mono text-xs font-semibold tracking-widest text-zinc-400 block hover:underline">
            {"<-"} BACK TO DASHBOARD
          </Link>
          <h1 className="text-xl font-semibold tracking-tight uppercase leading-none font-sans text-black">Provision New Shop</h1>
          <p className="text-xs text-zinc-500 font-mono uppercase font-semibold">Register an additional business workspace</p>
        </div>

        {error && (
          <div className="border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs text-black uppercase tracking-tight rounded font-semibold">
            &gt; ERROR: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div className="space-y-1">
            <label className="text-zinc-500 uppercase block font-semibold">Business / Store Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g., Manna Hardware"
              className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-zinc-500 uppercase block font-semibold">Operating Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs font-semibold"
            >
              <option value="KES">KES — Kenya Shilling</option>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="TZS">TZS — Tanzanian Shilling</option>
              <option value="UGX">UGX — Ugandan Shilling</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary-modern w-full py-2.5 font-semibold uppercase tracking-wider disabled:bg-zinc-300 text-xs mt-2"
          >
            {loading ? "PROVISIONING..." : "PROVISION WORKSPACE"}
          </button>
        </form>
      </div>
    </div>
  );
}
