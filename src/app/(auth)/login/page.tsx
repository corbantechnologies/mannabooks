// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUserAccount } from "@/lib/actions/auth-login";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
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
    const response = await loginUserAccount({ email, passwordHex: password });

    if (!response.success) {
      const msg = response.error || "Authentication handshake rejected.";
      setError(msg);
      toast.error(msg, { id: toastId });
      setLoading(false);
    } else {
      toast.success("Login successful!", { id: toastId });
      router.push("/dashboard");
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-white selection:bg-black selection:text-white">
      <div className="w-full max-w-sm border border-black p-8 space-y-8 bg-white">
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tighter uppercase leading-none">Console Log In</h2>
          <p className="text-xs text-zinc-500 font-mono uppercase">Enter credentials to open ledger node</p>
        </div>

        {error && (
          <div className="border border-black bg-zinc-50 p-3 font-mono text-xs text-black uppercase tracking-tight">
            &gt; ERROR: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div className="space-y-1">
            <label className="text-zinc-500 uppercase block">Account Email</label>
            <input
              type="email"
              name="email"
              className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black rounded-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-zinc-500 uppercase block">Account Password</label>
            <input
              type="password"
              name="password"
              className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black rounded-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white text-center py-3 font-bold uppercase tracking-wider hover:bg-zinc-900 transition-colors disabled:bg-zinc-300 text-xs rounded-none mt-2"
          >
            {loading ? "AUTHORIZING NODE..." : "ESTABLISH CONNECTION"}
          </button>
        </form>

        <p className="text-center font-mono text-[11px] text-zinc-400">
          New ledger group?{" "}
          <Link href="/signup" className="text-black underline font-bold uppercase">
            Initialize Here
          </Link>
        </p>
      </div>
    </div>
  );
}