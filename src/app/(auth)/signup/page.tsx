// src/app/signup/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { registerOwnerAccount } from "@/lib/actions/auth";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Spinner } from "@/components/Spinner";

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center font-mono text-xs text-zinc-500">Loading...</div>}>
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

    try {
      const response = await registerOwnerAccount({
        name,
        email,
        passwordHex: password,
        businessName: businessName || "My Profile",
        inviteToken: inviteToken || undefined,
      });

      if (!response.success) {
        const msg = response.error || "Onboarding pipeline execution failed.";
        setError(msg);
        toast.error(msg, { id: toastId });
        setLoading(false);
      } else {
        toast.success("Account & workspace created successfully!", { id: toastId });
        
        // If they joined via invite, push them to the global dashboard router 
        // so it natively redirects them to the workspace selector (since they now have multiple)
        if (inviteToken) {
            window.location.href = "/dashboard";
        } else if ("shopSlug" in response && response.shopSlug) {
            window.location.href = `/workspaces/${response.shopSlug}`;
        } else {
            window.location.href = "/dashboard";
        }
      }
    } catch (err: any) {
      console.error("Action execution exception:", err);
      const errStr = String(err?.message || err);
      if (errStr.includes("UnrecognizedActionError") || errStr.includes("Server Action")) {
        toast.error("Application updated on server. Syncing latest version...", { id: toastId });
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const msg = err?.message || "An unexpected error occurred. Please try again.";
        setError(msg);
        toast.error(msg, { id: toastId });
        setLoading(false);
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-white text-black selection:bg-black selection:text-white">
      <div className="card-modern w-full max-w-md p-8 space-y-6 bg-white">
        
        <div className="space-y-1.5">
          <Link href="/" className="font-mono text-xs font-semibold tracking-widest text-zinc-400 block hover:underline">
            ← MANNA BOOKS HOME
          </Link>
          <h2 className="text-xl font-semibold tracking-tight uppercase leading-none font-sans text-black">Initialize Ledger</h2>
          <p className="text-xs text-zinc-500 font-mono uppercase font-semibold">Create owner profile &amp; setup shop workspace</p>
        </div>

        {error && (
          <div className="border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs text-black uppercase tracking-tight rounded font-semibold">
            &gt; ERROR: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div className="space-y-1">
            <label className="text-zinc-500 uppercase block font-semibold">Full Legal Name</label>
            <input
              type="text"
              name="name"
              placeholder="e.g., John Doe"
              className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-zinc-500 uppercase block font-semibold">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="e.g., owner@company.com"
              className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-zinc-500 uppercase block font-semibold">
              {inviteToken ? "Optional: Business Name" : "Business / Store Entity Name"}
            </label>
            <input
              type="text"
              name="businessName"
              placeholder="e.g., Manna Hardware"
              className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
              required={!inviteToken}
            />
            {inviteToken && <p className="text-[10px] text-zinc-400 mt-1">Leave blank to skip creating your own workspace.</p>}
          </div>

          <div className="space-y-1">
            <label className="text-zinc-500 uppercase block font-semibold">Master Account Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••••••"
                className="w-full px-3 py-2 pr-12 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-[10px] text-zinc-400 hover:text-black font-semibold uppercase select-none cursor-pointer"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary-modern w-full py-2.5 font-semibold uppercase tracking-wider disabled:bg-zinc-300 text-xs mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size={14} />
                <span>COMPILING REGISTRY...</span>
              </span>
            ) : (
              "CREATE MASTER PROFILE"
            )}
          </button>
        </form>

        <div className="border-t border-zinc-200/80 pt-4 font-mono text-xs text-center">
          <span className="text-zinc-400">Already registered? </span>
          <Link href="/login" className="font-semibold text-black underline hover:no-underline uppercase">
            Log In
          </Link>
        </div>

      </div>
    </div>
  );
}