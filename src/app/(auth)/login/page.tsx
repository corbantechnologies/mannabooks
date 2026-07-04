// src/app/login/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUserAccount } from "@/lib/actions/auth-login";
import Link from "next/link";
import { toast } from "react-hot-toast";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      const msg = "Credentials input parameters are incomplete.";
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    const toastId = toast.loading("Authenticating credentials...");
    try {
      const response = await loginUserAccount({ email, passwordHex: password });

      if (!response.success) {
        const msg = response.error || "Authentication handshake rejected.";
        setError(msg);
        toast.error(msg, { id: toastId });
        setLoading(false);
      } else {
        toast.success("Login successful!", { id: toastId });
        // Full page navigation ensures HTTP session cookie is attached instantly
        window.location.href = callbackUrl;
      }
    } catch (err: any) {
      console.error("Login action error:", err);
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
    <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-white selection:bg-black selection:text-white">
      <div className="card-modern w-full max-w-sm p-8 space-y-6 bg-white">
        
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold tracking-tight uppercase leading-none font-sans text-black">Log In</h2>
          <p className="text-xs text-zinc-500 font-mono uppercase font-semibold">Enter credentials to open ledger node</p>
        </div>

        {error && (
          <div className="border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs text-black uppercase tracking-tight rounded font-semibold">
            &gt; ERROR: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div className="space-y-1">
            <label className="text-zinc-500 uppercase block font-semibold">Account Email</label>
            <input
              type="email"
              name="email"
              className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-zinc-500 uppercase block font-semibold">Account Password</label>
            <input
              type="password"
              name="password"
              className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary-modern w-full py-2.5 font-semibold uppercase tracking-wider disabled:bg-zinc-300 text-xs mt-2"
          >
            {loading ? "AUTHENTICATING..." : "LOG IN TO CONSOLE"}
          </button>
        </form>

        <div className="border-t border-zinc-200/80 pt-4 font-mono text-xs text-center">
          <span className="text-zinc-400">New operator? </span>
          <Link href="/signup" className="font-semibold text-black underline hover:no-underline uppercase">
            Initialize Account
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex justify-center items-center font-mono text-xs uppercase">Loading login portal...</div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}