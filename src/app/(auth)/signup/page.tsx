// src/app/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerOwnerAccount } from "@/lib/actions/auth";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(false);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const businessName = formData.get("businessName") as string;

    if (!name || !email || !password || !businessName) {
      const msg = "All tracking fields are strictly required.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Compiling profile & workspace...");

    const response = await registerOwnerAccount({
      name,
      email,
      passwordHex: password,
      businessName,
    });

    if (!response.success) {
      const msg = response.error || "Onboarding pipeline execution failed.";
      setError(msg);
      toast.error(msg, { id: toastId });
      setLoading(false);
    } else {
      toast.success("Account & workspace created successfully!", { id: toastId });
      // Navigate directly to the new workspace if shopSlug is available, else dashboard
      if ("shopSlug" in response && response.shopSlug) {
        router.push(`/workspaces/${response.shopSlug}`);
      } else {
        router.push("/dashboard");
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-white text-black selection:bg-black selection:text-white">
      <div className="w-full max-w-md border border-black p-8 space-y-8 bg-white">
        
        <div className="space-y-2">
          <Link href="/" className="font-mono text-xs font-bold tracking-widest text-zinc-400 block hover:underline">
            ← MANNA BOOKS HOME
          </Link>
          <h2 className="text-2xl font-bold tracking-tighter uppercase leading-none">Initialize Ledger</h2>
          <p className="text-xs text-zinc-500 font-mono uppercase">Create owner profile & setup shop workspace</p>
        </div>

        {error && (
          <div className="border border-black bg-zinc-50 p-3 font-mono text-xs text-black uppercase tracking-tight">
            &gt; ERROR: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div className="space-y-1">
            <label className="text-zinc-500 uppercase block">Full Legal Name</label>
            <input
              type="text"
              name="name"
              placeholder="e.g., John Doe"
              className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 rounded-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-zinc-500 uppercase block">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="e.g., owner@company.com"
              className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 rounded-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-zinc-500 uppercase block">Business / Store Entity Name</label>
            <input
              type="text"
              name="businessName"
              placeholder="e.g., Manna Hardware"
              className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 rounded-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-zinc-500 uppercase block">Master Account Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••••••"
              className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 rounded-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white text-center py-3 font-bold uppercase tracking-wider hover:bg-zinc-900 transition-colors disabled:bg-zinc-300 text-xs rounded-none mt-4"
          >
            {loading ? "COMPILING REGISTRY..." : "CREATE MASTER PROFILE"}
          </button>
        </form>

        <p className="text-center font-mono text-[11px] text-zinc-400">
          Already registered?{" "}
          <Link href="/login" className="text-black underline font-bold uppercase">
            Execute Login
          </Link>
        </p>
      </div>
    </div>
  );
}